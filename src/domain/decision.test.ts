import { describe, expect, it } from 'vitest';
import { buildTraderDecision } from './decision';
import type { IndicatorSnapshot, MomentumReport } from './types';

function snapshot(overrides: Partial<IndicatorSnapshot> = {}): IndicatorSnapshot {
  return {
    analysisDate: '2026-07-08',
    close: 100,
    ma20: 96,
    ma60: 90,
    ma20Slope: 1,
    ma60Slope: 0.5,
    avgVolume20: 1000,
    avgVolume60: 1200,
    return20: 8,
    return60: 18,
    rangeHigh60: 125,
    rangeLow60: 85,
    rangeWidth60Pct: 47.06,
    rangeWidth20Pct: 10,
    distanceFromMa60Pct: 11.11,
    highVolumeDownDays20: 1,
    volumeDryUpRatio: 0.83,
    ...overrides,
  };
}

function report(overrides: Partial<MomentumReport> = {}): MomentumReport {
  return {
    sampleName: 'sample',
    analysisDate: '2026-07-08',
    rawScore: 80,
    displayScore: 82,
    classification: 'strong-candidate',
    conclusion: '技術面具備波段強勢候選條件，但仍需人工確認資料品質與風險。',
    relativeStrengthAvailable: true,
    groups: [],
    riskNotes: [],
    dataNotes: ['已納入 TWSE 加權指數資料計算相對強度。'],
    rows: [],
    ...overrides,
  };
}

describe('buildTraderDecision', () => {
  it('marks a strong candidate with controlled risk as actionable', () => {
    const decision = buildTraderDecision(report(), snapshot());

    expect(decision.setupState).toBe('actionable');
    expect(decision.headline).toContain('可行動');
    expect(decision.riskReward.invalidationLevel).toBe(90);
    expect(decision.riskReward.riskPct).toBe(10);
    expect(decision.riskReward.targetReference).toBe(125);
    expect(decision.riskReward.rewardRiskRatio).toBe(2.5);
  });

  it('marks an otherwise strong candidate as extended when distance from ma60 is high', () => {
    const decision = buildTraderDecision(report(), snapshot({ close: 125, distanceFromMa60Pct: 38.89 }));

    expect(decision.setupState).toBe('extended');
    expect(decision.blockers.some((note) => note.includes('距離 60 日均線'))).toBe(true);
  });

  it('marks weak classifications as avoid', () => {
    const decision = buildTraderDecision(
      report({ displayScore: 35, classification: 'not-qualified' }),
      snapshot({ close: 80, ma20: 90, ma60: 95 }),
    );

    expect(decision.setupState).toBe('avoid');
  });

  it('reports unavailable optional data explicitly', () => {
    const decision = buildTraderDecision(report({ relativeStrengthAvailable: false }), snapshot());

    expect(decision.unavailableData).toContain('相對強度資料不可用');
    expect(decision.unavailableData).toContain('基本面資料尚未接入');
    expect(decision.unavailableData).toContain('籌碼資料尚未接入');
  });
});
