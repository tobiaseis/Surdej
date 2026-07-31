import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateDough, parseRecipeDough } from './doughCalculator';
import type { Recipe } from '../data/recipes';

const ratios = { hydrationPct: 75, starterPct: 20, saltPct: 2 };

const recipeWith = (ingredients: string[]): Recipe => ({
  id: 'test',
  name: 'Testbrød',
  description: '',
  difficulty: 'Let',
  handsOnMinutes: 30,
  yield: '1 brød',
  ingredients,
  tools: [],
  steps: [],
});

describe('calculateDough', () => {
  it('scales every ingredient from the flour weight', () => {
    const result = calculateDough(ratios, { mode: 'flour', grams: 500 });

    assert.equal(result.flourGrams, 500);
    assert.equal(result.waterGrams, 375);
    assert.equal(result.starterGrams, 100);
    assert.equal(result.saltGrams, 10);
    assert.equal(result.totalGrams, 985);
  });

  it('works backwards from a total dough weight', () => {
    const result = calculateDough(ratios, { mode: 'dough', grams: 985 });

    assert.equal(result.flourGrams, 500);
    assert.equal(result.waterGrams, 375);
    assert.equal(result.starterGrams, 100);
    assert.equal(result.saltGrams, 10);
  });

  it('counts the flour and water in the starter in the total hydration', () => {
    // 500 g mel + 50 g mel fra surdejen, 375 g vand + 50 g vand fra surdejen.
    const result = calculateDough(ratios, { mode: 'flour', grams: 500 });

    assert.equal(result.totalHydrationPct, 77.3);
  });

  it('follows the starter own hydration when it is not fed 1:1', () => {
    // Stiv surdej (50 %): 100 g surdej er 67 g mel og 33 g vand.
    const stiff = calculateDough(
      { ...ratios, starterHydrationPct: 50 },
      { mode: 'flour', grams: 500 }
    );

    assert.equal(stiff.totalHydrationPct, 72.1);
  });

  it('splits the flour across the recipe flour types without losing a gram', () => {
    const result = calculateDough(
      {
        ...ratios,
        flourMix: [
          { name: 'Hvedemel', share: 0.9 },
          { name: 'Fuldkornsmel', share: 0.1 },
        ],
      },
      { mode: 'flour', grams: 333 }
    );

    assert.deepEqual(result.flourBreakdown, [
      { name: 'Hvedemel', grams: 300 },
      { name: 'Fuldkornsmel', grams: 33 },
    ]);
    assert.equal(
      result.flourBreakdown.reduce((sum, flour) => sum + flour.grams, 0),
      result.flourGrams
    );
  });

  it('returns zeroes instead of NaN for an empty amount', () => {
    const result = calculateDough(ratios, { mode: 'dough', grams: Number.NaN });

    assert.equal(result.totalGrams, 0);
    assert.equal(result.totalHydrationPct, 0);
  });
});

describe('parseRecipeDough', () => {
  it('reads the ratios out of a recipe ingredient list', () => {
    const parsed = parseRecipeDough(
      recipeWith(['500 g hvedemel', '375 g vand', '100 g aktiv surdej', '10 g salt'])
    );

    assert.deepEqual(parsed?.ratios.hydrationPct, 75);
    assert.deepEqual(parsed?.ratios.starterPct, 20);
    assert.deepEqual(parsed?.ratios.saltPct, 2);
    assert.equal(parsed?.flourGrams, 500);
  });

  it('keeps the flour blend so a mixed-flour recipe stays mixed', () => {
    const parsed = parseRecipeDough(
      recipeWith(['450 g hvedemel', '50 g fuldkornsmel', '375 g vand', '100 g aktiv surdej', '10 g salt'])
    );

    assert.equal(parsed?.flourGrams, 500);
    assert.deepEqual(parsed?.ratios.flourMix, [
      { name: 'Hvedemel', share: 0.9 },
      { name: 'Fuldkornsmel', share: 0.1 },
    ]);
  });

  it('reproduces the recipe when the parsed ratios are calculated back', () => {
    const ingredients = ['500 g hvedemel', '400 g vand', '100 g aktiv surdej', '12 g salt'];
    const parsed = parseRecipeDough(recipeWith(ingredients));
    const result = calculateDough(parsed!.ratios, { mode: 'flour', grams: parsed!.flourGrams });

    assert.equal(result.flourGrams, 500);
    assert.equal(result.waterGrams, 400);
    assert.equal(result.starterGrams, 100);
    assert.equal(result.saltGrams, 12);
  });

  it('ignores ingredients without a weight', () => {
    const parsed = parseRecipeDough(
      recipeWith(['500 g hvedemel', '375 g vand', '100 g aktiv surdej', '10 g salt', 'Olivenolie', 'Flagesalt'])
    );

    // Flagesalt uden vægt må ikke tælle med i saltprocenten.
    assert.equal(parsed?.ratios.saltPct, 2);
  });

  it('reads kilos as well as grams', () => {
    const parsed = parseRecipeDough(recipeWith(['1 kg hvedemel', '700 g vand', '200 g surdej', '20 g salt']));

    assert.equal(parsed?.flourGrams, 1000);
    assert.equal(parsed?.ratios.hydrationPct, 70);
  });

  it('gives up on a recipe without weighed ingredients', () => {
    assert.equal(parseRecipeDough(recipeWith(['Mel', 'Vand', 'Surdej'])), null);
    assert.equal(parseRecipeDough(recipeWith([])), null);
  });
});
