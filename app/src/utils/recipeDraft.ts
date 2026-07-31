import type { Difficulty, Recipe, RecipeStep } from '../data/recipes';

/**
 * Kladden bag formularen til egne opskrifter. Den holder felterne præcis som
 * de står på skærmen – også tomme linjer, man er ved at skrive i – og
 * oversættes først til en opskrift, når der gemmes. Reglerne for hvad der
 * skal til, ligger her frem for i skærmen, så de kan testes.
 */

export type RecipeStepDraft = {
  /** Stabil nøgle til listen. Følger ikke med i den gemte opskrift. */
  key: string;
  title: string;
  description: string;
  durationMinutes: number;
  /** Hævetrin. Kun disse skaleres efter temperatur og surdejens styrke. */
  temperatureSensitive: boolean;
};

export type RecipeDraft = {
  name: string;
  description: string;
  difficulty: Difficulty;
  yield: string;
  handsOnMinutes: number;
  ingredients: string[];
  tools: string[];
  steps: RecipeStepDraft[];
};

export const DIFFICULTIES: Difficulty[] = ['Let', 'Medium', 'Svær'];

export const STEP_LIMITS = { min: 5, max: 1440 } as const;

let keyCounter = 0;
export const createStepKey = () => `step-${Date.now()}-${keyCounter++}`;

export const createEmptyStep = (): RecipeStepDraft => ({
  key: createStepKey(),
  title: '',
  description: '',
  durationMinutes: 60,
  temperatureSensitive: false,
});

/** En ny opskrift starter med et par tomme linjer, så det er tydeligt hvad der skal skrives. */
export const createEmptyDraft = (): RecipeDraft => ({
  name: '',
  description: '',
  difficulty: 'Let',
  yield: '',
  handsOnMinutes: 30,
  ingredients: ['', '', ''],
  tools: [''],
  steps: [createEmptyStep()],
});

export const draftFromRecipe = (recipe: Recipe): RecipeDraft => ({
  name: recipe.name,
  description: recipe.description,
  difficulty: recipe.difficulty,
  yield: recipe.yield,
  handsOnMinutes: recipe.handsOnMinutes,
  // En tom linje i bunden, så der er et sted at skrive den næste ingrediens.
  ingredients: [...recipe.ingredients, ''],
  tools: [...recipe.tools, ''],
  steps: recipe.steps.map((step) => ({
    key: createStepKey(),
    title: step.title,
    description: step.description,
    durationMinutes: step.durationMinutes,
    temperatureSensitive: step.temperatureSensitive ?? false,
  })),
});

const cleanLines = (lines: string[]) => lines.map((line) => line.trim()).filter(Boolean);

/**
 * Hvad der skal være på plads, før opskriften kan bruges til en bageplan.
 * Beskederne vises som de er, så de er skrevet til hende – ikke til en logfil.
 */
export const validateDraft = (draft: RecipeDraft): string[] => {
  const errors: string[] = [];

  if (!draft.name.trim()) errors.push('Opskriften mangler et navn.');
  if (cleanLines(draft.ingredients).length === 0) errors.push('Skriv mindst én ingrediens.');

  const steps = draft.steps.filter((step) => step.title.trim());
  if (steps.length === 0) {
    errors.push('Skriv mindst ét trin – det er dem, bageplanen bygger på.');
  }
  if (steps.some((step) => step.durationMinutes <= 0)) {
    errors.push('Hvert trin skal vare mindst et minut.');
  }

  return errors;
};

/** Kladden som opskrift – tomme linjer og trin uden titel ryger fra. */
export const draftToRecipeFields = (draft: RecipeDraft) => ({
  name: draft.name.trim(),
  description: draft.description.trim(),
  difficulty: draft.difficulty,
  yield: draft.yield.trim(),
  handsOnMinutes: Math.max(0, Math.round(draft.handsOnMinutes)),
  ingredients: cleanLines(draft.ingredients),
  tools: cleanLines(draft.tools),
  steps: draft.steps
    .filter((step) => step.title.trim())
    .map(
      (step, index): RecipeStep => ({
        id: `custom-step-${index + 1}`,
        title: step.title.trim(),
        description: step.description.trim(),
        durationMinutes: Math.max(1, Math.round(step.durationMinutes)),
        temperatureSensitive: step.temperatureSensitive,
      })
    ),
});

/** Flytter et trin op eller ned. Rækkefølgen er selve bageplanen. */
export const moveStep = (steps: RecipeStepDraft[], index: number, direction: -1 | 1): RecipeStepDraft[] => {
  const target = index + direction;
  if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) return steps;

  const next = [...steps];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/**
 * Holder præcis én tom linje i bunden af en liste, så der altid er plads til
 * den næste ingrediens uden at trykke "tilføj" først. Tomme linjer midt i
 * listen bliver stående – de er som regel én, man er ved at skrive om.
 */
export const withTrailingBlank = (lines: string[]): string[] => {
  const filled = [...lines];
  while (filled.length > 0 && !filled[filled.length - 1].trim()) filled.pop();
  return [...filled, ''];
};
