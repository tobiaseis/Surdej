import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDiaryRecipe,
  formatBakeConditions,
  formatDiaryRecipeLines,
  parseDiaryRecipe,
} from './diaryRecipe';
import { calculateSchedule } from './scheduleCalculator';
import type { Recipe } from '../data/recipes';

const recipe: Recipe = {
  id: 'test',
  name: 'Koldhævede boller',
  description: 'Luftige boller.',
  difficulty: 'Let',
  handsOnMinutes: 35,
  yield: '12 boller',
  ingredients: ['500 g hvedemel', '375 g vand', '100 g aktiv surdej', '10 g salt'],
  tools: ['Skål', 'Dejskraber'],
  steps: [
    { id: 's1', title: 'Fodr surdej', description: 'Gør surdejen klar.', durationMinutes: 240, temperatureSensitive: true },
    { id: 's2', title: 'Bagning', description: 'I ovnen ved 220 grader.', durationMinutes: 20 },
  ],
};

const bakeAt = (roomTempC: number) =>
  calculateSchedule(recipe, new Date('2026-08-01T09:00:00'), { roomTempC, starterStrength: 'normal' });

describe('buildDiaryRecipe', () => {
  it('copies the whole recipe, not a reference to it', () => {
    const snapshot = buildDiaryRecipe(bakeAt(21));

    assert.equal(snapshot.name, 'Koldhævede boller');
    assert.equal(snapshot.yield, '12 boller');
    assert.deepEqual(snapshot.ingredients, recipe.ingredients);
    assert.deepEqual(snapshot.tools, recipe.tools);
    assert.equal(snapshot.steps.length, 2);
    assert.equal(snapshot.steps[0].title, 'Fodr surdej');

    // En senere rettelse i opskriften må ikke ændre det gemte indlæg.
    snapshot.ingredients.push('Sesam');
    assert.equal(recipe.ingredients.length, 4);
  });

  it('stores the times the bake actually ran with, not the recipe times', () => {
    const cold = buildDiaryRecipe(bakeAt(13));

    // Hævetrinnet fordobles ved 13°C; bagningen er uændret.
    assert.equal(cold.steps[0].durationMinutes, 480);
    assert.equal(cold.steps[1].durationMinutes, 20);
    assert.equal(cold.roomTempC, 13);
    assert.equal(cold.starterStrength, 'normal');
  });
});

describe('parseDiaryRecipe', () => {
  it('reads back what was written', () => {
    const snapshot = buildDiaryRecipe(bakeAt(21));
    const parsed = parseDiaryRecipe(JSON.parse(JSON.stringify(snapshot)));

    assert.deepEqual(parsed, snapshot);
  });

  it('treats a missing recipe as no recipe', () => {
    assert.equal(parseDiaryRecipe(null), null);
    assert.equal(parseDiaryRecipe(undefined), null);
    assert.equal(parseDiaryRecipe('Koldhævede boller'), null);
    assert.equal(parseDiaryRecipe({ ingredients: ['500 g mel'] }), null);
  });

  it('keeps what it can from a half-written recipe', () => {
    const parsed = parseDiaryRecipe({
      name: 'Grydebrød',
      ingredients: ['450 g hvedemel', 42],
      steps: [{ title: 'Bagning' }, { description: 'Uden titel' }, 'ikke et trin'],
      starterStrength: 'meget hurtig',
    });

    assert.ok(parsed);
    assert.deepEqual(parsed.ingredients, ['450 g hvedemel']);
    assert.deepEqual(parsed.tools, []);
    assert.equal(parsed.steps.length, 1);
    assert.equal(parsed.steps[0].durationMinutes, 0);
    assert.equal(parsed.starterStrength, undefined);
  });
});

describe('formatBakeConditions', () => {
  it('describes the conditions the bake ran under', () => {
    const snapshot = buildDiaryRecipe(bakeAt(19));
    assert.equal(formatBakeConditions(snapshot), '19°C · normal surdej');
  });

  it('is null when nothing was recorded', () => {
    assert.equal(formatBakeConditions({ name: 'Brød', ingredients: [], tools: [], steps: [] }), null);
  });
});

describe('formatDiaryRecipeLines', () => {
  it('writes ingredients and numbered steps with their times', () => {
    const lines = formatDiaryRecipeLines(buildDiaryRecipe(bakeAt(21)));
    const text = lines.join('\n');

    assert.ok(text.includes('Antal: 12 boller'));
    assert.ok(text.includes('Bagt ved: 21°C · normal surdej'));
    assert.ok(text.includes('- 500 g hvedemel'));
    assert.ok(text.includes('Du skal bruge: Skål, Dejskraber'));
    assert.ok(text.includes('1. Fodr surdej (4 t)'));
    assert.ok(text.includes('2. Bagning (20 min)'));
  });

  it('skips the parts a recipe does not have', () => {
    const lines = formatDiaryRecipeLines({ name: 'Brød', ingredients: [], tools: [], steps: [] });
    assert.deepEqual(lines, []);
  });
});
