import type { Recipe, RecipeStep } from '../data/recipes';

export type StarterStrength = 'fast' | 'normal' | 'slow';

export type ScheduleOptions = {
  roomTempC: number;
  starterStrength: StarterStrength;
};

export const DEFAULT_SCHEDULE_OPTIONS: ScheduleOptions = {
  roomTempC: 21,
  starterStrength: 'normal',
};

// Reference: ved 21°C og en "normal" surdej passer opskriftens angivne tider 1:1.
const REFERENCE_TEMP_C = 21;
// Fermenteringshastighed ca. fordobles for hver ~8°C (koldere = længere tid).
const TEMP_DOUBLING_C = 8;
const STARTER_FACTORS: Record<StarterStrength, number> = {
  fast: 0.85,
  normal: 1,
  slow: 1.2,
};

export type ScheduledStep = RecipeStep & {
  adjustedDurationMinutes: number;
  scheduledAt: Date;
  completedAt: Date | null;
  status: 'pending' | 'active' | 'completed';
};

export type ActiveBake = {
  id: string;
  recipe: Recipe;
  targetEndTime: Date;
  options: ScheduleOptions;
  steps: ScheduledStep[];
};

/**
 * Justerer et trins varighed efter rumtemperatur og surdejens styrke.
 * Kun hævetrin (temperatureSensitive) skaleres; arbejds-/bage-/køletrin er faste.
 */
export function getAdjustedStepDuration(step: RecipeStep, options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS): number {
  if (!step.temperatureSensitive) return step.durationMinutes;

  const tempFactor = Math.pow(2, (REFERENCE_TEMP_C - options.roomTempC) / TEMP_DOUBLING_C);
  const starterFactor = STARTER_FACTORS[options.starterStrength];
  const adjusted = step.durationMinutes * tempFactor * starterFactor;

  // Rund til nærmeste 5 minutter for pæne tider, minimum 5 minutter.
  return Math.max(5, Math.round(adjusted / 5) * 5);
}

export function getRecipeDurationMinutes(recipe: Recipe, options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS): number {
  return recipe.steps.reduce((sum, step) => sum + getAdjustedStepDuration(step, options), 0);
}

export function getEarliestTargetEndTime(
  recipe: Recipe,
  now = new Date(),
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): Date {
  return new Date(now.getTime() + getRecipeDurationMinutes(recipe, options) * 60 * 1000);
}

export function isTargetEndTimeFeasible(
  recipe: Recipe,
  targetEndTime: Date,
  now = new Date(),
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): boolean {
  return targetEndTime.getTime() >= getEarliestTargetEndTime(recipe, now, options).getTime();
}

export function getDefaultTargetEndTime(
  recipe: Recipe,
  now = new Date(),
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): Date {
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(9, 0, 0, 0);

  while (!isTargetEndTimeFeasible(recipe, candidate, now, options)) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

export function getLiveTimerStep(steps: ScheduledStep[]): ScheduledStep | undefined {
  return steps.find((step) => step.status === 'active') ?? steps.find((step) => step.status === 'pending');
}

export function isBakeComplete(bake: ActiveBake): boolean {
  return !getLiveTimerStep(bake.steps);
}

export function calculateSchedule(
  recipe: Recipe,
  targetEndTime: Date,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): ActiveBake {
  // Vi regner baglæns. Målet er, at det sidste trin er FÆRDIGT ved targetEndTime.
  let currentTimestamp = targetEndTime.getTime();
  const scheduledSteps: ScheduledStep[] = [];

  // Kør baglæns gennem opskriften
  for (let i = recipe.steps.length - 1; i >= 0; i--) {
    const step = recipe.steps[i];
    const adjustedDurationMinutes = getAdjustedStepDuration(step, options);
    // Starttidspunktet for dette trin = sluttidspunktet - varigheden
    currentTimestamp -= adjustedDurationMinutes * 60 * 1000;

    scheduledSteps.unshift({
      ...step,
      adjustedDurationMinutes,
      scheduledAt: new Date(currentTimestamp),
      completedAt: null,
      status: 'pending',
    });
  }

  // Sæt det første trin til at være 'active'
  if (scheduledSteps.length > 0) {
    scheduledSteps[0].status = 'active';
  }

  return {
    id: Date.now().toString(),
    recipe,
    targetEndTime,
    options,
    steps: scheduledSteps,
  };
}

export function adjustScheduleForDelay(bake: ActiveBake, completedStepIndex: number, actualCompletionTime: Date): ActiveBake {
  // Når et trin er fuldført, starter ventetiden til næste trin.
  // completedStepIndex er det trin vi lige har trykket "Udført" til.
  // Det næste trin BØR starte: actualCompletionTime + trinnets (justerede) ventetid.

  if (completedStepIndex >= bake.steps.length - 1) {
    return bake; // Vi er ved sidste trin
  }

  const step = bake.steps[completedStepIndex];

  const nextStepExpectedStart = new Date(actualCompletionTime.getTime() + step.adjustedDurationMinutes * 60 * 1000);
  const nextStepOldStart = bake.steps[completedStepIndex + 1].scheduledAt;

  const delayMs = nextStepExpectedStart.getTime() - nextStepOldStart.getTime();

  if (delayMs === 0) return bake;

  const newSteps = bake.steps.map((s, i) => {
    if (i <= completedStepIndex) return s; // Allerede udført, ændres ikke
    return {
      ...s,
      scheduledAt: new Date(s.scheduledAt.getTime() + delayMs),
    };
  });

  return {
    ...bake,
    targetEndTime: new Date(bake.targetEndTime.getTime() + delayMs),
    steps: newSteps,
  };
}

/**
 * Rykker det aktive trin og alle kommende trin et antal minutter frem i tiden.
 * Bruges når brugeren er forsinket eller justerer planen (fx fra SOS).
 */
export function delayBakeByMinutes(bake: ActiveBake, minutes: number): ActiveBake {
  const delayMs = minutes * 60 * 1000;
  if (delayMs === 0) return bake;

  const newSteps = bake.steps.map((step) => {
    if (step.status === 'completed') return step;
    return { ...step, scheduledAt: new Date(step.scheduledAt.getTime() + delayMs) };
  });

  return {
    ...bake,
    targetEndTime: new Date(bake.targetEndTime.getTime() + delayMs),
    steps: newSteps,
  };
}
