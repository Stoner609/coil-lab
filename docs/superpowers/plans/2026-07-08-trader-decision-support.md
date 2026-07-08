# Trader Decision Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a trader decision-support layer and single-stock signal-validation backtest to CoilLab.

**Architecture:** Keep the existing React UI thin and put new behavior in domain modules. `decision.ts` converts existing analysis output into setup state, risk/reward, and notes; `backtest.ts` repeatedly runs historical single-date analysis without lookahead and summarizes strong-candidate signal outcomes.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Recharts, Papa Parse.

## Global Constraints

- Do not present outputs as buy or sell recommendations.
- Keep the existing single-stock analysis flow.
- At least 120 rows are still required for full current-state analysis.
- Backtest calculations must not use future data when detecting the signal date.
- Forward metrics should be `null` when future rows are unavailable.
- Unavailable optional data should be displayed explicitly.
- Do not proactively run `git commit`, `git push`, `git reset`, or `git checkout`; only suggest git commands if version control is needed.

---

## File Structure

```text
src/domain/types.ts
src/domain/indicators.ts
src/domain/report.ts
src/domain/decision.ts
src/domain/decision.test.ts
src/domain/backtest.ts
src/domain/backtest.test.ts
src/components/TraderDecisionPanel.tsx
src/components/SignalValidationPanel.tsx
src/App.tsx
src/App.test.tsx
README.md
```

Responsibilities:

- `types.ts`: add shared decision and backtest types.
- `indicators.ts`: expose helper values already needed by decision and backtest code.
- `report.ts`: keep current report behavior; optionally expose `analyzeRowsAtDate` if needed by backtest.
- `decision.ts`: derive setup state, risk/reward, confidence notes, blockers, and unavailable data notes.
- `backtest.ts`: detect historical strong-candidate signals and compute forward metrics.
- `TraderDecisionPanel.tsx`: render trader-facing decision summary.
- `SignalValidationPanel.tsx`: render single-stock signal validation.
- `App.tsx`: compute and render new panels for the active dataset.
- `README.md`: document that the new layer is research support, not trade advice.

## Task 1: Add Decision and Backtest Types

**Files:**
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `SetupState`, `RiskRewardEstimate`, `TraderDecision`, `ForwardReturns`, `SignalBacktestResult`, `SignalBacktestSummary`, `SignalBacktestReport`.
- Consumers: `decision.ts`, `backtest.ts`, `TraderDecisionPanel.tsx`, `SignalValidationPanel.tsx`.

- [ ] **Step 1: Add failing type usage through tests in later tasks**

This task is type scaffolding. It is complete when later tests compile against these exported types.

- [ ] **Step 2: Add these type exports to `src/domain/types.ts`**

```ts
export type SetupState = 'actionable' | 'watch' | 'extended' | 'avoid';

export interface RiskRewardEstimate {
  entryReference: number;
  invalidationLevel: number | null;
  targetReference: number | null;
  riskPct: number | null;
  rewardPct: number | null;
  rewardRiskRatio: number | null;
}

export interface TraderDecision {
  setupState: SetupState;
  headline: string;
  confidenceNotes: string[];
  blockers: string[];
  unavailableData: string[];
  riskReward: RiskRewardEstimate;
}

export interface ForwardReturns {
  day5: number | null;
  day10: number | null;
  day20: number | null;
  day40: number | null;
  day60: number | null;
}

export interface SignalBacktestResult {
  signalDate: string;
  signalClose: number;
  displayScore: number;
  classification: Classification;
  forwardReturns: ForwardReturns;
  maxFavorable20: number | null;
  maxFavorable60: number | null;
  maxAdverse20: number | null;
  maxAdverse60: number | null;
  invalidationTouched20: boolean | null;
}

export interface SignalBacktestSummary {
  signalCount: number;
  averageReturn20: number | null;
  medianReturn20: number | null;
  winRate20: number | null;
  averageMaxAdverse20: number | null;
  bestReturn20: number | null;
  worstReturn20: number | null;
}

export interface SignalBacktestReport {
  signals: SignalBacktestResult[];
  summary: SignalBacktestSummary;
  notes: string[];
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run build`

Expected: PASS, or existing unrelated failures only. There should be no TypeScript errors from the new type exports.

## Task 2: Implement Trader Decision Domain Logic

**Files:**
- Create: `src/domain/decision.ts`
- Create: `src/domain/decision.test.ts`

**Interfaces:**
- Consumes: `MomentumReport`, `IndicatorSnapshot`, `TraderDecision`.
- Produces: `buildTraderDecision(report: MomentumReport, snapshot: IndicatorSnapshot): TraderDecision`.

- [ ] **Step 1: Write failing tests**

Create `src/domain/decision.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTraderDecision } from './decision';
import type { IndicatorSnapshot, MomentumReport } from './types';

function snapshot(overrides: Partial<IndicatorSnapshot> = {}): IndicatorSnapshot {
  return {
    analysisDate: '2026-07-08',
    close: 100,
    ma20: 96,
    ma60: 90,
    ma20Slope: 1,
    ma60Slope: 0.5,
    avgVolume20: 1000,
    avgVolume60: 1200,
    return20: 8,
    return60: 18,
    rangeHigh60: 105,
    rangeLow60: 85,
    rangeWidth60Pct: 23.53,
    rangeWidth20Pct: 10,
    distanceFromMa60Pct: 11.11,
    highVolumeDownDays20: 1,
    volumeDryUpRatio: 0.83,
    ...overrides,
  };
}

function report(overrides: Partial<MomentumReport> = {}): MomentumReport {
  return {
    sampleName: 'sample',
    analysisDate: '2026-07-08',
    rawScore: 80,
    displayScore: 82,
    classification: 'strong-candidate',
    conclusion: '技術面具備波段強勢候選條件，但仍需人工確認資料品質與風險。',
    relativeStrengthAvailable: true,
    groups: [],
    riskNotes: [],
    dataNotes: ['已納入 TWSE 加權指數資料計算相對強度。'],
    rows: [],
    ...overrides,
  };
}

describe('buildTraderDecision', () => {
  it('marks a strong candidate with controlled distance as actionable', () => {
    const decision = buildTraderDecision(report(), snapshot());
    expect(decision.setupState).toBe('actionable');
    expect(decision.headline).toContain('可行動');
    expect(decision.riskReward.invalidationLevel).toBe(90);
    expect(decision.riskReward.riskPct).toBe(10);
    expect(decision.riskReward.targetReference).toBe(105);
  });

  it('marks an otherwise strong candidate as extended when distance from ma60 is high', () => {
    const decision = buildTraderDecision(report(), snapshot({ close: 125, distanceFromMa60Pct: 38.89 }));
    expect(decision.setupState).toBe('extended');
    expect(decision.blockers.some((note) => note.includes('距離 60 日均線'))).toBe(true);
  });

  it('marks weak classifications as avoid', () => {
    const decision = buildTraderDecision(
      report({ displayScore: 35, classification: 'not-qualified' }),
      snapshot({ close: 80, ma20: 90, ma60: 95 }),
    );
    expect(decision.setupState).toBe('avoid');
  });

  it('reports unavailable optional data explicitly', () => {
    const decision = buildTraderDecision(report({ relativeStrengthAvailable: false }), snapshot());
    expect(decision.unavailableData).toContain('相對強度資料不可用');
    expect(decision.unavailableData).toContain('基本面資料尚未接入');
    expect(decision.unavailableData).toContain('籌碼資料尚未接入');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/domain/decision.test.ts`

Expected: FAIL because `src/domain/decision.ts` does not exist.

- [ ] **Step 3: Implement `src/domain/decision.ts`**

```ts
import type { IndicatorSnapshot, MomentumReport, RiskRewardEstimate, SetupState, TraderDecision } from './types';

const MAX_ACTIONABLE_DISTANCE_FROM_MA60 = 18;
const MAX_WATCH_DISTANCE_FROM_MA60 = 28;
const MIN_REWARD_RISK_RATIO = 1.5;

export function buildTraderDecision(report: MomentumReport, snapshot: IndicatorSnapshot): TraderDecision {
  const riskReward = estimateRiskReward(snapshot);
  const blockers = buildBlockers(report, snapshot, riskReward);
  const unavailableData = buildUnavailableData(report);
  const setupState = classifySetup(report, snapshot, riskReward, blockers);

  return {
    setupState,
    headline: headlineFor(setupState),
    confidenceNotes: buildConfidenceNotes(report, snapshot, riskReward),
    blockers,
    unavailableData,
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
  if (snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > MAX_WATCH_DISTANCE_FROM_MA60) return 'extended';
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
  const candidates = [snapshot.ma60, snapshot.rangeLow60].filter((value): value is number => value !== null);
  if (candidates.length === 0) return null;
  return Math.max(...candidates.filter((value) => value < snapshot.close));
}

function buildBlockers(
  report: MomentumReport,
  snapshot: IndicatorSnapshot,
  riskReward: RiskRewardEstimate,
): string[] {
  const blockers: string[] = [];
  if (snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > MAX_ACTIONABLE_DISTANCE_FROM_MA60) {
    blockers.push(`距離 60 日均線 ${snapshot.distanceFromMa60Pct}% ，進場位置可能偏追價。`);
  }
  if (snapshot.highVolumeDownDays20 >= 4) {
    blockers.push(`近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次，籌碼或賣壓需要人工確認。`);
  }
  if (riskReward.riskPct !== null && riskReward.riskPct > 12) {
    blockers.push(`技術停損距離約 ${riskReward.riskPct}% ，風險距離偏大。`);
  }
  if (report.riskNotes.length > 0) blockers.push(...report.riskNotes);
  return Array.from(new Set(blockers));
}

function buildConfidenceNotes(report: MomentumReport, snapshot: IndicatorSnapshot, riskReward: RiskRewardEstimate): string[] {
  const notes: string[] = [`目前強勢分數 ${report.displayScore}，分類為 ${report.classification}。`];
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
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/domain/decision.test.ts`

Expected: PASS.

## Task 3: Implement Single-Stock Signal Backtest

**Files:**
- Create: `src/domain/backtest.ts`
- Create: `src/domain/backtest.test.ts`

**Interfaces:**
- Consumes: `OhlcvRow[]`, optional `OhlcvRow[]` index rows.
- Produces: `runSignalBacktest(rows: OhlcvRow[], indexRows?: OhlcvRow[], options?: { threshold?: number; cooldownDays?: number }): SignalBacktestReport`.

- [ ] **Step 1: Write failing tests**

Create `src/domain/backtest.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { runSignalBacktest } from './backtest';
import type { OhlcvRow } from './types';

function row(index: number, close: number): OhlcvRow {
  return {
    date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}-${index}`,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: index > 110 ? 900 : 1200,
  };
}

function momentumRows(): OhlcvRow[] {
  const rows: OhlcvRow[] = [];
  for (let index = 0; index < 180; index += 1) {
    const base = index < 90 ? 80 + index * 0.08 : 87 + (index - 90) * 0.45;
    rows.push(row(index, Number(base.toFixed(2))));
  }
  return rows;
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
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/domain/backtest.test.ts`

Expected: FAIL because `src/domain/backtest.ts` does not exist.

- [ ] **Step 3: Implement `src/domain/backtest.ts`**

```ts
import { calculateIndicators } from './indicators';
import { analyzeRows } from './report';
import { estimateRiskReward } from './decision';
import type {
  ForwardReturns,
  OhlcvRow,
  SignalBacktestReport,
  SignalBacktestResult,
  SignalBacktestSummary,
} from './types';

interface BacktestOptions {
  threshold?: number;
  cooldownDays?: number;
}

const MIN_LOOKBACK_ROWS = 120;
const DEFAULT_THRESHOLD = 80;
const DEFAULT_COOLDOWN_DAYS = 20;

export function runSignalBacktest(
  rows: OhlcvRow[],
  indexRows?: OhlcvRow[],
  options: BacktestOptions = {},
): SignalBacktestReport {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const cooldownDays = options.cooldownDays ?? DEFAULT_COOLDOWN_DAYS;
  const signals: SignalBacktestResult[] = [];
  let previousScore: number | null = null;
  let lastSignalIndex = -Infinity;

  for (let index = MIN_LOOKBACK_ROWS - 1; index < rows.length; index += 1) {
    const windowRows = rows.slice(0, index + 1);
    const windowIndexRows = alignIndexRows(indexRows, windowRows.at(-1)?.date);
    const report = analyzeRows('backtest', windowRows, windowIndexRows);
    const crossedThreshold = report.displayScore >= threshold && (previousScore === null || previousScore < threshold);
    const cooldownPassed = index - lastSignalIndex >= cooldownDays;

    if (crossedThreshold && cooldownPassed) {
      const snapshot = calculateIndicators(windowRows);
      const riskReward = estimateRiskReward(snapshot);
      signals.push(buildSignal(rows, index, report.displayScore, report.classification, riskReward.invalidationLevel));
      lastSignalIndex = index;
    }

    previousScore = report.displayScore;
  }

  return {
    signals,
    summary: summarize(signals),
    notes: buildNotes(rows, signals),
  };
}

function buildSignal(
  rows: OhlcvRow[],
  signalIndex: number,
  displayScore: number,
  classification: SignalBacktestResult['classification'],
  invalidationLevel: number | null,
): SignalBacktestResult {
  const signal = rows[signalIndex];
  return {
    signalDate: signal.date,
    signalClose: signal.close,
    displayScore,
    classification,
    forwardReturns: {
      day5: forwardReturn(rows, signalIndex, 5),
      day10: forwardReturn(rows, signalIndex, 10),
      day20: forwardReturn(rows, signalIndex, 20),
      day40: forwardReturn(rows, signalIndex, 40),
      day60: forwardReturn(rows, signalIndex, 60),
    },
    maxFavorable20: maxFavorable(rows, signalIndex, 20),
    maxFavorable60: maxFavorable(rows, signalIndex, 60),
    maxAdverse20: maxAdverse(rows, signalIndex, 20),
    maxAdverse60: maxAdverse(rows, signalIndex, 60),
    invalidationTouched20: invalidationTouched(rows, signalIndex, 20, invalidationLevel),
  };
}

function forwardReturn(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const future = rows[signalIndex + days];
  if (!future) return null;
  return round(((future.close - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function maxFavorable(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const futureRows = rows.slice(signalIndex + 1, signalIndex + days + 1);
  if (futureRows.length === 0) return null;
  const maxHigh = Math.max(...futureRows.map((row) => row.high));
  return round(((maxHigh - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function maxAdverse(rows: OhlcvRow[], signalIndex: number, days: number): number | null {
  const futureRows = rows.slice(signalIndex + 1, signalIndex + days + 1);
  if (futureRows.length === 0) return null;
  const minLow = Math.min(...futureRows.map((row) => row.low));
  return round(((minLow - rows[signalIndex].close) / rows[signalIndex].close) * 100);
}

function invalidationTouched(
  rows: OhlcvRow[],
  signalIndex: number,
  days: number,
  invalidationLevel: number | null,
): boolean | null {
  if (invalidationLevel === null) return null;
  return rows.slice(signalIndex + 1, signalIndex + days + 1).some((row) => row.low <= invalidationLevel);
}

function summarize(signals: SignalBacktestResult[]): SignalBacktestSummary {
  const returns20 = signals
    .map((signal) => signal.forwardReturns.day20)
    .filter((value): value is number => value !== null);
  const adverse20 = signals
    .map((signal) => signal.maxAdverse20)
    .filter((value): value is number => value !== null);

  return {
    signalCount: signals.length,
    averageReturn20: average(returns20),
    medianReturn20: median(returns20),
    winRate20: returns20.length === 0 ? null : round((returns20.filter((value) => value > 0).length / returns20.length) * 100),
    averageMaxAdverse20: average(adverse20),
    bestReturn20: returns20.length === 0 ? null : Math.max(...returns20),
    worstReturn20: returns20.length === 0 ? null : Math.min(...returns20),
  };
}

function alignIndexRows(indexRows: OhlcvRow[] | undefined, maxDate: string | undefined): OhlcvRow[] | undefined {
  if (!indexRows || !maxDate) return undefined;
  return indexRows.filter((row) => row.date <= maxDate);
}

function buildNotes(rows: OhlcvRow[], signals: SignalBacktestResult[]): string[] {
  const notes = ['此回測驗證分數訊號，不模擬實際下單、滑價、手續費或部位控管。'];
  if (rows.length < MIN_LOOKBACK_ROWS) notes.push('資料少於 120 筆，無法產生完整歷史訊號。');
  if (signals.length === 0) notes.push('此資料區間沒有符合門檻的強勢訊號。');
  return notes;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/domain/backtest.test.ts`

Expected: PASS. If synthetic data does not cross the score threshold, adjust only the test fixture values or threshold option, not production scoring.

## Task 4: Render Trader Decision Panel

**Files:**
- Create: `src/components/TraderDecisionPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `TraderDecision`.
- Produces: UI section with setup state, headline, risk/reward, blockers, and unavailable data.

- [ ] **Step 1: Add component test expectation**

Modify `src/App.test.tsx` to expect the panel heading:

```ts
expect(screen.getByRole('heading', { name: '交易決策輔助' })).toBeInTheDocument();
```

- [ ] **Step 2: Create `src/components/TraderDecisionPanel.tsx`**

```tsx
import type { TraderDecision } from '../domain/types';

interface TraderDecisionPanelProps {
  decision: TraderDecision;
}

export function TraderDecisionPanel({ decision }: TraderDecisionPanelProps) {
  return (
    <section className="panel trader-decision-panel">
      <h2>交易決策輔助</h2>
      <div className={`setup-state setup-state-${decision.setupState}`}>
        <strong>{labelFor(decision.setupState)}</strong>
        <span>{decision.headline}</span>
      </div>

      <div className="metric-grid">
        <Metric label="進場參考" value={formatPrice(decision.riskReward.entryReference)} />
        <Metric label="失效位置" value={formatNullablePrice(decision.riskReward.invalidationLevel)} />
        <Metric label="目標參考" value={formatNullablePrice(decision.riskReward.targetReference)} />
        <Metric label="報酬風險比" value={formatNullable(decision.riskReward.rewardRiskRatio)} />
      </div>

      <NoteList title="信心依據" notes={decision.confidenceNotes} />
      <NoteList title="阻礙條件" notes={decision.blockers} emptyText="目前沒有主要阻礙條件。" />
      <NoteList title="尚缺資料" notes={decision.unavailableData} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NoteList({ title, notes, emptyText }: { title: string; notes: string[]; emptyText?: string }) {
  return (
    <div className="note-block">
      <h3>{title}</h3>
      {notes.length > 0 ? (
        <ul>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyText ?? '無資料。'}</p>
      )}
    </div>
  );
}

function labelFor(state: TraderDecision['setupState']): string {
  if (state === 'actionable') return '可行動';
  if (state === 'watch') return '觀察';
  if (state === 'extended') return '偏延伸';
  return '避開';
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function formatNullablePrice(value: number | null): string {
  return value === null ? '無資料' : value.toFixed(2);
}

function formatNullable(value: number | null): string {
  return value === null ? '無資料' : String(value);
}
```

- [ ] **Step 3: Wire panel into `src/App.tsx`**

Import `calculateIndicators`, `buildTraderDecision`, and `TraderDecisionPanel`.

Compute:

```ts
const snapshot = useMemo(() => calculateIndicators(activeRows), [activeRows]);
const traderDecision = useMemo(() => buildTraderDecision(report, snapshot), [report, snapshot]);
```

Render after `ResultSummary`:

```tsx
<TraderDecisionPanel decision={traderDecision} />
```

- [ ] **Step 4: Run app tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

## Task 5: Render Signal Validation Panel

**Files:**
- Create: `src/components/SignalValidationPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `SignalBacktestReport`.
- Produces: UI section with summary metrics, notes, and a compact signal table.

- [ ] **Step 1: Add component test expectation**

Modify `src/App.test.tsx` to expect the panel heading:

```ts
expect(screen.getByRole('heading', { name: '訊號驗證回測' })).toBeInTheDocument();
```

- [ ] **Step 2: Create `src/components/SignalValidationPanel.tsx`**

```tsx
import type { SignalBacktestReport } from '../domain/types';

interface SignalValidationPanelProps {
  backtest: SignalBacktestReport;
}

export function SignalValidationPanel({ backtest }: SignalValidationPanelProps) {
  return (
    <section className="panel signal-validation-panel">
      <h2>訊號驗證回測</h2>
      <div className="metric-grid">
        <Metric label="訊號數" value={String(backtest.summary.signalCount)} />
        <Metric label="20 日平均報酬" value={formatPct(backtest.summary.averageReturn20)} />
        <Metric label="20 日勝率" value={formatPct(backtest.summary.winRate20)} />
        <Metric label="20 日平均逆勢" value={formatPct(backtest.summary.averageMaxAdverse20)} />
      </div>

      {backtest.notes.length > 0 && (
        <ul className="compact-notes">
          {backtest.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>分數</th>
              <th>5 日</th>
              <th>20 日</th>
              <th>60 日</th>
              <th>20 日最大逆勢</th>
            </tr>
          </thead>
          <tbody>
            {backtest.signals.slice(-8).map((signal) => (
              <tr key={signal.signalDate}>
                <td>{signal.signalDate}</td>
                <td>{signal.displayScore}</td>
                <td>{formatPct(signal.forwardReturns.day5)}</td>
                <td>{formatPct(signal.forwardReturns.day20)}</td>
                <td>{formatPct(signal.forwardReturns.day60)}</td>
                <td>{formatPct(signal.maxAdverse20)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatPct(value: number | null): string {
  return value === null ? '無資料' : `${value.toFixed(2)}%`;
}
```

- [ ] **Step 3: Wire panel into `src/App.tsx`**

Import `runSignalBacktest` and `SignalValidationPanel`.

Compute:

```ts
const backtest = useMemo(
  () => runSignalBacktest(activeRows, customIndexRows ?? undefined),
  [activeRows, customIndexRows],
);
```

Render near the bottom of the content grid:

```tsx
<SignalValidationPanel backtest={backtest} />
```

- [ ] **Step 4: Run app tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

## Task 6: Polish Styles and Documentation

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing class names plus `trader-decision-panel`, `signal-validation-panel`, `setup-state`, `metric-grid`, `metric-card`, `note-block`, `compact-notes`, `table-wrap`.
- Produces: readable panels consistent with the existing workbench.

- [ ] **Step 1: Add focused CSS**

Add styles using the existing visual language:

```css
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  border: 1px solid #d9e0e4;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.metric-card span {
  display: block;
  color: #5d6b73;
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
}

.setup-state {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d9e0e4;
}

.setup-state-actionable {
  background: #edf8f1;
}

.setup-state-watch {
  background: #fff8e5;
}

.setup-state-extended,
.setup-state-avoid {
  background: #fff0f0;
}

.note-block h3 {
  margin: 16px 0 8px;
  font-size: 15px;
}

.compact-notes {
  margin: 12px 0;
  padding-left: 20px;
}

.table-wrap {
  overflow-x: auto;
}

.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.table-wrap th,
.table-wrap td {
  border-bottom: 1px solid #d9e0e4;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}
```

- [ ] **Step 2: Update README**

Add bullets under current features:

```md
- 顯示交易決策輔助面板，區分可行動、觀察、偏延伸與避開。
- 顯示技術失效位置、目標參考與估計報酬風險比。
- 顯示單檔股票訊號驗證回測，檢查高分訊號後 5/10/20/40/60 日表現。
```

Add limitation:

```md
- 訊號驗證回測只驗證分數訊號，不模擬真實下單、滑價、手續費或部位控管。
```

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

## Self-Review Checklist

- The plan adds decision support without producing buy or sell advice.
- The plan keeps the existing single-stock flow.
- The backtest validates score signals and does not model order execution.
- Signal detection uses only rows up to the signal date.
- Forward metrics are nullable when future data is unavailable.
- Optional missing data is displayed explicitly.
- No implementation step asks the agent to run commit, push, reset, or checkout.

