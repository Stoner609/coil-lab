import { makeBaseThenStrengthRows, makeWeakRows } from '../test/fixtures';
import type { ChipFlowRow, OhlcvRow } from './types';

export interface BuiltInSample {
  id: string;
  label: string;
  kind: 'positive' | 'negative';
  rows: OhlcvRow[];
  chipRows?: ChipFlowRow[];
}

export const builtInSamples: BuiltInSample[] = [
  {
    id: 'base-then-strength',
    label: '示範正樣本：整理後轉強',
    kind: 'positive',
    rows: makeBaseThenStrengthRows(),
    chipRows: makeSupportiveChipRows('base-then-strength'),
  },
  {
    id: 'weak-downtrend',
    label: '示範負樣本：弱勢下降',
    kind: 'negative',
    rows: makeWeakRows(),
    chipRows: makeRiskyChipRows('weak-downtrend'),
  },
];

function makeSupportiveChipRows(stockCode: string): ChipFlowRow[] {
  return Array.from({ length: 25 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 4, index + 1)).toISOString().slice(0, 10),
    stockCode,
    foreignNetBuyShares: 120,
    investmentTrustNetBuyShares: 80,
    dealerNetBuyShares: -10,
    totalInstitutionNetBuyShares: 190,
    marginBuyBalance: 1000 + index * 4,
    marginBuyChange: 4,
    shortSellBalance: 100,
    shortSellChange: 0,
  }));
}

function makeRiskyChipRows(stockCode: string): ChipFlowRow[] {
  return Array.from({ length: 25 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 4, index + 1)).toISOString().slice(0, 10),
    stockCode,
    foreignNetBuyShares: -80,
    investmentTrustNetBuyShares: -20,
    dealerNetBuyShares: 0,
    totalInstitutionNetBuyShares: -100,
    marginBuyBalance: 1000 + index * 300,
    marginBuyChange: 300,
    shortSellBalance: 100 + index * 60,
    shortSellChange: 60,
  }));
}
