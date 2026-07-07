import { describe, expect, it } from 'vitest';
import { makeRows } from '../test/fixtures';
import { calculateIndicators, movingAverage } from './indicators';

describe('indicators', () => {
  it('calculates a moving average for a fixed window', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('returns a snapshot for the latest row', () => {
    const snapshot = calculateIndicators(makeRows(140, { trend: 'up' }));

    expect(snapshot.analysisDate).toBe('2025-05-20');
    expect(snapshot.ma20).not.toBeNull();
    expect(snapshot.ma60).not.toBeNull();
    expect(snapshot.return20).toBeGreaterThan(0);
    expect(snapshot.rangeHigh60).toBeGreaterThan(snapshot.rangeLow60 ?? 0);
  });
});
