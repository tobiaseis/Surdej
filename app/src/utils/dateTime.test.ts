import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeDatePart, mergeTimePart } from './dateTime';

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
