import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_FEED_RATIO,
  calculateFeed,
  formatHourRange,
  getPeakTimes,
  getPeakWindow,
} from './starterFeed';

const ratio111 = { starter: 1, flour: 1, water: 1 };
const ratio155 = { starter: 1, flour: 5, water: 5 };

describe('calculateFeed', () => {
  it('scales flour and water from the starter you keep', () => {
    const result = calculateFeed(ratio155, { mode: 'starter', starterGrams: 20 });

    assert.equal(result.starterGrams, 20);
    assert.equal(result.flourGrams, 100);
    assert.equal(result.waterGrams, 100);
    assert.equal(result.totalGrams, 220);
  });

  it('splits a wanted amount over the ratio', () => {
    const result = calculateFeed(ratio111, { mode: 'total', totalGrams: 300 });

    assert.equal(result.starterGrams, 100);
    assert.equal(result.flourGrams, 100);
    assert.equal(result.waterGrams, 100);
    assert.equal(result.usableGrams, 300);
  });

  it('feeds extra so the reserve is left over', () => {
    const result = calculateFeed(ratio111, { mode: 'total', totalGrams: 150, reserveGrams: 30 });

    assert.equal(result.totalGrams, 180);
    assert.equal(result.usableGrams, 150);
  });

  it('reports the hydration of the fed starter', () => {
    assert.equal(calculateFeed(ratio111, { mode: 'starter', starterGrams: 50 }).hydrationPct, 100);
    assert.equal(
      calculateFeed({ starter: 1, flour: 2, water: 1 }, { mode: 'starter', starterGrams: 50 }).hydrationPct,
      50
    );
  });

  it('returns zeroes instead of dividing by an empty ratio', () => {
    const result = calculateFeed({ starter: 0, flour: 1, water: 1 }, { mode: 'starter', starterGrams: 50 });

    assert.equal(result.totalGrams, 0);
    assert.equal(result.hydrationPct, 0);
  });
});

describe('getPeakWindow', () => {
  it('lands on the usual peak times at 21°C', () => {
    // Fodringstabellerne siger ~5 timer for 1:1:1 og ~11 timer for 1:5:5.
    assert.ok(Math.abs(getPeakWindow(ratio111).hours - 5) < 0.5);
    assert.ok(Math.abs(getPeakWindow(ratio155).hours - 11) < 0.5);
  });

  it('takes longer the more the starter is diluted', () => {
    assert.ok(getPeakWindow(ratio155).hours > getPeakWindow(DEFAULT_FEED_RATIO).hours);
    assert.ok(getPeakWindow(DEFAULT_FEED_RATIO).hours > getPeakWindow(ratio111).hours);
  });

  it('takes longer in a cold kitchen and less in a warm one', () => {
    const cold = getPeakWindow(ratio111, { roomTempC: 13, starterStrength: 'normal' }).hours;
    const warm = getPeakWindow(ratio111, { roomTempC: 29, starterStrength: 'normal' }).hours;
    const reference = getPeakWindow(ratio111, { roomTempC: 21, starterStrength: 'normal' }).hours;

    // Samme model som bageplanen: ~fordobling for hver 8°C.
    assert.ok(Math.abs(cold - reference * 2) < 0.01);
    assert.ok(Math.abs(warm - reference / 2) < 0.01);
  });

  it('is a window around the peak, not a single moment', () => {
    const window = getPeakWindow(ratio111);

    assert.ok(window.fromHours < window.hours);
    assert.ok(window.toHours > window.hours);
  });
});

describe('getPeakTimes', () => {
  it('counts from the feeding', () => {
    const fedAt = new Date('2026-07-31T20:00:00');
    const window = getPeakWindow(ratio111);
    const { from, to } = getPeakTimes(window, fedAt);

    assert.ok(from.getTime() > fedAt.getTime());
    assert.ok(to.getTime() > from.getTime());
  });
});

describe('formatHourRange', () => {
  it('rounds to half hours', () => {
    assert.equal(formatHourRange({ hours: 5, fromHours: 4.2, toHours: 5.8 }), 'ca. 4–6 timer');
    assert.equal(formatHourRange({ hours: 5, fromHours: 4.4, toHours: 5.4 }), 'ca. 4,5–5,5 timer');
  });

  it('shows one number when the ends round to the same', () => {
    assert.equal(formatHourRange({ hours: 1, fromHours: 0.95, toHours: 1.05 }), 'ca. 1 timer');
  });
});
