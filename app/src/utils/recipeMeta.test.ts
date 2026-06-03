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
    { id: '1', title: 'Fodr', description: '', durationMinutes: 300, requiresAction: true },
    { id: '2', title: 'Hæv', description: '', durationMinutes: 720, requiresAction: true },
    { id: '3', title: 'Bag', description: '', durationMinutes: 60, requiresAction: true },
  ],
};

describe('getRecipeMetaItems', () => {
  it('places total duration with the other recipe metadata', () => {
    assert.deepEqual(getRecipeMetaItems(recipe), [
      { label: '18 timer', status: 'info' },
      { label: 'Medium', status: 'completed' },
      { label: 'Aktiv 45 min', status: 'info' },
    ]);
  });
});
