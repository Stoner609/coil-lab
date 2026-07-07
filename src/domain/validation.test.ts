import { describe, expect, it } from 'vitest';
import { makeRows } from '../test/fixtures';
import { validateRows } from './validation';

describe('validateRows', () => {
  it('accepts valid OHLCV rows and sorts by date', () => {
    const rows = makeRows(120).reverse();
    const result = validateRows(rows);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].date).toBe('2025-01-01');
  });

  it('rejects insufficient history', () => {
    const result = validateRows(makeRows(119));

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('至少需要 120 筆交易日資料。');
  });

  it('rejects invalid numeric values', () => {
    const rows = makeRows(120);
    rows[5] = { ...rows[5], close: Number.NaN };

    const result = validateRows(rows);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('第 6 筆資料的 close 不是有效數字。');
  });
});
