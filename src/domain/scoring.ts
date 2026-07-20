import { classifyScore, SCORE_WEIGHTS, THRESHOLDS } from './config';
import type { IndicatorSnapshot, MomentumReport, RuleGroupResult, RuleResult } from './types';

interface ScoreResult {
  rawScore: number;
  displayScore: number;
  classification: MomentumReport['classification'];
  conclusion: string;
  relativeStrengthAvailable: boolean;
  groups: RuleGroupResult[];
  riskNotes: string[];
  dataNotes: string[];
}

export function scoreTechnicals(snapshot: IndicatorSnapshot, indexSnapshot?: IndicatorSnapshot): ScoreResult {
  const trend = group('trend', '趨勢結構', SCORE_WEIGHTS.trend, [
    rule(
      'close-above-ma20',
      '收盤站上 20 日均線',
      snapshot.ma20 !== null && snapshot.close > snapshot.ma20,
      8,
      `收盤 ${snapshot.close}，20 日均線 ${display(snapshot.ma20)}。`,
    ),
    rule(
      'close-above-ma60',
      '收盤站上 60 日均線',
      snapshot.ma60 !== null && snapshot.close > snapshot.ma60,
      8,
      `收盤 ${snapshot.close}，60 日均線 ${display(snapshot.ma60)}。`,
    ),
    rule(
      'ma20-rising',
      '20 日均線翻揚',
      snapshot.ma20Slope !== null && snapshot.ma20Slope > 0,
      7,
      `20 日均線斜率 ${display(snapshot.ma20Slope)}。`,
    ),
    rule(
      'ma60-flat-up',
      '60 日均線走平或向上',
      snapshot.ma60Slope !== null && snapshot.ma60Slope >= 0,
      7,
      `60 日均線斜率 ${display(snapshot.ma60Slope)}。`,
    ),
  ]);

  const base = group('base', '整理型態', SCORE_WEIGHTS.base, [
    rule(
      'range-contraction',
      '20 日區間相對 60 日區間收斂',
      snapshot.rangeWidth20Pct !== null &&
        snapshot.rangeWidth60Pct !== null &&
        snapshot.rangeWidth20Pct <= snapshot.rangeWidth60Pct * THRESHOLDS.contractionRatio,
      8,
      `20 日區間 ${display(snapshot.rangeWidth20Pct)}%，60 日區間 ${display(snapshot.rangeWidth60Pct)}%。`,
    ),
    rule(
      'near-base-high',
      '接近 60 日平台高點',
      snapshot.rangeHigh60 !== null &&
        ((snapshot.rangeHigh60 - snapshot.close) / snapshot.rangeHigh60) * 100 <= THRESHOLDS.nearBaseHighPct,
      7,
      `收盤距 60 日高點約 ${
        snapshot.rangeHigh60 === null
          ? '無資料'
          : (((snapshot.rangeHigh60 - snapshot.close) / snapshot.rangeHigh60) * 100).toFixed(2)
      }%。`,
    ),
    rule(
      'not-overheated-20d',
      '近 20 日未過度急漲',
      snapshot.return20 !== null && snapshot.return20 <= THRESHOLDS.maxShortTermAdvancePct,
      5,
      `近 20 日漲幅 ${display(snapshot.return20)}%。`,
    ),
    rule(
      'above-base-low',
      '價格仍在整理區上緣附近',
      snapshot.rangeLow60 !== null && snapshot.close > snapshot.rangeLow60 * 1.15,
      5,
      `收盤 ${snapshot.close}，60 日低點 ${display(snapshot.rangeLow60)}。`,
    ),
  ]);

  const volume = group('volume', '量能狀態', SCORE_WEIGHTS.volume, [
    rule(
      'volume-dry-up',
      '整理期量縮',
      snapshot.volumeDryUpRatio !== null && snapshot.volumeDryUpRatio <= THRESHOLDS.volumeDryUpRatio,
      8,
      `20/60 日均量比 ${display(snapshot.volumeDryUpRatio)}。`,
    ),
    rule(
      'volume-data-present',
      '成交量資料可用',
      snapshot.avgVolume20 !== null && snapshot.avgVolume60 !== null,
      4,
      `20 日均量 ${display(snapshot.avgVolume20)}，60 日均量 ${display(snapshot.avgVolume60)}。`,
    ),
    rule(
      'few-high-volume-down-days',
      '近期爆量下跌有限',
      snapshot.highVolumeDownDays20 <= 2,
      8,
      `近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次。`,
    ),
  ]);

  const relativeStrength = relativeStrengthGroup(snapshot, indexSnapshot);

  const risks = riskRules(snapshot);
  const riskScore = risks.reduce((sum, item) => sum + item.scoreImpact, 0);
  const riskGroup: RuleGroupResult = {
    id: 'risk',
    label: '風險扣分',
    maxScore: 0,
    score: riskScore,
    rules: risks,
  };

  const relativeScore = indexSnapshot ? relativeStrength.score : 0;
  const rawScore = trend.score + base.score + volume.score + relativeScore + riskGroup.score;
  const maxScore = indexSnapshot ? SCORE_WEIGHTS.maxWithRelativeStrength : SCORE_WEIGHTS.maxWithoutRelativeStrength;
  const displayScore = Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100)));
  const classification = classifyScore(displayScore);
  const riskNotes = risks.filter((item) => item.status === 'warning').map((item) => item.explanation);

  return {
    rawScore: Math.max(0, rawScore),
    displayScore,
    classification,
    conclusion: conclusionFor(classification),
    relativeStrengthAvailable: Boolean(indexSnapshot),
    groups: [trend, base, volume, relativeStrength, riskGroup],
    riskNotes,
    dataNotes: indexSnapshot
      ? ['已納入 TAIEX 資料計算相對強度。']
      : ['未提供大盤資料；相對強度已標記為 unavailable，總分以 85 分技術分數正規化。'],
  };
}

function group(id: string, label: string, maxScore: number, rules: RuleResult[]): RuleGroupResult {
  return {
    id,
    label,
    maxScore,
    score: rules.reduce((sum, item) => sum + item.scoreImpact, 0),
    rules,
  };
}

function rule(id: string, label: string, passed: boolean, points: number, explanation: string): RuleResult {
  return {
    id,
    label,
    status: passed ? 'passed' : 'failed',
    scoreImpact: passed ? points : 0,
    explanation,
  };
}

function unavailableRule(id: string, label: string, explanation: string): RuleResult {
  return { id, label, status: 'unavailable', scoreImpact: 0, explanation };
}

function relativeStrengthGroup(snapshot: IndicatorSnapshot, indexSnapshot?: IndicatorSnapshot): RuleGroupResult {
  if (!indexSnapshot) {
    return group('relative-strength', '相對強度', SCORE_WEIGHTS.relativeStrength, [
      unavailableRule('market-index-missing', '缺少大盤資料', '未提供加權指數資料，相對強度不納入原始分數。'),
    ]);
  }

  return group('relative-strength', '相對強度', SCORE_WEIGHTS.relativeStrength, [
    rule(
      'rs-20d',
      '20 日表現強於大盤',
      snapshot.return20 !== null && indexSnapshot.return20 !== null && snapshot.return20 > indexSnapshot.return20,
      8,
      `個股 20 日報酬 ${display(snapshot.return20)}%，加權指數 20 日報酬 ${display(indexSnapshot.return20)}%。`,
    ),
    rule(
      'rs-60d',
      '60 日表現強於大盤',
      snapshot.return60 !== null && indexSnapshot.return60 !== null && snapshot.return60 > indexSnapshot.return60,
      7,
      `個股 60 日報酬 ${display(snapshot.return60)}%，加權指數 60 日報酬 ${display(indexSnapshot.return60)}%。`,
    ),
  ]);
}

function riskRules(snapshot: IndicatorSnapshot): RuleResult[] {
  return [
    risk(
      'extended-from-ma60',
      '距離 60 日均線過遠',
      snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > THRESHOLDS.maxDistanceFromMa60Pct,
      -10,
      `股價距 60 日均線 ${display(snapshot.distanceFromMa60Pct)}%，可能已偏離整理區。`,
    ),
    risk(
      'short-term-overheat',
      '短期漲幅過大',
      snapshot.return20 !== null && snapshot.return20 > THRESHOLDS.maxShortTermAdvancePct,
      -8,
      `短期漲幅 ${display(snapshot.return20)}%，可能已經發動。`,
    ),
    risk(
      'distribution-days',
      '近期爆量下跌偏多',
      snapshot.highVolumeDownDays20 >= 4,
      -7,
      `近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次。`,
    ),
  ];
}

function risk(id: string, label: string, active: boolean, points: number, explanation: string): RuleResult {
  return {
    id,
    label,
    status: active ? 'warning' : 'passed',
    scoreImpact: active ? points : 0,
    explanation,
  };
}

function conclusionFor(classification: MomentumReport['classification']): string {
  if (classification === 'strong-candidate') return '技術面具備波段強勢候選條件，但仍需人工確認資料品質與風險。';
  if (classification === 'watchlist') return '部分條件轉強，可列入觀察，但尚未達到強勢候選。';
  if (classification === 'insufficient-conditions') return '條件不足，暫時不符合波段強勢候選。';
  return '目前技術結構不符合波段強勢候選。';
}

function display(value: number | null): string {
  return value === null ? '無資料' : String(value);
}
