import type { OhlcvRow } from '../domain/types';

export function makeRows(count: number, options: { trend?: 'up' | 'down' | 'flat' } = {}): OhlcvRow[] {
  const trend = options.trend ?? 'up';
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
    const drift = trend === 'up' ? index * 0.45 : trend === 'down' ? -index * 0.25 : 0;
    const base = 50 + drift + Math.sin(index / 6) * 1.5;
    return {
      date,
      open: Number((base - 0.4).toFixed(2)),
      high: Number((base + 1).toFixed(2)),
      low: Number((base - 1).toFixed(2)),
      close: Number(base.toFixed(2)),
      volume: Math.round(1000 + index * 4),
    };
  });
}

export function makeBaseThenStrengthRows(): OhlcvRow[] {
  return Array.from({ length: 150 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
    const base = index < 80 ? 52 + Math.sin(index / 5) * 4 : 58 + Math.sin(index / 7) * 2 + (index - 80) * 0.18;
    const volume = index < 95 ? 1400 - index * 3 : 900 + (index - 95) * 8;
    return {
      date,
      open: Number((base - 0.5).toFixed(2)),
      high: Number((base + 1.2).toFixed(2)),
      low: Number((base - 1.1).toFixed(2)),
      close: Number(base.toFixed(2)),
      volume: Math.max(600, Math.round(volume)),
    };
  });
}

export function makeWeakRows(): OhlcvRow[] {
  return Array.from({ length: 150 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
    const base = 70 - index * 0.12 + Math.sin(index / 4) * 3;
    return {
      date,
      open: Number((base + 0.4).toFixed(2)),
      high: Number((base + 1).toFixed(2)),
      low: Number((base - 1.5).toFixed(2)),
      close: Number(base.toFixed(2)),
      volume: Math.round(1200 + Math.sin(index / 3) * 300),
    };
  });
}
