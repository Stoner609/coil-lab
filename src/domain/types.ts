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

export type SetupState = 'actionable' | 'watch' | 'extended' | 'avoid';

export interface RiskRewardEstimate {
  entryReference: number;
  invalidationLevel: number | null;
  targetReference: number | null;
  riskPct: number | null;
  rewardPct: number | null;
  rewardRiskRatio: number | null;
}

export interface TraderDecision {
  setupState: SetupState;
  headline: string;
  confidenceNotes: string[];
  blockers: string[];
  unavailableData: string[];
  riskReward: RiskRewardEstimate;
}

export interface ForwardReturns {
  day5: number | null;
  day10: number | null;
  day20: number | null;
  day40: number | null;
  day60: number | null;
}

export interface SignalBacktestResult {
  signalDate: string;
  signalClose: number;
  displayScore: number;
  classification: Classification;
  forwardReturns: ForwardReturns;
  maxFavorable20: number | null;
  maxFavorable60: number | null;
  maxAdverse20: number | null;
  maxAdverse60: number | null;
  invalidationTouched20: boolean | null;
}

export interface SignalBacktestSummary {
  signalCount: number;
  averageReturn20: number | null;
  medianReturn20: number | null;
  winRate20: number | null;
  averageMaxAdverse20: number | null;
  bestReturn20: number | null;
  worstReturn20: number | null;
}

export interface SignalBacktestReport {
  signals: SignalBacktestResult[];
  summary: SignalBacktestSummary;
  notes: string[];
}
