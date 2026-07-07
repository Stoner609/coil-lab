export const SCORE_WEIGHTS = {
  trend: 30,
  base: 25,
  volume: 20,
  relativeStrength: 15,
  maxWithoutRelativeStrength: 85,
  maxWithRelativeStrength: 100,
  maxRiskDeduction: 20,
} as const;

export const THRESHOLDS = {
  minimumRows: 120,
  nearBaseHighPct: 8,
  maxShortTermAdvancePct: 35,
  maxDistanceFromMa60Pct: 30,
  contractionRatio: 0.82,
  highVolumeRatio: 1.5,
  volumeDryUpRatio: 0.8,
} as const;

export function classifyScore(score: number) {
  if (score >= 80) return 'strong-candidate';
  if (score >= 60) return 'watchlist';
  if (score >= 40) return 'insufficient-conditions';
  return 'not-qualified';
}
