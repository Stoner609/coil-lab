import type { ChipClassification, ChipFlowReport, ChipFlowRow, ChipRuleResult, FundamentalSnapshot } from './types';

const MIN_ROWS = 20;
const MAX_SCORE = 30;

export function scoreChipFlow(rows: ChipFlowRow[], stockCode: string, providedFundamental?: FundamentalSnapshot): ChipFlowReport {
  const sortedRows = rows.filter((row) => row.stockCode === stockCode).sort((a, b) => a.date.localeCompare(b.date));
  const fundamental = providedFundamental ?? unavailableFundamental(stockCode);

  if (sortedRows.length < MIN_ROWS) {
    return {
      classification: 'unavailable',
      score: 0,
      maxScore: MAX_SCORE,
      rules: [
        unavailableRule('chip-history-too-short', '籌碼資料不足', `籌碼資料至少 20 筆，目前 ${sortedRows.length} 筆。`),
      ],
      confidenceNotes: [],
      blockers: [],
      unavailableData: ['籌碼資料至少 20 筆才判斷。', '月營收資料尚未接入。', '季度財報資料尚未接入。'],
      latestRow: sortedRows.at(-1) ?? null,
      fundamental,
    };
  }

  const foreign10 = sumLast(sortedRows, 10, 'foreignNetBuyShares');
  const trust10 = sumLast(sortedRows, 10, 'investmentTrustNetBuyShares');
  const total10 = sumLast(sortedRows, 10, 'totalInstitutionNetBuyShares');
  const margin10 = sumLast(sortedRows, 10, 'marginBuyChange');
  const short10 = sumLast(sortedRows, 10, 'shortSellChange');
  const rules = [
    rule('trust-buying-10d', '投信 10 日買超', trust10 !== null && trust10 > 0, 8, `投信 10 日合計 ${display(trust10)} 股。`),
    rule('foreign-buying-10d', '外資 10 日買超', foreign10 !== null && foreign10 > 0, 6, `外資 10 日合計 ${display(foreign10)} 股。`),
    rule('total-institution-buying-10d', '法人合計 10 日買超', total10 !== null && total10 > 0, 6, `法人 10 日合計 ${display(total10)} 股。`),
    riskRule('margin-overheat-10d', '融資快速增加', margin10 !== null && margin10 > 2000, -7, `融資 10 日變化 ${display(margin10)} 股。`),
    riskRule('short-sell-rising-10d', '融券快速增加', short10 !== null && short10 > 1000, -4, `融券 10 日變化 ${display(short10)} 股。`),
  ];
  const score = rules.reduce((sum, item) => sum + item.scoreImpact, 0);
  const blockers = rules.filter((item) => item.status === 'warning').map((item) => item.explanation);

  return {
    classification: classify(score, blockers),
    score,
    maxScore: MAX_SCORE,
    rules,
    confidenceNotes: buildConfidenceNotes(trust10, foreign10, total10),
    blockers,
    unavailableData: ['月營收資料尚未接入。', '季度財報資料尚未接入。'],
    latestRow: sortedRows.at(-1) ?? null,
    fundamental,
  };
}

function classify(score: number, blockers: string[]): ChipClassification {
  if (blockers.length > 0) return 'risky';
  if (score >= 14) return 'supportive';
  return 'mixed';
}

function buildConfidenceNotes(trust10: number | null, foreign10: number | null, total10: number | null): string[] {
  const notes: string[] = [];
  if (trust10 !== null && trust10 > 0) notes.push(`投信 10 日買超 ${trust10} 股。`);
  if (foreign10 !== null && foreign10 > 0) notes.push(`外資 10 日買超 ${foreign10} 股。`);
  if (total10 !== null && total10 > 0) notes.push(`法人合計 10 日買超 ${total10} 股。`);
  return notes;
}

function sumLast(rows: ChipFlowRow[], count: number, field: keyof ChipFlowRow): number | null {
  const values = rows.slice(-count).map((row) => row[field]);
  if (values.some((value) => typeof value !== 'number')) return null;
  return values.reduce<number>((sum, value) => sum + Number(value), 0);
}

function rule(id: string, label: string, passed: boolean, points: number, explanation: string): ChipRuleResult {
  return {
    id,
    label,
    status: passed ? 'passed' : 'failed',
    scoreImpact: passed ? points : 0,
    explanation,
  };
}

function riskRule(id: string, label: string, active: boolean, points: number, explanation: string): ChipRuleResult {
  return {
    id,
    label,
    status: active ? 'warning' : 'passed',
    scoreImpact: active ? points : 0,
    explanation,
  };
}

function unavailableRule(id: string, label: string, explanation: string): ChipRuleResult {
  return { id, label, status: 'unavailable', scoreImpact: 0, explanation };
}

function unavailableFundamental(stockCode: string): FundamentalSnapshot {
  return {
    stockCode,
    monthlyRevenueAvailable: false,
    latestRevenueMonth: null,
    revenueYoYPct: null,
    revenueMoMPct: null,
    trailingThreeMonthRevenueYoYPct: null,
    quarterlyFinancialsAvailable: false,
    latestQuarter: null,
    eps: null,
    grossMarginPct: null,
    operatingMarginPct: null,
  };
}

function display(value: number | null): string {
  return value === null ? '無資料' : String(value);
}
