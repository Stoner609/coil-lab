import { calculateIndicators } from './indicators';
import { scoreTechnicals } from './scoring';
import type { MomentumReport, OhlcvRow } from './types';
import { validateRows } from './validation';

export function analyzeRows(sampleName: string, inputRows: OhlcvRow[], indexRows?: OhlcvRow[]): MomentumReport {
  const validation = validateRows(inputRows);

  if (!validation.ok) {
    return {
      sampleName,
      analysisDate: validation.rows.at(-1)?.date ?? '',
      rawScore: 0,
      displayScore: 0,
      classification: 'not-qualified',
      conclusion: '資料不足或格式錯誤，無法進行波段強勢判斷。',
      relativeStrengthAvailable: false,
      groups: [],
      riskNotes: [],
      dataNotes: [...validation.errors, ...validation.warnings],
      rows: validation.rows,
    };
  }

  const snapshot = calculateIndicators(validation.rows);
  const indexSnapshot = validateIndexRows(indexRows);
  return {
    sampleName,
    ...scoreTechnicals(snapshot, indexSnapshot),
    analysisDate: snapshot.analysisDate,
    rows: validation.rows,
  };
}

function validateIndexRows(indexRows: OhlcvRow[] | undefined) {
  if (!indexRows) return undefined;

  const validation = validateRows(indexRows.map((row) => ({ ...row, volume: row.volume || 1 })));
  if (!validation.ok) return undefined;

  return calculateIndicators(validation.rows);
}
