import { makeBaseThenStrengthRows, makeWeakRows } from '../test/fixtures';
import type { OhlcvRow } from './types';

export interface BuiltInSample {
  id: string;
  label: string;
  kind: 'positive' | 'negative';
  rows: OhlcvRow[];
}

export const builtInSamples: BuiltInSample[] = [
  {
    id: 'base-then-strength',
    label: '示範正樣本：整理後轉強',
    kind: 'positive',
    rows: makeBaseThenStrengthRows(),
  },
  {
    id: 'weak-downtrend',
    label: '示範負樣本：弱勢下降',
    kind: 'negative',
    rows: makeWeakRows(),
  },
];
