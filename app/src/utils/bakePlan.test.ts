import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FEED_STEP_ID,
  createFeedPlan,
  getEndTimeFromFeed,
  isStarterFeedStep,
  withFeedStep,
} from './bakePlan';
import { getPeakWindow } from './starterFeed';
import { getRecipeDurationMinutes } from './scheduleCalculator';
import type { Recipe } from '../data/recipes';

const RATIO = { starter: 1, flour: 2, water: 2 };
const OPTIONS = { roomTempC: 21, starterStrength: 'normal' as const };

const feedPlan = (options = OPTIONS) =>
  createFeedPlan(RATIO, { mode: 'starter', starterGrams: 50 }, options);

const recipe = (steps: Recipe['steps']): Recipe => ({
  id: 'r1',
  name: 'Boller',
  description: '',
  difficulty: 'Let',
  handsOnMinutes: 30,
  yield: '12 boller',
  ingredients: [],
  tools: [],
  steps,
});

const bakingSteps: Recipe['steps'] = [
  { id: 's2', title: 'Autolyse', description: '', durationMinutes: 60, temperatureSensitive: true },
  { id: 's3', title: 'Bagning', description: '', durationMinutes: 20 },
];

describe('createFeedPlan', () => {
  it('regner mængderne ud fra forholdet', () => {
    const feed = feedPlan();

    assert.equal(feed.starterGrams, 50);
    assert.equal(feed.flourGrams, 100);
    assert.equal(feed.waterGrams, 100);
  });

  it('bruger toppetiden for det valgte forhold', () => {
    assert.equal(feedPlan().peakHours, getPeakWindow(RATIO, OPTIONS).hours);
  });

  it('giver en koldere køkken længere toppetid', () => {
    const cold = feedPlan({ roomTempC: 18, starterStrength: 'normal' });
    assert.ok(cold.peakHours > feedPlan().peakHours);
  });
});

describe('isStarterFeedStep', () => {
  it('følger flaget, når opskriften har sat det', () => {
    assert.equal(
      isStarterFeedStep({ id: 'x', title: 'Bland dej', description: '', durationMinutes: 30, isStarterFeed: true }),
      true
    );
    assert.equal(
      isStarterFeedStep({ id: 'x', title: 'Fodr surdej', description: '', durationMinutes: 30, isStarterFeed: false }),
      false
    );
  });

  it('genkender ellers trinnet på titlen', () => {
    assert.equal(
      isStarterFeedStep({ id: 'x', title: 'Fodr surdej', description: '', durationMinutes: 240 }),
      true
    );
    // "Tilsæt surdej & salt" er ikke en fodring, selv om der står surdej i.
    assert.equal(
      isStarterFeedStep({ id: 'x', title: 'Tilsæt surdej & salt', description: '', durationMinutes: 30 }),
      false
    );
  });
});

describe('withFeedStep', () => {
  it('skifter opskriftens eget fodringstrin ud med brugerens', () => {
    const original = recipe([
      { id: 's1', title: 'Fodr surdej', description: 'Bland 50g surdej…', durationMinutes: 240, temperatureSensitive: true },
      ...bakingSteps,
    ]);

    const plan = withFeedStep(original, feedPlan());

    assert.equal(plan.steps.length, 3);
    assert.equal(plan.steps[0].id, FEED_STEP_ID);
    assert.equal(plan.steps[1].id, 's2');
    assert.ok(plan.steps[0].description.includes('100 g mel'));
  });

  it('lægger fodringen først, når opskriften ikke selv har en', () => {
    const plan = withFeedStep(recipe(bakingSteps), feedPlan());

    assert.equal(plan.steps.length, 3);
    assert.equal(plan.steps[0].id, FEED_STEP_ID);
  });

  it('lader et fodringstrin midt i opskriften være', () => {
    const original = recipe([
      ...bakingSteps,
      { id: 's4', title: 'Fodr surdej til næste gang', description: '', durationMinutes: 10 },
    ]);

    const plan = withFeedStep(original, feedPlan());

    assert.equal(plan.steps.length, 4);
    assert.equal(plan.steps[3].id, 's4');
  });

  it('rører ikke ved den oprindelige opskrift', () => {
    const original = recipe([...bakingSteps]);
    withFeedStep(original, feedPlan());

    assert.equal(original.steps.length, 2);
  });

  it('skalerer ikke fodringen to gange for temperaturen', () => {
    // peakHours er allerede justeret for temperatur og styrke. Sad flaget
    // temperatureSensitive på trinnet, ville bageplanen gange en gang til.
    const cold = { roomTempC: 18, starterStrength: 'normal' as const };
    const feed = feedPlan(cold);
    const plan = withFeedStep(recipe([]), feed);

    assert.equal(plan.steps[0].temperatureSensitive, false);
    assert.equal(getRecipeDurationMinutes(plan, cold), plan.steps[0].durationMinutes);
  });
});

describe('getEndTimeFromFeed', () => {
  it('lægger hele planens varighed oven på fodringstidspunktet', () => {
    const feed = feedPlan();
    const original = recipe(bakingSteps);
    const fedAt = new Date('2026-08-01T14:00:00');

    const end = getEndTimeFromFeed(original, feed, fedAt, OPTIONS);
    const minutes = getRecipeDurationMinutes(withFeedStep(original, feed), OPTIONS);

    assert.equal(end.getTime() - fedAt.getTime(), minutes * 60 * 1000);
  });
});
