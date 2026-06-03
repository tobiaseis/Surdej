import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Recipe } from '../data/recipes';
import {
  getDefaultTargetEndTime,
  getLiveTimerStep,
  getRecipeDurationMinutes,
  isTargetEndTimeFeasible,
} from './scheduleCalculator';

const recipe: Recipe = {
  id: 'boller-1',
  name: 'Koldhævede Surdejsboller',
  description: 'Klassiske saftige surdejsboller med sprød skorpe.',
  steps: [
    { id: 'step-1', title: 'Fodr surdej', description: '', durationMinutes: 240, requiresAction: true },
    { id: 'step-2', title: 'Autolyse', description: '', durationMinutes: 60, requiresAction: true },
    { id: 'step-3', title: 'Tilsæt surdej & salt', description: '', durationMinutes: 30, requiresAction: true },
    { id: 'step-4', title: 'Stræk og fold 1', description: '', durationMinutes: 30, requiresAction: true },
    { id: 'step-5', title: 'Stræk og fold 2', description: '', durationMinutes: 30, requiresAction: true },
    { id: 'step-6', title: 'Stræk og fold 3', description: '', durationMinutes: 180, requiresAction: true },
    { id: 'step-7', title: 'I køleskabet', description: '', durationMinutes: 720, requiresAction: true },
    { id: 'step-8', title: 'Tænd ovnen', description: '', durationMinutes: 45, requiresAction: true },
    { id: 'step-9', title: 'Bagning', description: '', durationMinutes: 20, requiresAction: true },
    { id: 'step-10', title: 'Køl af', description: '', durationMinutes: 30, requiresAction: false },
  ],
};

describe('schedule helpers', () => {
  it('calculates the full recipe duration in minutes', () => {
    assert.equal(getRecipeDurationMinutes(recipe), 1385);
  });

  it('moves the default target to a feasible 09:00 serving time', () => {
    const now = new Date(2026, 5, 3, 11, 0, 0, 0);
    const target = getDefaultTargetEndTime(recipe, now);

    assert.equal(target.getFullYear(), 2026);
    assert.equal(target.getMonth(), 5);
    assert.equal(target.getDate(), 5);
    assert.equal(target.getHours(), 9);
    assert.equal(target.getMinutes(), 0);
    assert.equal(isTargetEndTimeFeasible(recipe, target, now), true);
  });

  it('rejects target times that would require starting in the past', () => {
    const now = new Date(2026, 5, 3, 11, 0, 0, 0);
    const tooSoon = new Date(2026, 5, 4, 9, 0, 0, 0);

    assert.equal(isTargetEndTimeFeasible(recipe, tooSoon, now), false);
  });

  it('uses the active step for the live timer instead of skipping to later pending steps', () => {
    const target = new Date('2026-06-04T09:00:00.000Z');
    const steps = [
      {
        ...recipe.steps[0],
        scheduledAt: new Date('2026-06-03T08:00:00.000Z'),
        completedAt: new Date('2026-06-03T08:05:00.000Z'),
        status: 'completed' as const,
      },
      {
        ...recipe.steps[1],
        scheduledAt: new Date('2026-06-03T13:00:00.000Z'),
        completedAt: null,
        status: 'active' as const,
      },
      {
        ...recipe.steps[2],
        scheduledAt: target,
        completedAt: null,
        status: 'pending' as const,
      },
    ];

    assert.equal(getLiveTimerStep(steps)?.id, recipe.steps[1].id);
  });
});
