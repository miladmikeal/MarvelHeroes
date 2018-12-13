import React from 'react';
import { render, flushEffects } from 'react-testing-library';
import { MemoryRouter } from 'react-router';

import { flushPromises } from './utils/flushPromises';
import { Heroes } from './Heroes';

jest.mock('./http/Marvel');

test('render()', async () => {
  const wrapper = render(
    <MemoryRouter>
      <Heroes page={0} />
    </MemoryRouter>
  );

  const pleaseWait = '<p>Please wait...</p>';

  flushEffects();
  expect(wrapper.container.innerHTML).toEqual(pleaseWait);

  await flushPromises();
  flushEffects();
  expect(wrapper.container.innerHTML).toMatch(
    /.*3-D Man.*A-Bomb \(HAS\).*A\.I\.M\..*Anita Blake.*Anne Marie Hoag.*Annihilus.*/
  );

  wrapper.rerender(
    <MemoryRouter>
      <Heroes page={1} />
    </MemoryRouter>
  );
  flushEffects();
  expect(wrapper.container.innerHTML).toEqual(pleaseWait);
  await flushPromises();
  flushEffects();
  expect(wrapper.container.innerHTML).toMatch(
    /.*Anole.*Ant-Man \(Eric O'Grady\).*Ant-Man \(Scott Lang\).*Beef.*Beetle \(Abner Jenkins\).*Ben Grimm.*/
  );

  wrapper.unmount();
});
