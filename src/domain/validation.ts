import { THRESHOLDS } from './config';
import type { DataValidationResult, OhlcvRow } from './types';

const numericFields: Array<keyof Pick<OhlcvRow, 'open' | 'high' | 'low' | 'close' | 'volume'>> = [
  'open',
  'high',
  'low',
  'close',
  'volume',
];

export function validateRows(inputRows: OhlcvRow[]): DataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (inputRows.length === 0) {
    return { ok: false, errors: ['CSV 沒有可分析資料。'], warnings, rows: [] };
  }

  const rows = [...inputRows].sort((a, b) => a.date.localeCompare(b.date));

  if (rows.length < THRESHOLDS.minimumRows) {
    errors.push(`至少需要 ${THRESHOLDS.minimumRows} 筆交易日資料。`);
  }

  rows.forEach((row, index) => {
    const parsedDate = Date.parse(row.date);
    if (Number.isNaN(parsedDate)) {
      errors.push(`第 ${index + 1} 筆資料的 date 不是有效日期。`);
    }

    numericFields.forEach((field) => {
      if (!Number.isFinite(row[field])) {
        errors.push(`第 ${index + 1} 筆資料的 ${field} 不是有效數字。`);
      }
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    rows,
  };
}
