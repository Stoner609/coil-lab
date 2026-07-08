import type { IndicatorSnapshot, MomentumReport, RiskRewardEstimate, SetupState, TraderDecision } from './types';

const MAX_ACTIONABLE_DISTANCE_FROM_MA60 = 18;
const MAX_WATCH_DISTANCE_FROM_MA60 = 28;
const MAX_ACTIONABLE_RISK_PCT = 12;
const MIN_REWARD_RISK_RATIO = 1.5;

export function buildTraderDecision(report: MomentumReport, snapshot: IndicatorSnapshot): TraderDecision {
  const riskReward = estimateRiskReward(snapshot);
  const blockers = buildBlockers(report, snapshot, riskReward);
  const setupState = classifySetup(report, snapshot, riskReward, blockers);

  return {
    setupState,
    headline: headlineFor(setupState),
    confidenceNotes: buildConfidenceNotes(report, snapshot, riskReward),
    blockers,
    unavailableData: buildUnavailableData(report),
    riskReward,
  };
}

export function estimateRiskReward(snapshot: IndicatorSnapshot): RiskRewardEstimate {
  const entryReference = snapshot.close;
  const invalidationLevel = chooseInvalidationLevel(snapshot);
  const targetReference =
    snapshot.rangeHigh60 !== null && snapshot.rangeHigh60 > entryReference ? snapshot.rangeHigh60 : null;
  const riskPct = invalidationLevel === null ? null : round(((entryReference - invalidationLevel) / entryReference) * 100);
  const rewardPct = targetReference === null ? null : round(((targetReference - entryReference) / entryReference) * 100);
  const rewardRiskRatio =
    riskPct === null || rewardPct === null || riskPct <= 0 ? null : round(rewardPct / riskPct);

  return {
    entryReference,
    invalidationLevel,
    targetReference,
    riskPct,
    rewardPct,
    rewardRiskRatio,
  };
}

function classifySetup(
  report: MomentumReport,
  snapshot: IndicatorSnapshot,
  riskReward: RiskRewardEstimate,
  blockers: string[],
): SetupState {
  if (report.classification === 'not-qualified' || report.classification === 'insufficient-conditions') return 'avoid';

  if (snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > MAX_WATCH_DISTANCE_FROM_MA60) {
    return 'extended';
  }

  if (report.classification === 'strong-candidate') {
    const rewardRiskOk = riskReward.rewardRiskRatio === null || riskReward.rewardRiskRatio >= MIN_REWARD_RISK_RATIO;
    if (blockers.length === 0 && rewardRiskOk) return 'actionable';

    if (snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > MAX_ACTIONABLE_DISTANCE_FROM_MA60) {
      return 'extended';
    }
  }

  return 'watch';
}

function chooseInvalidationLevel(snapshot: IndicatorSnapshot): number | null {
  const candidates = [snapshot.ma60, snapshot.rangeLow60].filter(
    (value): value is number => value !== null && value < snapshot.close,
  );
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

function buildBlockers(
  report: MomentumReport,
  snapshot: IndicatorSnapshot,
  riskReward: RiskRewardEstimate,
): string[] {
  const blockers: string[] = [];

  if (snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > MAX_ACTIONABLE_DISTANCE_FROM_MA60) {
    blockers.push(`距離 60 日均線 ${snapshot.distanceFromMa60Pct}%，進場位置可能偏追價。`);
  }

  if (snapshot.highVolumeDownDays20 >= 4) {
    blockers.push(`近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次，賣壓需要人工確認。`);
  }

  if (riskReward.riskPct !== null && riskReward.riskPct > MAX_ACTIONABLE_RISK_PCT) {
    blockers.push(`技術失效距離約 ${riskReward.riskPct}%，風險距離偏大。`);
  }

  blockers.push(...report.riskNotes);
  return Array.from(new Set(blockers));
}

function buildConfidenceNotes(
  report: MomentumReport,
  snapshot: IndicatorSnapshot,
  riskReward: RiskRewardEstimate,
): string[] {
  const notes = [`目前強勢分數 ${report.displayScore}，分類為 ${report.classification}。`];

  if (snapshot.volumeDryUpRatio !== null) notes.push(`20/60 日均量比為 ${snapshot.volumeDryUpRatio}。`);
  if (riskReward.rewardRiskRatio !== null) notes.push(`估計報酬風險比為 ${riskReward.rewardRiskRatio}。`);
  if (report.relativeStrengthAvailable) notes.push('已納入大盤相對強度。');

  return notes;
}

function buildUnavailableData(report: MomentumReport): string[] {
  const unavailable = ['基本面資料尚未接入', '籌碼資料尚未接入', '產業同儕資料尚未接入'];
  if (!report.relativeStrengthAvailable) unavailable.unshift('相對強度資料不可用');
  return unavailable;
}

function headlineFor(setupState: SetupState): string {
  if (setupState === 'actionable') return '可行動型態，但仍需交易者確認進出場計畫。';
  if (setupState === 'watch') return '可觀察型態，等待更明確確認或更好的風險位置。';
  if (setupState === 'extended') return '強勢但位置偏延伸，追價風險較高。';
  return '目前不適合作為強勢波段候選。';
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
