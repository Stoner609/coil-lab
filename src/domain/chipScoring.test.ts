import { describe, expect, it } from 'vitest';
import { scoreChipFlow } from './chipScoring';
import type { ChipFlowRow } from './types';

function makeRows(overrides: Partial<ChipFlowRow> = {}): ChipFlowRow[] {
  return Array.from({ length: 25 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 6, index + 1)).toISOString().slice(0, 10),
    stockCode: '2330',
    foreignNetBuyShares: 100,
    investmentTrustNetBuyShares: 60,
    dealerNetBuyShares: -10,
    totalInstitutionNetBuyShares: 150,
    marginBuyBalance: 1000 + index * 5,
    marginBuyChange: 5,
    shortSellBalance: 100,
    shortSellChange: 0,
    ...overrides,
  }));
}

describe('scoreChipFlow', () => {
  it('classifies institutional accumulation with controlled margin as supportive', () => {
    const report = scoreChipFlow(makeRows(), '2330');

    expect(report.classification).toBe('supportive');
    expect(report.confidenceNotes.join(' ')).toContain('投信');
    expect(report.blockers).toEqual([]);
  });

  it('classifies rapid margin expansion as risky', () => {
    const report = scoreChipFlow(makeRows({ marginBuyChange: 300 }), '2330');

    expect(report.classification).toBe('risky');
    expect(report.blockers.join(' ')).toContain('融資');
  });

  it('returns unavailable when there are too few rows', () => {
    const report = scoreChipFlow(makeRows().slice(0, 5), '2330');

    expect(report.classification).toBe('unavailable');
    expect(report.unavailableData.join(' ')).toContain('至少 20');
  });
});
