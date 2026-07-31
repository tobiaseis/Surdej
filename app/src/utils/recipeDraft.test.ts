import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createEmptyDraft,
  draftFromRecipe,
  draftToRecipeFields,
  moveStep,
  validateDraft,
  withTrailingBlank,
} from './recipeDraft';
import { parseRecipeDough } from './doughCalculator';
import type { Recipe } from '../data/recipes';

const filledDraft = () => ({
  ...createEmptyDraft(),
  name: '  Rugbrød med kerner  ',
  ingredients: ['400 g hvedemel', '', '100 g rugmel', '  '],
  tools: ['Skål', ''],
  steps: [
    {
      key: 'a',
      title: '  Autolyse  ',
      description: ' Bland mel og vand. ',
      durationMinutes: 60.4,
      temperatureSensitive: true,
    },
    { key: 'b', title: '', description: 'Halvskrevet trin', durationMinutes: 30, temperatureSensitive: false },
  ],
});

describe('validateDraft', () => {
  it('accepts a recipe that can be planned', () => {
    assert.deepEqual(validateDraft(filledDraft()), []);
  });

  it('asks for the parts a bake plan cannot do without', () => {
    const errors = validateDraft(createEmptyDraft());

    assert.equal(errors.length, 3);
    assert.ok(errors.some((error) => error.includes('navn')));
    assert.ok(errors.some((error) => error.includes('ingrediens')));
    assert.ok(errors.some((error) => error.includes('trin')));
  });

  it('does not count blank lines as ingredients', () => {
    const draft = { ...filledDraft(), ingredients: ['', '   ', ''] };
    assert.ok(validateDraft(draft).some((error) => error.includes('ingrediens')));
  });

  it('rejects a step with no time', () => {
    const draft = filledDraft();
    draft.steps[0].durationMinutes = 0;

    assert.ok(validateDraft(draft).some((error) => error.includes('minut')));
  });
});

describe('draftToRecipeFields', () => {
  it('trims the text and drops the empty lines', () => {
    const fields = draftToRecipeFields(filledDraft());

    assert.equal(fields.name, 'Rugbrød med kerner');
    assert.deepEqual(fields.ingredients, ['400 g hvedemel', '100 g rugmel']);
    assert.deepEqual(fields.tools, ['Skål']);
  });

  it('keeps only the steps that have a title, in order', () => {
    const fields = draftToRecipeFields(filledDraft());

    assert.equal(fields.steps.length, 1);
    assert.equal(fields.steps[0].title, 'Autolyse');
    assert.equal(fields.steps[0].description, 'Bland mel og vand.');
    assert.equal(fields.steps[0].durationMinutes, 60);
    assert.equal(fields.steps[0].temperatureSensitive, true);
  });

  it('writes ingredients the dough calculator can read back', () => {
    const fields = draftToRecipeFields({
      ...filledDraft(),
      ingredients: ['400 g hvedemel', '100 g fuldkornsmel', '375 g vand', '100 g surdej', '10 g salt'],
    });

    const dough = parseRecipeDough({ ...fields, id: 'x', steps: [] } as unknown as Recipe);

    assert.ok(dough);
    assert.equal(dough.flourGrams, 500);
    assert.equal(dough.ratios.hydrationPct, 75);
    // Flere meltyper skal komme med hver for sig, så mængderne kan skaleres.
    assert.equal(dough.ratios.flourMix?.length, 2);
  });
});

describe('draftFromRecipe', () => {
  it('round-trips an existing recipe', () => {
    const recipe: Recipe = {
      id: 'custom-1',
      name: 'Grovboller',
      description: 'Med fuldkorn.',
      difficulty: 'Medium',
      handsOnMinutes: 40,
      yield: '10 boller',
      ingredients: ['400 g hvedemel', '100 g fuldkornsmel'],
      tools: ['Skål'],
      steps: [
        { id: 's1', title: 'Bulk', description: 'Hæv.', durationMinutes: 180, temperatureSensitive: true },
      ],
      isCustom: true,
    };

    const fields = draftToRecipeFields(draftFromRecipe(recipe));

    assert.equal(fields.name, recipe.name);
    assert.equal(fields.difficulty, 'Medium');
    assert.deepEqual(fields.ingredients, recipe.ingredients);
    assert.equal(fields.steps.length, 1);
    assert.equal(fields.steps[0].temperatureSensitive, true);
  });
});

describe('moveStep', () => {
  const steps = [
    { key: 'a', title: 'A', description: '', durationMinutes: 10, temperatureSensitive: false },
    { key: 'b', title: 'B', description: '', durationMinutes: 10, temperatureSensitive: false },
  ];

  it('swaps two steps', () => {
    assert.deepEqual(
      moveStep(steps, 0, 1).map((step) => step.key),
      ['b', 'a']
    );
  });

  it('does nothing at the ends of the list', () => {
    assert.equal(moveStep(steps, 0, -1), steps);
    assert.equal(moveStep(steps, 1, 1), steps);
  });
});

describe('withTrailingBlank', () => {
  it('always leaves room for one more line', () => {
    assert.deepEqual(withTrailingBlank(['500 g mel']), ['500 g mel', '']);
    assert.deepEqual(withTrailingBlank(['500 g mel', '', '']), ['500 g mel', '']);
    assert.deepEqual(withTrailingBlank([]), ['']);
  });

  it('leaves a blank line in the middle alone', () => {
    assert.deepEqual(withTrailingBlank(['500 g mel', '', '10 g salt']), ['500 g mel', '', '10 g salt', '']);
  });
});
