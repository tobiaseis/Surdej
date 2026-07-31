import type { ActiveBake, StarterStrength } from './scheduleCalculator';
import { formatDurationMinutes } from './dateTime';

/**
 * Et dagbogsindlæg gemmer hele opskriften – ikke en henvisning til den.
 * Opskrifter kan blive rettet eller slettet i Supabase, og pointen med
 * dagbogen er at kunne bage præcis det samme igen om et halvt år. Derfor
 * fryses ingredienser, trin og de forhold, der blev bagt under, ned som en
 * kopi i indlægget.
 */

export type DiaryRecipeStep = {
  title: string;
  description: string;
  /** Den varighed der blev bagt efter – justeret for temperatur og surdejens styrke. */
  durationMinutes: number;
};

export type DiaryRecipe = {
  name: string;
  description?: string;
  yield?: string;
  difficulty?: string;
  ingredients: string[];
  tools: string[];
  steps: DiaryRecipeStep[];
  /** Forholdene bagningen kørte under – uden dem passer tiderne ikke igen. */
  roomTempC?: number;
  starterStrength?: StarterStrength;
};

const STARTER_LABELS: Record<StarterStrength, string> = {
  fast: 'meget aktiv surdej',
  normal: 'normal surdej',
  slow: 'langsom surdej',
};

/** Tager et øjebliksbillede af den bagning, der lige er gennemført. */
export const buildDiaryRecipe = (bake: ActiveBake): DiaryRecipe => ({
  name: bake.recipe.name,
  description: bake.recipe.description || undefined,
  yield: bake.recipe.yield || undefined,
  difficulty: bake.recipe.difficulty || undefined,
  ingredients: [...bake.recipe.ingredients],
  tools: [...bake.recipe.tools],
  steps: bake.steps.map((step) => ({
    title: step.title,
    description: step.description,
    durationMinutes: step.adjustedDurationMinutes,
  })),
  roomTempC: bake.options.roomTempC,
  starterStrength: bake.options.starterStrength,
});

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/**
 * Læser jsonb-kolonnen fra databasen. Ældre indlæg er gemt uden opskrift, og
 * et indlæg med en halv opskrift må ikke vælte listen – derfor valideres hvert
 * felt, og null betyder "vis bare ingen opskrift".
 */
export const parseDiaryRecipe = (value: unknown): DiaryRecipe | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const name = asText(raw.name);
  if (!name) return null;

  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .filter((step): step is Record<string, unknown> => !!step && typeof step === 'object')
        .map((step) => ({
          title: asText(step.title) ?? '',
          description: asText(step.description) ?? '',
          durationMinutes: asNumber(step.durationMinutes) ?? 0,
        }))
        .filter((step) => step.title.length > 0)
    : [];

  const strength = asText(raw.starterStrength);

  return {
    name,
    description: asText(raw.description),
    yield: asText(raw.yield),
    difficulty: asText(raw.difficulty),
    ingredients: asStringArray(raw.ingredients),
    tools: asStringArray(raw.tools),
    steps,
    roomTempC: asNumber(raw.roomTempC),
    starterStrength:
      strength === 'fast' || strength === 'normal' || strength === 'slow' ? strength : undefined,
  };
};

/** "21°C · normal surdej" – de forhold bagningen kørte under. */
export const formatBakeConditions = (recipe: DiaryRecipe): string | null => {
  const parts = [
    recipe.roomTempC !== undefined ? `${recipe.roomTempC}°C` : null,
    recipe.starterStrength ? STARTER_LABELS[recipe.starterStrength] : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
};

/** Opskriften som tekstlinjer – bruges i eksporten, der kan deles. */
export const formatDiaryRecipeLines = (recipe: DiaryRecipe, indent = '  '): string[] => {
  const lines: string[] = [];

  if (recipe.yield) lines.push(`${indent}Antal: ${recipe.yield}`);

  const conditions = formatBakeConditions(recipe);
  if (conditions) lines.push(`${indent}Bagt ved: ${conditions}`);

  if (recipe.ingredients.length > 0) {
    lines.push(`${indent}Ingredienser:`);
    recipe.ingredients.forEach((ingredient) => lines.push(`${indent}  - ${ingredient}`));
  }

  if (recipe.tools.length > 0) {
    lines.push(`${indent}Du skal bruge: ${recipe.tools.join(', ')}`);
  }

  if (recipe.steps.length > 0) {
    lines.push(`${indent}Fremgangsmåde:`);
    recipe.steps.forEach((step, index) => {
      lines.push(`${indent}  ${index + 1}. ${step.title} (${formatDurationMinutes(step.durationMinutes)})`);
      if (step.description) lines.push(`${indent}     ${step.description}`);
    });
  }

  return lines;
};
