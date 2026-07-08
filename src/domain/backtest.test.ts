import { describe, expect, it } from 'vitest';
import { runSignalBacktest } from './backtest';
import type { OhlcvRow } from './types';

function row(index: number, close: number): OhlcvRow {
  return {
    date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10),
    open: close - 0.5,
    high: close + 2,
    low: close - 2,
    close,
    volume: index > 110 ? 900 : 1200,
  };
}

function momentumRows(): OhlcvRow[] {
  return Array.from({ length: 180 }, (_, index) => {
    const base = index < 90 ? 80 + index * 0.08 : 87 + (index - 90) * 0.45;
    return row(index, Number(base.toFixed(2)));
  });
}

describe('runSignalBacktest', () => {
  it('returns summary and at least one strong-candidate signal for a rising dataset', () => {
    const result = runSignalBacktest(momentumRows(), undefined, { threshold: 70, cooldownDays: 20 });

    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.summary.signalCount).toBe(result.signals.length);
    expect(result.signals[0].forwardReturns.day20).not.toBeNull();
  });

  it('honors cooldown so nearby repeated signals are suppressed', () => {
    const withCooldown = runSignalBacktest(momentumRows(), undefined, { threshold: 70, cooldownDays: 20 });
    const withoutCooldown = runSignalBacktest(momentumRows(), undefined, { threshold: 70, cooldownDays: 1 });

    expect(withoutCooldown.signals.length).toBeGreaterThanOrEqual(withCooldown.signals.length);
  });

  it('returns null forward metrics when future rows are unavailable', () => {
    const rows = momentumRows().slice(0, 130);
    const result = runSignalBacktest(rows, undefined, { threshold: 60, cooldownDays: 1 });
    const last = result.signals.at(-1);

    expect(last?.forwardReturns.day60).toBeNull();
  });
});
