import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatCountdown, getGreeting, mergeDatePart, mergeTimePart } from './dateTime';

describe('dateTime helpers', () => {
  it('changes the calendar date without changing the selected time', () => {
    const current = new Date('2026-06-03T09:30:00.000Z');
    const selectedDate = new Date('2026-06-05T00:00:00.000Z');

    assert.equal(mergeDatePart(current, selectedDate).toISOString(), '2026-06-05T09:30:00.000Z');
  });

  it('changes the selected time without changing the calendar date', () => {
    const current = new Date('2026-06-03T09:30:00.000Z');
    const selectedTime = new Date('2026-06-01T14:45:00.000Z');

    assert.equal(mergeTimePart(current, selectedTime).toISOString(), '2026-06-03T14:45:00.000Z');
  });
});

describe('formatCountdown', () => {
  const now = new Date('2026-06-03T09:00:00.000Z');

  it('formats the remaining time as hh:mm:ss', () => {
    const target = new Date('2026-06-03T11:02:05.000Z');

    assert.equal(formatCountdown(target, now), '02:02:05');
  });

  it('keeps counting past 24 hours instead of wrapping', () => {
    const target = new Date('2026-06-04T12:00:00.000Z');

    assert.equal(formatCountdown(target, now), '27:00:00');
  });

  it('clamps targets in the past to zero', () => {
    const target = new Date('2026-06-03T08:00:00.000Z');

    assert.equal(formatCountdown(target, now), '00:00:00');
  });
});

describe('getGreeting', () => {
  const at = (hour: number) => {
    const date = new Date('2026-06-03T00:00:00.000Z');
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  it('changes with the time of day', () => {
    assert.equal(getGreeting(at(3)), 'Godnat');
    assert.equal(getGreeting(at(8)), 'Godmorgen');
    assert.equal(getGreeting(at(14)), 'Goddag');
    assert.equal(getGreeting(at(21)), 'Godaften');
  });
});
