import { describe, expect, it } from 'vitest';
import { makeRows } from '../test/fixtures';
import { analyzeRows } from './report';

describe('analyzeRows', () => {
  it('returns a report for valid rows', () => {
    const report = analyzeRows('測試樣本', makeRows(140, { trend: 'up' }));

    expect(report.sampleName).toBe('測試樣本');
    expect(report.displayScore).toBeGreaterThan(0);
    expect(report.groups.map((group) => group.id)).toContain('trend');
  });

  it('returns a data-quality report for insufficient rows', () => {
    const report = analyzeRows('資料不足', makeRows(20));

    expect(report.classification).toBe('not-qualified');
    expect(report.dataNotes.join(' ')).toContain('至少需要 120 筆交易日資料');
  });

  it('includes relative strength when valid index rows are supplied', () => {
    const report = analyzeRows('測試樣本', makeRows(140, { trend: 'up' }), makeRows(140, { trend: 'flat' }));

    expect(report.relativeStrengthAvailable).toBe(true);
    expect(report.groups.find((group) => group.id === 'relative-strength')?.rules[0].status).toBe('passed');
  });
});
