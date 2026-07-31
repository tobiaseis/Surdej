import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDecimal } from './formatNumber';

describe('formatDecimal', () => {
  it('writes decimals with a Danish comma', () => {
    assert.equal(formatDecimal(77.27, 1), '77,3');
    assert.equal(formatDecimal(18.5), '18,5');
  });

  it('keeps whole numbers clean when no decimal count is given', () => {
    assert.equal(formatDecimal(500), '500');
    assert.equal(formatDecimal(18), '18');
  });

  it('pads to the requested number of decimals', () => {
    assert.equal(formatDecimal(2, 1), '2,0');
  });

  it('falls back to zero for values that are not numbers', () => {
    assert.equal(formatDecimal(Number.NaN, 1), '0,0');
  });
});
