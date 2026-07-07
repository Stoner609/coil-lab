export type RuleStatus = 'passed' | 'failed' | 'unavailable' | 'warning';

export type Classification =
  | 'strong-candidate'
  | 'watchlist'
  | 'insufficient-conditions'
  | 'not-qualified';

export interface OhlcvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: OhlcvRow[];
}

export interface IndicatorSnapshot {
  analysisDate: string;
  close: number;
  ma20: number | null;
  ma60: number | null;
  ma20Slope: number | null;
  ma60Slope: number | null;
  avgVolume20: number | null;
  avgVolume60: number | null;
  return20: number | null;
  return60: number | null;
  rangeHigh60: number | null;
  rangeLow60: number | null;
  rangeWidth60Pct: number | null;
  rangeWidth20Pct: number | null;
  distanceFromMa60Pct: number | null;
  highVolumeDownDays20: number;
  volumeDryUpRatio: number | null;
}

export interface RuleResult {
  id: string;
  label: string;
  status: RuleStatus;
  scoreImpact: number;
  explanation: string;
}

export interface RuleGroupResult {
  id: string;
  label: string;
  maxScore: number;
  score: number;
  rules: RuleResult[];
}

export interface MomentumReport {
  sampleName: string;
  analysisDate: string;
  rawScore: number;
  displayScore: number;
  classification: Classification;
  conclusion: string;
  relativeStrengthAvailable: boolean;
  groups: RuleGroupResult[];
  riskNotes: string[];
  dataNotes: string[];
  rows: OhlcvRow[];
}
