// FIXME To remove in the future
/// <reference types="./types/postcss-preset-env" />

import path from 'path';
import glob from 'glob';
import postcssPresetEnv from 'postcss-preset-env';
import sass from 'sass';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import PurgecssPlugin from 'purgecss-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackTagsPlugin from 'html-webpack-tags-plugin';
import { execSync } from 'child_process';

import myPackage from './package.json';
import { getPackageNameFromPath } from './src/utils/getPackageNameFromPath';

// WTF
//
// webpack has multiple options for production and development modes:
// -p and -d, see https://webpack.js.org/api/cli/#shortcuts
// --mode=production and --mode=development, see https://webpack.js.org/concepts/mode/
// Of course -p is not identical to --mode=production => that would be too easy
// -p seems to be a superset of --mode=production
// With -p you get minified CSS, with --mode=production you don't
//
// This guide https://webpack.js.org/guides/production/ explains another way
// to generate a production build using webpack-merge with TWO webpack.config.js
//
// To complexify things, [mini-css-extract-plugin documentation](https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production)
// explains that: "While webpack 5 is likely to come with a CSS minimizer built-in, with webpack 4 you need to bring your own."
// so what is -p with --optimize-minimize?
// I've compared the Bootstrap .css output with -p and the official bootstrap.min.css => same sizes: 140 kB

// webpack-dev-server output is bigger than a regular build because it includes more things

export default (_webpackEnv: any, argv: any) => {
  // See https://github.com/webpack/webpack/issues/6460#issuecomment-364286147
  const isProd = argv.mode === 'production';

  const output = `[name].${isProd ? 'production.min' : 'development'}`;

  const config: webpack.Configuration = {
    entry: './src/index.tsx',

    output: {
      path: path.join(__dirname, 'build'),
      filename: `${output}.js`,
      publicPath: '/'
    },

    resolve: {
      extensions: ['.js', '.ts', '.tsx']
    },

    module: {
      rules: [
        {
          test: /\.(js|tsx?)$/,

          // See [Babel should not transpile core-js](https://github.com/zloirock/core-js/issues/514#issuecomment-476533317)
          exclude: /\/core-js/,

          loader: 'babel-loader'
        },
        {
          // FIXME Don't know how to make source maps work
          // See [SourceMap not working with Webpack 4.8.1](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/141)
          test: /\.scss$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : { loader: 'style-loader' },
            { loader: 'css-loader', options: { sourceMap: !isProd } },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [postcssPresetEnv],
                sourceMap: !isProd
              }
            },
            { loader: 'sass-loader', options: { implementation: sass, sourceMap: !isProd } }
          ]
        }
      ]
    },

    plugins: [
      new CopyWebpackPlugin([{ from: './src/assets/favicons', to: 'favicons' }]),

      isProd && new MiniCssExtractPlugin({ filename: `${output}.css` }),

      isProd && new PurgecssPlugin({ paths: glob.sync('src/**/*', { nodir: true }) }),

      new HtmlWebpackPlugin({
        description: myPackage.description,
        version: isProd ? `${myPackage.version}-production` : `${myPackage.version}-development`,
        date: new Date().toISOString(),

        // See [Get hash of most recent git commit in Node](https://stackoverflow.com/a/35778030/990356)
        rev: execSync('git rev-parse HEAD')
          .toString()
          .trim(),

        template: './src/index.html',
        hash: isProd
      }),

      new HtmlWebpackTagsPlugin({
        // Generates:
        //
        // <link rel="apple-touch-icon" sizes="180x180" href="${publicPath}/favicons/apple-touch-icon.png?e9e79af8c2643426d1a8" />
        // <link rel="icon" type="image/png" sizes="32x32" href="${publicPath}/favicons/favicon-32x32.png?e9e79af8c2643426d1a8" />
        // <link rel="icon" type="image/png" sizes="16x16" href="${publicPath}/favicons/favicon-16x16.png?e9e79af8c2643426d1a8" />
        // <link rel="manifest" href="${publicPath}/favicons/site.webmanifest?e9e79af8c2643426d1a8" />
        // <link rel="mask-icon" href="${publicPath}/favicons/safari-pinned-tab.svg?e9e79af8c2643426d1a8" color="#ed1d24" />
        // <link rel="shortcut icon" href="${publicPath}/favicons/favicon.ico?e9e79af8c2643426d1a8" />
        //
        // FYI The icons have been generated by RealFaviconGenerator v0.16 using Marvel-favicon.svg
        links: [
          {
            path: 'favicons/apple-touch-icon.png',
            attributes: { rel: 'apple-touch-icon', sizes: '180x180' }
          },
          {
            path: 'favicons/favicon-32x32.png',
            attributes: { rel: 'icon', type: 'image/png', sizes: '32x32' }
          },
          {
            path: 'favicons/favicon-16x16.png',
            attributes: { rel: 'icon', type: 'image/png', sizes: '16x16' }
          },
          {
            path: 'favicons/site.webmanifest',
            attributes: { rel: 'manifest' }
          },
          {
            path: 'favicons/safari-pinned-tab.svg',
            attributes: { rel: 'mask-icon', color: '#ed1d24' }
          },
          {
            path: 'favicons/favicon.ico',
            attributes: { rel: 'shortcut icon' }
          }
        ],

        // Generates:
        //
        // <meta name="msapplication-TileColor" content="#ed1d24" />
        // <meta name="msapplication-config" content="${publicPath}/favicons/browserconfig.xml?e9e79af8c2643426d1a8" />
        // <meta name="theme-color" content="#ffffff" />
        metas: [
          { attributes: { name: 'msapplication-TileColor', content: '#ed1d24' } },
          { path: 'favicons/browserconfig.xml', attributes: { name: 'msapplication-config' } },
          { attributes: { name: 'theme-color', content: '#ffffff' } }
        ],

        append: false, // We want the favicons to be before main.css

        hash: true
      })
    ] as webpack.Plugin[],

    devServer: {
      // See [How to tell webpack dev server to serve index.html for any route](https://stackoverflow.com/q/31945763)
      historyApiFallback: true
    },

    // See [The 100% correct way to split your chunks with Webpack](https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758)
    // See [Webpack v4 chunk splitting deep dive](https://www.chrisclaxton.me.uk/chris-claxtons-blog/webpack-chunksplitting-deepdive)
    optimization: {
      // "creates a runtime file to be shared for all generated chunks", see https://webpack.js.org/configuration/optimization/#optimizationruntimechunk
      runtimeChunk: 'single',

      splitChunks: {
        chunks: 'all',
        minSize: 0,
        maxInitialRequests: Infinity,
        cacheGroups: {
          vendors: {
            test: /\/node_modules\//,
            name(module: { context: string }, chunks: { name: string }[]) {
              const packageName = getPackageNameFromPath(module.context).replace('/', '-');
              return `${packageName}~${chunks.map(chunk => chunk.name).join('~')}`;
            }
          }
        }
      }
    }
  };

  // Hack to remove false plugins due to short-circuit evaluation "isProd &&"
  // FYI with Rollup (rollup.config.js) no need for this hack
  config.plugins = config.plugins!.filter(plugin => plugin);

  return config;
};
