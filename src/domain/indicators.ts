import { THRESHOLDS } from './config';
import type { IndicatorSnapshot, OhlcvRow } from './types';

export function movingAverage(values: number[], windowSize: number): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < windowSize) return null;
    const window = values.slice(index + 1 - windowSize, index + 1);
    return round(window.reduce((sum, value) => sum + value, 0) / windowSize);
  });
}

export function calculateIndicators(rows: OhlcvRow[]): IndicatorSnapshot {
  const closes = rows.map((row) => row.close);
  const volumes = rows.map((row) => row.volume);
  const ma20Series = movingAverage(closes, 20);
  const ma60Series = movingAverage(closes, 60);
  const avgVolume20Series = movingAverage(volumes, 20);
  const avgVolume60Series = movingAverage(volumes, 60);
  const lastIndex = rows.length - 1;
  const latest = rows[lastIndex];
  const last60 = rows.slice(Math.max(0, rows.length - 60));
  const last20 = rows.slice(Math.max(0, rows.length - 20));
  const rangeHigh60 = Math.max(...last60.map((row) => row.high));
  const rangeLow60 = Math.min(...last60.map((row) => row.low));
  const rangeHigh20 = Math.max(...last20.map((row) => row.high));
  const rangeLow20 = Math.min(...last20.map((row) => row.low));
  const avgVolume20 = avgVolume20Series[lastIndex];

  return {
    analysisDate: latest.date,
    close: latest.close,
    ma20: ma20Series[lastIndex],
    ma60: ma60Series[lastIndex],
    ma20Slope: slope(ma20Series, lastIndex, 5),
    ma60Slope: slope(ma60Series, lastIndex, 10),
    avgVolume20,
    avgVolume60: avgVolume60Series[lastIndex],
    return20: pctChange(closes[lastIndex - 20], latest.close),
    return60: pctChange(closes[lastIndex - 60], latest.close),
    rangeHigh60,
    rangeLow60,
    rangeWidth60Pct: pctRange(rangeHigh60, rangeLow60),
    rangeWidth20Pct: pctRange(rangeHigh20, rangeLow20),
    distanceFromMa60Pct: ma60Series[lastIndex] === null ? null : pctChange(ma60Series[lastIndex], latest.close),
    highVolumeDownDays20: countHighVolumeDownDays(last20, avgVolume20),
    volumeDryUpRatio:
      avgVolume20Series[lastIndex] === null || avgVolume60Series[lastIndex] === null
        ? null
        : round(avgVolume20Series[lastIndex] / avgVolume60Series[lastIndex]),
  };
}

function slope(series: Array<number | null>, index: number, lookback: number): number | null {
  const current = series[index];
  const previous = series[index - lookback];
  if (current === null || previous === null || previous === undefined) return null;
  return round(current - previous);
}

function pctChange(start: number | undefined, end: number): number | null {
  if (start === undefined || start === 0) return null;
  return round(((end - start) / start) * 100);
}

function pctRange(high: number, low: number): number {
  return round(((high - low) / low) * 100);
}

function countHighVolumeDownDays(rows: OhlcvRow[], avgVolume20: number | null): number {
  if (avgVolume20 === null) return 0;
  return rows.filter(
    (row) => row.close < row.open && row.volume >= avgVolume20 * THRESHOLDS.highVolumeRatio,
  ).length;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
