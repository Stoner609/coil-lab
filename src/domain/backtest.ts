import { estimateRiskReward } from './decision';
import { calculateIndicators } from './indicators';
import { analyzeRows } from './report';
import type {
  Classification,
  OhlcvRow,
  SignalBacktestReport,
  SignalBacktestResult,
  SignalBacktestSummary,
} from './types';

interface BacktestOptions {
  threshold?: number;
  cooldownDays?: number;
}

const MIN_LOOKBACK_ROWS = 120;
const DEFAULT_THRESHOLD = 80;
const DEFAULT_COOLDOWN_DAYS = 20;

export function runSignalBacktest(
  rows: OhlcvRow[],
  indexRows?: OhlcvRow[],
  options: BacktestOptions = {},
): SignalBacktestReport {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const cooldownDays = options.cooldownDays ?? DEFAULT_COOLDOWN_DAYS;
  const signals: SignalBacktestResult[] = [];
  let previousScore: number | null = null;
  let lastSignalIndex = -Infinity;

  for (let index = MIN_LOOKBACK_ROWS - 1; index < rows.length; index += 1) {
    const windowRows = rows.slice(0, index + 1);
    const windowIndexRows = alignIndexRows(indexRows, windowRows.at(-1)?.date);
    const report = analyzeRows('backtest', windowRows, windowIndexRows);
    const crossedThreshold = report.displayScore >= threshold && (previousScore === null || previousScore < threshold);
    const cooldownPassed = index - lastSignalIndex >= cooldownDays;

    if (crossedThreshold && cooldownPassed) {
      const snapshot = calculateIndicators(windowRows);
      const riskReward = estimateRiskReward(snapshot);
      signals.push(buildSignal(rows, index, report.displayScore, report.classification, riskReward.invalidationLevel));
      lastSignalIndex = index;
    }

    previousScore = report.displayScore;
  }

  return {
    signals,
    summary: summarize(signals),
    notes: buildNotes(rows, signals),
  };
}

function buildSignal(
  rows: OhlcvRow[],
  signalIndex: number,
  displayScore: number,
  classification: Classification,
  invalidationLevel: number | null,
): SignalBacktestResult {
  const signal = rows[signalIndex];

  return {
    signalDate: signal.date,
    signalClose: signal.close,
    displayScore,
    classification,
    forwardReturns: {
      day5: forwardReturn(rows, signalIndex, 5),
      day10: forwardReturn(rows, signalIndex, 10),
      day20: forwardReturn(rows, signalIndex, 20),
      day40: forwardReturn(rows, signalIndex, 40),
      day60: forwardReturn(rows, signalIndex, 60),
    },
    maxFavorable20: maxFavorable(rows, signalIndex, 20),
    maxFavorable60: maxFavorable(rows, signalIndex, 60),
    maxAdverse20: maxAdverse(rows, signalIndex, 20),
    maxAdverse60: maxAdverse(rows, signalIndex, 60),
    invalidationTouched20: invalidationTouched(rows, signalIndex, 20, invalidationLevel),
  };
}

function forwardReturn(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const future = rows[signalIndex + days];
  if (!future) return null;
  return round(((future.close - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function maxFavorable(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const futureRows = rows.slice(signalIndex + 1, signalIndex + days + 1);
  if (futureRows.length === 0) return null;
  const maxHigh = Math.max(...futureRows.map((row) => row.high));
  return round(((maxHigh - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function maxAdverse(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const futureRows = rows.slice(signalIndex + 1, signalIndex + days + 1);
  if (futureRows.length === 0) return null;
  const minLow = Math.min(...futureRows.map((row) => row.low));
  return round(((minLow - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function invalidationTouched(
  rows: OhlcvRow[],
  signalIndex: number,
  days: number,
  invalidationLevel: number | null,
): boolean | null {
  if (invalidationLevel === null) return null;
  return rows.slice(signalIndex + 1, signalIndex + days + 1).some((row) => row.low <= invalidationLevel);
}

function summarize(signals: SignalBacktestResult[]): SignalBacktestSummary {
  const returns20 = signals
    .map((signal) => signal.forwardReturns.day20)
    .filter((value): value is number => value !== null);
  const adverse20 = signals.map((signal) => signal.maxAdverse20).filter((value): value is number => value !== null);

  return {
    signalCount: signals.length,
    averageReturn20: average(returns20),
    medianReturn20: median(returns20),
    winRate20: returns20.length === 0 ? null : round((returns20.filter((value) => value > 0).length / returns20.length) * 100),
    averageMaxAdverse20: average(adverse20),
    bestReturn20: returns20.length === 0 ? null : Math.max(...returns20),
    worstReturn20: returns20.length === 0 ? null : Math.min(...returns20),
  };
}

function alignIndexRows(indexRows: OhlcvRow[] | undefined, maxDate: string | undefined): OhlcvRow[] | undefined {
  if (!indexRows || !maxDate) return undefined;
  return indexRows.filter((row) => row.date <= maxDate);
}

function buildNotes(rows: OhlcvRow[], signals: SignalBacktestResult[]): string[] {
  const notes = ['此回測驗證分數訊號，不模擬實際下單、滑價、手續費或部位控管。'];
  if (rows.length < MIN_LOOKBACK_ROWS) notes.push('資料少於 120 筆，無法產生完整歷史訊號。');
  if (signals.length === 0) notes.push('此資料區間沒有符合門檻的強勢訊號。');
  return notes;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
