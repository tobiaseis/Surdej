import type { Recipe, RecipeStep } from '../data/recipes';

export type ScheduledStep = RecipeStep & {
  scheduledAt: Date;
  completedAt: Date | null;
  status: 'pending' | 'active' | 'completed';
};

export type ActiveBake = {
  id: string;
  recipe: Recipe;
  targetEndTime: Date;
  steps: ScheduledStep[];
};

export function getRecipeDurationMinutes(recipe: Recipe): number {
  return recipe.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
}

export function getEarliestTargetEndTime(recipe: Recipe, now = new Date()): Date {
  return new Date(now.getTime() + getRecipeDurationMinutes(recipe) * 60 * 1000);
}

export function isTargetEndTimeFeasible(recipe: Recipe, targetEndTime: Date, now = new Date()): boolean {
  return targetEndTime.getTime() >= getEarliestTargetEndTime(recipe, now).getTime();
}

export function getDefaultTargetEndTime(recipe: Recipe, now = new Date()): Date {
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(9, 0, 0, 0);

  while (!isTargetEndTimeFeasible(recipe, candidate, now)) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

export function getLiveTimerStep(steps: ScheduledStep[]): ScheduledStep | undefined {
  return steps.find((step) => step.status === 'active') ?? steps.find((step) => step.status === 'pending');
}

export function calculateSchedule(recipe: Recipe, targetEndTime: Date): ActiveBake {
  // Vi regner baglæns. Målet er, at det sidste trin er FÆRDIGT ved targetEndTime.
  let currentTimestamp = targetEndTime.getTime();
  const scheduledSteps: ScheduledStep[] = [];
  
  // Kør baglæns gennem opskriften
  for (let i = recipe.steps.length - 1; i >= 0; i--) {
    const step = recipe.steps[i];
    // Starttidspunktet for dette trin = sluttidspunktet - varigheden
    currentTimestamp -= step.durationMinutes * 60 * 1000;
    
    scheduledSteps.unshift({
      ...step,
      scheduledAt: new Date(currentTimestamp),
      completedAt: null,
      status: 'pending'
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
    steps: scheduledSteps,
  };
}

export function adjustScheduleForDelay(bake: ActiveBake, completedStepIndex: number, actualCompletionTime: Date): ActiveBake {
  // Når et trin er fuldført, starter ventetiden til næste trin i princippet.
  // Men wait: "completedStepIndex" er det trin vi lige har trykket "Done" til.
  // Det betyder at vi netop har UDFØRT trinnet. 
  // Hvis trinnet fx var "Fodr surdej", har vi lige brugt 5 minutter på at fodre den.
  // Derefter skal vi vente `step.durationMinutes` før næste trin (fx Autolyse) starter.
  
  if (completedStepIndex >= bake.steps.length - 1) {
    return bake; // Vi er ved sidste trin
  }
  
  const step = bake.steps[completedStepIndex];
  
  // Hvornår burde vi have trykket "Done"? Det burde være ved step.scheduledAt.
  // (Antaget at selve arbejdet "at fodre" eller "at folde" tager 0-5 minutter, og duration er ventetiden til næste).
  // Så det næste trin BØR starte: actualCompletionTime + step.durationMinutes.
  
  const nextStepExpectedStart = new Date(actualCompletionTime.getTime() + step.durationMinutes * 60 * 1000);
  const nextStepOldStart = bake.steps[completedStepIndex + 1].scheduledAt;
  
  const delayMs = nextStepExpectedStart.getTime() - nextStepOldStart.getTime();
  
  if (delayMs === 0) return bake;

  const newSteps = bake.steps.map((s, i) => {
    if (i <= completedStepIndex) return s; // Allerede udført, ændres ikke
    return {
      ...s,
      scheduledAt: new Date(s.scheduledAt.getTime() + delayMs)
    };
  });
  
  return {
    ...bake,
    targetEndTime: new Date(bake.targetEndTime.getTime() + delayMs),
    steps: newSteps
  };
}
