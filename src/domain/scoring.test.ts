import { describe, expect, it } from 'vitest';
import type { IndicatorSnapshot } from './types';
import { scoreTechnicals } from './scoring';

const strongSnapshot: IndicatorSnapshot = {
  analysisDate: '2025-06-01',
  close: 100,
  ma20: 94,
  ma60: 86,
  ma20Slope: 2.5,
  ma60Slope: 0.8,
  avgVolume20: 900,
  avgVolume60: 1200,
  return20: 12,
  return60: 24,
  rangeHigh60: 104,
  rangeLow60: 82,
  rangeWidth60Pct: 26.83,
  rangeWidth20Pct: 15,
  distanceFromMa60Pct: 16.28,
  highVolumeDownDays20: 1,
  volumeDryUpRatio: 0.75,
};

describe('scoreTechnicals', () => {
  it('scores a healthy pre-launch structure as a strong candidate', () => {
    const result = scoreTechnicals(strongSnapshot);

    expect(result.displayScore).toBeGreaterThanOrEqual(80);
    expect(result.groups).toHaveLength(5);
    expect(result.relativeStrengthAvailable).toBe(false);
  });

  it('deducts risk when the stock is extended', () => {
    const result = scoreTechnicals({
      ...strongSnapshot,
      return20: 48,
      distanceFromMa60Pct: 42,
    });

    expect(result.displayScore).toBeLessThan(80);
    expect(result.riskNotes.join(' ')).toContain('短期漲幅');
  });

  it('marks triggered risk rules as warnings rather than passed approvals', () => {
    const result = scoreTechnicals({
      ...strongSnapshot,
      return20: 48,
      distanceFromMa60Pct: 42,
    });
    const riskGroup = result.groups.find((group) => group.id === 'risk');

    expect(riskGroup?.rules.filter((rule) => rule.scoreImpact < 0).map((rule) => rule.status)).toEqual([
      'warning',
      'warning',
    ]);
  });

  it('scores relative strength when index indicators are available', () => {
    const result = scoreTechnicals(strongSnapshot, {
      ...strongSnapshot,
      return20: 4,
      return60: 10,
    });
    const relativeStrength = result.groups.find((group) => group.id === 'relative-strength');

    expect(result.relativeStrengthAvailable).toBe(true);
    expect(relativeStrength?.rules.map((rule) => rule.status)).toEqual(['passed', 'passed']);
    expect(relativeStrength?.score).toBe(15);
    expect(result.dataNotes).not.toContain('未提供大盤資料；相對強度已標記為 unavailable，總分以 85 分技術分數正規化。');
  });
});
