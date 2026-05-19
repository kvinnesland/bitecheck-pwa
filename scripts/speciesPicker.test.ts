import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFixedSpeciesChoices,
  getSearchSpeciesResults,
  UNKNOWN_SPECIES_NAME,
  NOT_LISTED_SPECIES_NAME,
} from '../src/lib/speciesPicker.ts';

test('species picker shows the three fixed choices before search results', () => {
  assert.deepEqual(getFixedSpeciesChoices().map(choice => choice.id), ['no_fish', 'unknown', 'not_listed']);
  assert.equal(getFixedSpeciesChoices()[1].speciesName, UNKNOWN_SPECIES_NAME);
  assert.equal(getFixedSpeciesChoices()[2].speciesName, NOT_LISTED_SPECIES_NAME);
});

test('species list is hidden until the user searches', () => {
  assert.deepEqual(getSearchSpeciesResults('', 'salt'), []);
  assert.deepEqual(getSearchSpeciesResults('   ', 'fresh'), []);
});

test('search filters the selected water type species dynamically', () => {
  assert.deepEqual(getSearchSpeciesResults('ør', 'fresh'), ['Ørret']);
  assert.deepEqual(getSearchSpeciesResults('ør', 'salt'), ['Sjøørret', 'Sjørøye']);
  assert.deepEqual(getSearchSpeciesResults('torsk', 'fresh'), []);
  assert.deepEqual(getSearchSpeciesResults('torsk', 'salt'), ['Torsk']);
});
