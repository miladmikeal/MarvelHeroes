import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import * as Marvel from './http/Marvel';

export interface QueryParams {
  id: string;
}

export interface Props extends RouteComponentProps<QueryParams> {}

export const Hero: React.FunctionComponent<Props> = props => {
  const [character, setCharacter] = useState<Marvel.Character | undefined>(undefined);

  async function fetch(id: string) {
    setCharacter(undefined);
    const character = await Marvel.fetchCharacter(id);
    setCharacter(character);
  }

  useEffect(
    () => {
      fetch(props.match.params.id);
    },
    [props.match.params.id]
  );

  function renderHero(character: Marvel.Character) {
    return (
      <>
        <img
          src={`${character.thumbnail.path}.${character.thumbnail.extension}`}
          alt={character.name}
          className="img-fluid" // Resize image on mobile
        />
        <h3>{character.name}</h3>
        <p>{character.description}</p>
        <h6>Comics</h6>
        {renderCategory(character, 'comics')}
        <h6>Series</h6>
        {renderCategory(character, 'series')}
        <h6>Stories</h6>
        {renderCategory(character, 'stories')}
      </>
    );
  }

  function renderCategory(character: Marvel.Character, category: string) {
    return (
      <ul>
        {(character[category] as Marvel.CharacterCategory).items.map((item, index) => (
          <li key={`${category}.${index}`}>{item.name}</li>
        ))}
      </ul>
    );
  }

  return character !== undefined ? (
    <div className="hero">{renderHero(character)}</div>
  ) : (
    <p>Please wait...</p>
  );
};
