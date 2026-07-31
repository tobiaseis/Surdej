import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRecipeMetaItems } from './recipeMeta';
import type { Recipe } from '../data/recipes';

const recipe: Recipe = {
  id: 'test',
  name: 'Testbrød',
  description: 'Et testbrød',
  difficulty: 'Medium',
  handsOnMinutes: 45,
  yield: '1 brød',
  ingredients: [],
  tools: [],
  steps: [
    { id: '1', title: 'Fodr', description: '', durationMinutes: 300 },
    { id: '2', title: 'Hæv', description: '', durationMinutes: 720 },
    { id: '3', title: 'Bag', description: '', durationMinutes: 60 },
  ],
};

describe('getRecipeMetaItems', () => {
  it('places total duration with the other recipe metadata', () => {
    assert.deepEqual(getRecipeMetaItems(recipe), [
      { label: '18 timer', tone: 'neutral' },
      { label: 'Medium', tone: 'accent' },
      { label: 'Aktiv 45 min', tone: 'neutral' },
    ]);
  });

  it('tones the difficulty badge by how demanding the recipe is', () => {
    const toneFor = (difficulty: Recipe['difficulty']) =>
      getRecipeMetaItems({ ...recipe, difficulty })[1].tone;

    assert.equal(toneFor('Let'), 'positive');
    assert.equal(toneFor('Medium'), 'accent');
    // Regression: "Svær" blev tidligere vist i grøn "udført"-farve.
    assert.equal(toneFor('Svær'), 'warning');
  });
});
