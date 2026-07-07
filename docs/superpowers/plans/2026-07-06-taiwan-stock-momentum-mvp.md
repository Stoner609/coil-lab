# Taiwan Stock Momentum MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite/TypeScript web workbench that evaluates one Taiwan stock OHLCV dataset for swing-trade momentum conditions and explains the score.

**Architecture:** The project is a small React app with a standalone TypeScript rule engine. Data parsing, validation, indicators, scoring, reporting, samples, and UI are separated so the rule engine can later be reused by scripts, CLI, API routes, or a full-market scanner.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Recharts, Papa Parse.

---

## Project Directory

Create and implement the project in:

```text
/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
```

This folder has already been created. The current planning workspace remains:

```text
/Users/hsuhaoche/Documents/Codex/2026-07-06/superpowers-plugin-superpowers-openai-curated-remote-2
```

The user preference says not to proactively run `git commit`, `git push`, `git reset`, or `git checkout`. Do not include commit steps in execution. If version control is needed, only suggest read-only checks or ask the user to run git commands themselves.

## File Structure

```text
package.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
src/main.tsx
src/App.tsx
src/styles.css
src/domain/types.ts
src/domain/config.ts
src/domain/validation.ts
src/domain/indicators.ts
src/domain/scoring.ts
src/domain/report.ts
src/domain/sampleData.ts
src/domain/csv.ts
src/components/InputPanel.tsx
src/components/ResultSummary.tsx
src/components/RuleDetails.tsx
src/components/PriceVolumeChart.tsx
src/components/ValidationPanel.tsx
src/test/fixtures.ts
src/domain/validation.test.ts
src/domain/indicators.test.ts
src/domain/scoring.test.ts
src/domain/report.test.ts
src/App.test.tsx
```

Responsibilities:

- `types.ts`: shared domain types and discriminated unions.
- `config.ts`: tunable weights and thresholds.
- `validation.ts`: OHLCV schema and sufficiency checks.
- `indicators.ts`: moving averages, returns, ranges, volume metrics.
- `scoring.ts`: rule groups, score impacts, normalization.
- `report.ts`: orchestration from rows to final report.
- `sampleData.ts`: built-in positive and negative synthetic samples.
- `csv.ts`: browser CSV parsing and normalization.
- `components/*`: UI only; no scoring logic.
- `fixtures.ts`: deterministic test datasets.

## Task 1: Scaffold Project

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/package.json`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/index.html`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/vite.config.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/tsconfig.json`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/tsconfig.node.json`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/main.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/App.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/styles.css`

- [ ] **Step 1: Create the Vite project files**

Create `package.json`:

```json
{
  "name": "taiwan-stock-momentum-mvp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "papaparse": "^5.5.2",
    "recharts": "^2.15.0",
    "vite": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/papaparse": "^5.3.15",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>台股波段強勢股判斷工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <h1>台股波段強勢股判斷工具</h1>
          <p>研究用途：評估單檔股票是否具備主升段前 2-6 週的技術面雛形。</p>
        </div>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #172026;
  background: #f5f7f8;
  font-family:
    Inter, "Noto Sans TC", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
}

.top-bar {
  padding: 24px 32px 16px;
  border-bottom: 1px solid #d9e0e4;
  background: #ffffff;
}

.top-bar h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.top-bar p {
  margin: 0;
  color: #53636d;
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm install
```

Expected: `node_modules` and `package-lock.json` are created without errors.

- [ ] **Step 3: Build to verify scaffold**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm run build
```

Expected: TypeScript and Vite build complete successfully.

## Task 2: Define Domain Types and Config

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/types.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/config.ts`

- [ ] **Step 1: Create shared types**

Create `src/domain/types.ts`:

```ts
export type RuleStatus = 'passed' | 'failed' | 'unavailable';

export type Classification =
  | 'strong-candidate'
  | 'watchlist'
  | 'insufficient-conditions'
  | 'not-qualified';

export interface OhlcvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: OhlcvRow[];
}

export interface IndicatorSnapshot {
  analysisDate: string;
  close: number;
  ma20: number | null;
  ma60: number | null;
  ma20Slope: number | null;
  ma60Slope: number | null;
  avgVolume20: number | null;
  avgVolume60: number | null;
  return20: number | null;
  return60: number | null;
  rangeHigh60: number | null;
  rangeLow60: number | null;
  rangeWidth60Pct: number | null;
  rangeWidth20Pct: number | null;
  distanceFromMa60Pct: number | null;
  highVolumeDownDays20: number;
  volumeDryUpRatio: number | null;
}

export interface RuleResult {
  id: string;
  label: string;
  status: RuleStatus;
  scoreImpact: number;
  explanation: string;
}

export interface RuleGroupResult {
  id: string;
  label: string;
  maxScore: number;
  score: number;
  rules: RuleResult[];
}

export interface MomentumReport {
  sampleName: string;
  analysisDate: string;
  rawScore: number;
  displayScore: number;
  classification: Classification;
  conclusion: string;
  relativeStrengthAvailable: boolean;
  groups: RuleGroupResult[];
  riskNotes: string[];
  dataNotes: string[];
  rows: OhlcvRow[];
}
```

- [ ] **Step 2: Create scoring config**

Create `src/domain/config.ts`:

```ts
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
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm run build
```

Expected: build succeeds.

## Task 3: Implement Data Validation With Tests

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/test/setup.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/test/fixtures.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/validation.test.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/validation.ts`

- [ ] **Step 1: Add test setup and fixtures**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Create `src/test/fixtures.ts`:

```ts
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
```

- [ ] **Step 2: Write failing validation tests**

Create `src/domain/validation.test.ts`:

```ts
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
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/validation.test.ts
```

Expected: fails because `src/domain/validation.ts` does not exist.

- [ ] **Step 4: Implement validation**

Create `src/domain/validation.ts`:

```ts
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
```

- [ ] **Step 5: Run validation tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/validation.test.ts
```

Expected: all validation tests pass.

## Task 4: Implement Indicators With Tests

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/indicators.test.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/indicators.ts`

- [ ] **Step 1: Write failing indicator tests**

Create `src/domain/indicators.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { makeRows } from '../test/fixtures';
import { calculateIndicators, movingAverage } from './indicators';

describe('indicators', () => {
  it('calculates a moving average for a fixed window', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('returns a snapshot for the latest row', () => {
    const snapshot = calculateIndicators(makeRows(140, { trend: 'up' }));

    expect(snapshot.analysisDate).toBe('2025-05-20');
    expect(snapshot.ma20).not.toBeNull();
    expect(snapshot.ma60).not.toBeNull();
    expect(snapshot.return20).toBeGreaterThan(0);
    expect(snapshot.rangeHigh60).toBeGreaterThan(snapshot.rangeLow60 ?? 0);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/indicators.test.ts
```

Expected: fails because `src/domain/indicators.ts` does not exist.

- [ ] **Step 3: Implement indicators**

Create `src/domain/indicators.ts`:

```ts
import { THRESHOLDS } from './config';
import type { IndicatorSnapshot, OhlcvRow } from './types';

export function movingAverage(values: number[], windowSize: number): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < windowSize) return null;
    const window = values.slice(index + 1 - windowSize, index + 1);
    return round(window.reduce((sum, value) => sum + value, 0) / windowSize);
  });
}

export function calculateIndicators(rows: OhlcvRow[]): IndicatorSnapshot {
  const closes = rows.map((row) => row.close);
  const volumes = rows.map((row) => row.volume);
  const ma20Series = movingAverage(closes, 20);
  const ma60Series = movingAverage(closes, 60);
  const avgVolume20Series = movingAverage(volumes, 20);
  const avgVolume60Series = movingAverage(volumes, 60);
  const lastIndex = rows.length - 1;
  const latest = rows[lastIndex];
  const last60 = rows.slice(Math.max(0, rows.length - 60));
  const last20 = rows.slice(Math.max(0, rows.length - 20));
  const rangeHigh60 = Math.max(...last60.map((row) => row.high));
  const rangeLow60 = Math.min(...last60.map((row) => row.low));
  const rangeHigh20 = Math.max(...last20.map((row) => row.high));
  const rangeLow20 = Math.min(...last20.map((row) => row.low));
  const avgVolume20 = avgVolume20Series[lastIndex];

  return {
    analysisDate: latest.date,
    close: latest.close,
    ma20: ma20Series[lastIndex],
    ma60: ma60Series[lastIndex],
    ma20Slope: slope(ma20Series, lastIndex, 5),
    ma60Slope: slope(ma60Series, lastIndex, 10),
    avgVolume20,
    avgVolume60: avgVolume60Series[lastIndex],
    return20: pctChange(closes[lastIndex - 20], latest.close),
    return60: pctChange(closes[lastIndex - 60], latest.close),
    rangeHigh60,
    rangeLow60,
    rangeWidth60Pct: pctRange(rangeHigh60, rangeLow60),
    rangeWidth20Pct: pctRange(rangeHigh20, rangeLow20),
    distanceFromMa60Pct: ma60Series[lastIndex] === null ? null : pctChange(ma60Series[lastIndex], latest.close),
    highVolumeDownDays20: countHighVolumeDownDays(last20, avgVolume20),
    volumeDryUpRatio:
      avgVolume20Series[lastIndex] === null || avgVolume60Series[lastIndex] === null
        ? null
        : round(avgVolume20Series[lastIndex] / avgVolume60Series[lastIndex]),
  };
}

function slope(series: Array<number | null>, index: number, lookback: number): number | null {
  const current = series[index];
  const previous = series[index - lookback];
  if (current === null || previous === null || previous === undefined) return null;
  return round(current - previous);
}

function pctChange(start: number | undefined, end: number): number | null {
  if (start === undefined || start === 0) return null;
  return round(((end - start) / start) * 100);
}

function pctRange(high: number, low: number): number {
  return round(((high - low) / low) * 100);
}

function countHighVolumeDownDays(rows: OhlcvRow[], avgVolume20: number | null): number {
  if (avgVolume20 === null) return 0;
  return rows.filter(
    (row) => row.close < row.open && row.volume >= avgVolume20 * THRESHOLDS.highVolumeRatio,
  ).length;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
```

- [ ] **Step 4: Run indicator tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/indicators.test.ts
```

Expected: all indicator tests pass.

## Task 5: Implement Scoring With Tests

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/scoring.test.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/scoring.ts`

- [ ] **Step 1: Write failing scoring tests**

Create `src/domain/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { IndicatorSnapshot } from './types';
import { scoreTechnicals } from './scoring';

const strongSnapshot: IndicatorSnapshot = {
  analysisDate: '2025-06-01',
  close: 100,
  ma20: 94,
  ma60: 86,
  ma20Slope: 2.5,
  ma60Slope: 0.8,
  avgVolume20: 900,
  avgVolume60: 1200,
  return20: 12,
  return60: 24,
  rangeHigh60: 104,
  rangeLow60: 82,
  rangeWidth60Pct: 26.83,
  rangeWidth20Pct: 15,
  distanceFromMa60Pct: 16.28,
  highVolumeDownDays20: 1,
  volumeDryUpRatio: 0.75,
};

describe('scoreTechnicals', () => {
  it('scores a healthy pre-launch structure as a strong candidate', () => {
    const result = scoreTechnicals(strongSnapshot);

    expect(result.displayScore).toBeGreaterThanOrEqual(80);
    expect(result.groups).toHaveLength(5);
    expect(result.relativeStrengthAvailable).toBe(false);
  });

  it('deducts risk when the stock is extended', () => {
    const result = scoreTechnicals({
      ...strongSnapshot,
      return20: 48,
      distanceFromMa60Pct: 42,
    });

    expect(result.displayScore).toBeLessThan(80);
    expect(result.riskNotes.join(' ')).toContain('短期漲幅');
  });
});
```

- [ ] **Step 2: Run failing scoring tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/scoring.test.ts
```

Expected: fails because `src/domain/scoring.ts` does not exist.

- [ ] **Step 3: Implement scoring**

Create `src/domain/scoring.ts`:

```ts
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

export function scoreTechnicals(snapshot: IndicatorSnapshot): ScoreResult {
  const trend = group('trend', '趨勢結構', SCORE_WEIGHTS.trend, [
    rule('close-above-ma20', '收盤站上 20 日均線', snapshot.ma20 !== null && snapshot.close > snapshot.ma20, 8, `收盤 ${snapshot.close}，20 日均線 ${display(snapshot.ma20)}。`),
    rule('close-above-ma60', '收盤站上 60 日均線', snapshot.ma60 !== null && snapshot.close > snapshot.ma60, 8, `收盤 ${snapshot.close}，60 日均線 ${display(snapshot.ma60)}。`),
    rule('ma20-rising', '20 日均線翻揚', snapshot.ma20Slope !== null && snapshot.ma20Slope > 0, 7, `20 日均線斜率 ${display(snapshot.ma20Slope)}。`),
    rule('ma60-flat-up', '60 日均線走平或向上', snapshot.ma60Slope !== null && snapshot.ma60Slope >= 0, 7, `60 日均線斜率 ${display(snapshot.ma60Slope)}。`),
  ]);

  const base = group('base', '整理型態', SCORE_WEIGHTS.base, [
    rule('range-contraction', '20 日區間相對 60 日區間收斂', snapshot.rangeWidth20Pct !== null && snapshot.rangeWidth60Pct !== null && snapshot.rangeWidth20Pct <= snapshot.rangeWidth60Pct * THRESHOLDS.contractionRatio, 8, `20 日區間 ${display(snapshot.rangeWidth20Pct)}%，60 日區間 ${display(snapshot.rangeWidth60Pct)}%。`),
    rule('near-base-high', '接近 60 日平台高點', snapshot.rangeHigh60 !== null && ((snapshot.rangeHigh60 - snapshot.close) / snapshot.rangeHigh60) * 100 <= THRESHOLDS.nearBaseHighPct, 7, `收盤距 60 日高點約 ${snapshot.rangeHigh60 === null ? '無資料' : ((((snapshot.rangeHigh60 - snapshot.close) / snapshot.rangeHigh60) * 100).toFixed(2))}%。`),
    rule('not-overheated-20d', '近 20 日未過度急漲', snapshot.return20 !== null && snapshot.return20 <= THRESHOLDS.maxShortTermAdvancePct, 5, `近 20 日漲幅 ${display(snapshot.return20)}%。`),
    rule('above-base-low', '價格仍在整理區上緣附近', snapshot.rangeLow60 !== null && snapshot.close > snapshot.rangeLow60 * 1.15, 5, `收盤 ${snapshot.close}，60 日低點 ${display(snapshot.rangeLow60)}。`),
  ]);

  const volume = group('volume', '量能狀態', SCORE_WEIGHTS.volume, [
    rule('volume-dry-up', '整理期量縮', snapshot.volumeDryUpRatio !== null && snapshot.volumeDryUpRatio <= THRESHOLDS.volumeDryUpRatio, 8, `20/60 日均量比 ${display(snapshot.volumeDryUpRatio)}。`),
    rule('volume-data-present', '成交量資料可用', snapshot.avgVolume20 !== null && snapshot.avgVolume60 !== null, 4, `20 日均量 ${display(snapshot.avgVolume20)}，60 日均量 ${display(snapshot.avgVolume60)}。`),
    rule('few-high-volume-down-days', '近期爆量下跌有限', snapshot.highVolumeDownDays20 <= 2, 8, `近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次。`),
  ]);

  const relativeStrength = group('relative-strength', '相對強度', SCORE_WEIGHTS.relativeStrength, [
    unavailableRule('market-index-missing', '缺少大盤資料', '未提供加權指數資料，相對強度不納入原始分數。'),
  ]);

  const risks = riskRules(snapshot);
  const riskScore = risks.reduce((sum, item) => sum + item.scoreImpact, 0);
  const riskGroup: RuleGroupResult = {
    id: 'risk',
    label: '風險扣分',
    maxScore: 0,
    score: riskScore,
    rules: risks,
  };

  const rawWithoutRelative = trend.score + base.score + volume.score + riskGroup.score;
  const displayScore = Math.max(0, Math.min(100, Math.round((rawWithoutRelative / SCORE_WEIGHTS.maxWithoutRelativeStrength) * 100)));
  const classification = classifyScore(displayScore);
  const riskNotes = risks.filter((item) => item.status === 'passed').map((item) => item.explanation);

  return {
    rawScore: Math.max(0, rawWithoutRelative),
    displayScore,
    classification,
    conclusion: conclusionFor(classification),
    relativeStrengthAvailable: false,
    groups: [trend, base, volume, relativeStrength, riskGroup],
    riskNotes,
    dataNotes: ['未提供大盤資料；相對強度已標記為 unavailable，總分以 85 分技術分數正規化。'],
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

function riskRules(snapshot: IndicatorSnapshot): RuleResult[] {
  return [
    risk('extended-from-ma60', '距離 60 日均線過遠', snapshot.distanceFromMa60Pct !== null && snapshot.distanceFromMa60Pct > THRESHOLDS.maxDistanceFromMa60Pct, -10, `股價距 60 日均線 ${display(snapshot.distanceFromMa60Pct)}%，可能已偏離整理區。`),
    risk('short-term-overheat', '短期漲幅過大', snapshot.return20 !== null && snapshot.return20 > THRESHOLDS.maxShortTermAdvancePct, -8, `短期漲幅 ${display(snapshot.return20)}%，可能已經發動。`),
    risk('distribution-days', '近期爆量下跌偏多', snapshot.highVolumeDownDays20 >= 4, -7, `近 20 日爆量下跌 ${snapshot.highVolumeDownDays20} 次。`),
  ];
}

function risk(id: string, label: string, active: boolean, points: number, explanation: string): RuleResult {
  return {
    id,
    label,
    status: active ? 'passed' : 'failed',
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
```

- [ ] **Step 4: Run scoring tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/scoring.test.ts
```

Expected: all scoring tests pass.

## Task 6: Implement Report Orchestration and CSV Parsing

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/report.test.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/report.ts`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/csv.ts`

- [ ] **Step 1: Write failing report tests**

Create `src/domain/report.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run failing report tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/report.test.ts
```

Expected: fails because `src/domain/report.ts` does not exist.

- [ ] **Step 3: Implement report and CSV parser**

Create `src/domain/report.ts`:

```ts
import { calculateIndicators } from './indicators';
import { scoreTechnicals } from './scoring';
import type { MomentumReport, OhlcvRow } from './types';
import { validateRows } from './validation';

export function analyzeRows(sampleName: string, inputRows: OhlcvRow[]): MomentumReport {
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
  return {
    sampleName,
    ...scoreTechnicals(snapshot),
    analysisDate: snapshot.analysisDate,
    rows: validation.rows,
  };
}
```

Create `src/domain/csv.ts`:

```ts
import Papa from 'papaparse';
import type { OhlcvRow } from './types';

interface CsvRecord {
  date?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

export function parseCsvText(text: string): Promise<OhlcvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRecord>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message));
          return;
        }

        resolve(
          result.data.map((row) => ({
            date: row.date ?? '',
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
          })),
        );
      },
      error: (error: Error) => reject(error),
    });
  });
}
```

- [ ] **Step 4: Run report tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain/report.test.ts
```

Expected: all report tests pass.

## Task 7: Add Built-In Samples

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/domain/sampleData.ts`
- Modify: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/test/fixtures.ts`

- [ ] **Step 1: Extend fixtures with deterministic sample shapes**

Modify `src/test/fixtures.ts` to add:

```ts
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
```

- [ ] **Step 2: Create built-in samples**

Create `src/domain/sampleData.ts`:

```ts
import { makeBaseThenStrengthRows, makeWeakRows } from '../test/fixtures';
import type { OhlcvRow } from './types';

export interface BuiltInSample {
  id: string;
  label: string;
  kind: 'positive' | 'negative';
  rows: OhlcvRow[];
}

export const builtInSamples: BuiltInSample[] = [
  {
    id: 'base-then-strength',
    label: '示範正樣本：整理後轉強',
    kind: 'positive',
    rows: makeBaseThenStrengthRows(),
  },
  {
    id: 'weak-downtrend',
    label: '示範負樣本：弱勢下降',
    kind: 'negative',
    rows: makeWeakRows(),
  },
];
```

- [ ] **Step 3: Run all domain tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test -- src/domain
```

Expected: all domain tests pass.

## Task 8: Build UI Components

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/components/InputPanel.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/components/ResultSummary.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/components/RuleDetails.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/components/PriceVolumeChart.tsx`
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/components/ValidationPanel.tsx`

- [ ] **Step 1: Create InputPanel**

Create `src/components/InputPanel.tsx`:

```tsx
import type { BuiltInSample } from '../domain/sampleData';

interface InputPanelProps {
  samples: BuiltInSample[];
  selectedSampleId: string;
  onSampleChange: (sampleId: string) => void;
  onCsvText: (fileName: string, text: string) => void;
  stockCode: string;
  onStockCodeChange: (value: string) => void;
}

export function InputPanel(props: InputPanelProps) {
  async function handleFile(file: File | undefined) {
    if (!file) return;
    props.onCsvText(file.name, await file.text());
  }

  return (
    <section className="panel input-panel" aria-label="輸入資料">
      <div className="field">
        <label htmlFor="sample">內建樣本</label>
        <select id="sample" value={props.selectedSampleId} onChange={(event) => props.onSampleChange(event.target.value)}>
          {props.samples.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="csv">上傳 CSV</label>
        <input id="csv" type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event.currentTarget.files?.[0])} />
      </div>

      <div className="field">
        <label htmlFor="stock-code">股票代號</label>
        <input id="stock-code" value={props.stockCode} onChange={(event) => props.onStockCodeChange(event.target.value)} placeholder="資料源接好後啟用" />
        <small>目前需上傳 CSV 或使用內建樣本。</small>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create ResultSummary**

Create `src/components/ResultSummary.tsx`:

```tsx
import type { MomentumReport } from '../domain/types';

const labels = {
  'strong-candidate': '強勢候選',
  watchlist: '觀察中',
  'insufficient-conditions': '條件不足',
  'not-qualified': '不符合',
};

export function ResultSummary({ report }: { report: MomentumReport }) {
  return (
    <section className="panel summary-panel" aria-label="結果摘要">
      <div>
        <p className="eyebrow">{report.sampleName}</p>
        <h2>{labels[report.classification]}</h2>
        <p>{report.conclusion}</p>
      </div>
      <div className="score-box">
        <span>{report.displayScore}</span>
        <small>技術分數 / 100</small>
      </div>
      <dl>
        <div>
          <dt>分析日期</dt>
          <dd>{report.analysisDate || '無資料'}</dd>
        </div>
        <div>
          <dt>相對強度</dt>
          <dd>{report.relativeStrengthAvailable ? '已納入' : '未納入'}</dd>
        </div>
      </dl>
    </section>
  );
}
```

- [ ] **Step 3: Create RuleDetails**

Create `src/components/RuleDetails.tsx`:

```tsx
import type { MomentumReport, RuleStatus } from '../domain/types';

const statusText: Record<RuleStatus, string> = {
  passed: '通過',
  failed: '未通過',
  unavailable: '資料不足',
};

export function RuleDetails({ report }: { report: MomentumReport }) {
  return (
    <section className="panel" aria-label="條件明細">
      <h2>條件明細</h2>
      <div className="rule-groups">
        {report.groups.map((group) => (
          <article className="rule-group" key={group.id}>
            <header>
              <h3>{group.label}</h3>
              <span>{group.score} / {group.maxScore}</span>
            </header>
            <ul>
              {group.rules.map((rule) => (
                <li key={rule.id} className={`rule rule-${rule.status}`}>
                  <span>{statusText[rule.status]}</span>
                  <div>
                    <strong>{rule.label}</strong>
                    <p>{rule.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create PriceVolumeChart**

Create `src/components/PriceVolumeChart.tsx`:

```tsx
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { movingAverage } from '../domain/indicators';
import type { OhlcvRow } from '../domain/types';

export function PriceVolumeChart({ rows }: { rows: OhlcvRow[] }) {
  const ma20 = movingAverage(rows.map((row) => row.close), 20);
  const ma60 = movingAverage(rows.map((row) => row.close), 60);
  const chartRows = rows.slice(-120).map((row, index) => {
    const sourceIndex = rows.length - 120 + index;
    return {
      date: row.date.slice(5),
      close: row.close,
      ma20: ma20[sourceIndex],
      ma60: ma60[sourceIndex],
      volume: row.volume,
    };
  });

  return (
    <section className="panel chart-panel" aria-label="價格與量能圖">
      <h2>價格與量能</h2>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartRows}>
          <CartesianGrid stroke="#e1e7ea" />
          <XAxis dataKey="date" minTickGap={28} />
          <YAxis yAxisId="price" orientation="left" domain={['dataMin - 5', 'dataMax + 5']} />
          <YAxis yAxisId="volume" orientation="right" hide />
          <Tooltip />
          <Legend />
          <Bar yAxisId="volume" dataKey="volume" fill="#b8c4ca" name="成交量" />
          <Line yAxisId="price" type="monotone" dataKey="close" stroke="#1f6f8b" dot={false} name="收盤" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#d08a1d" dot={false} name="MA20" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#5468c7" dot={false} name="MA60" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 5: Create ValidationPanel**

Create `src/components/ValidationPanel.tsx`:

```tsx
import { analyzeRows } from '../domain/report';
import type { BuiltInSample } from '../domain/sampleData';

export function ValidationPanel({ samples }: { samples: BuiltInSample[] }) {
  const rows = samples.map((sample) => ({
    sample,
    report: analyzeRows(sample.label, sample.rows),
  }));

  return (
    <section className="panel" aria-label="樣本驗證">
      <h2>樣本驗證</h2>
      <table>
        <thead>
          <tr>
            <th>樣本</th>
            <th>類型</th>
            <th>分數</th>
            <th>分類</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sample, report }) => (
            <tr key={sample.id}>
              <td>{sample.label}</td>
              <td>{sample.kind === 'positive' ? '正樣本' : '負樣本'}</td>
              <td>{report.displayScore}</td>
              <td>{report.classification}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

## Task 9: Wire the App and Styles

**Files:**
- Modify: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/App.tsx`
- Modify: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/styles.css`

- [ ] **Step 1: Replace App with integrated workbench**

Modify `src/App.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { PriceVolumeChart } from './components/PriceVolumeChart';
import { ResultSummary } from './components/ResultSummary';
import { RuleDetails } from './components/RuleDetails';
import { ValidationPanel } from './components/ValidationPanel';
import { parseCsvText } from './domain/csv';
import { analyzeRows } from './domain/report';
import { builtInSamples } from './domain/sampleData';
import type { OhlcvRow } from './domain/types';

export default function App() {
  const [selectedSampleId, setSelectedSampleId] = useState(builtInSamples[0].id);
  const [stockCode, setStockCode] = useState('');
  const [customRows, setCustomRows] = useState<OhlcvRow[] | null>(null);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  const selectedSample = builtInSamples.find((sample) => sample.id === selectedSampleId) ?? builtInSamples[0];
  const activeName = customRows ? customName : selectedSample.label;
  const activeRows = customRows ?? selectedSample.rows;

  const report = useMemo(() => analyzeRows(activeName, activeRows), [activeName, activeRows]);

  async function handleCsvText(fileName: string, text: string) {
    try {
      setError('');
      setCustomRows(await parseCsvText(text));
      setCustomName(fileName);
    } catch (csvError) {
      setError(csvError instanceof Error ? csvError.message : 'CSV 解析失敗。');
    }
  }

  function handleSampleChange(sampleId: string) {
    setSelectedSampleId(sampleId);
    setCustomRows(null);
    setCustomName('');
    setError('');
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <h1>台股波段強勢股判斷工具</h1>
          <p>研究用途：評估單檔股票是否具備主升段前 2-6 週的技術面雛形。</p>
        </div>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <InputPanel
            samples={builtInSamples}
            selectedSampleId={selectedSampleId}
            onSampleChange={handleSampleChange}
            onCsvText={handleCsvText}
            stockCode={stockCode}
            onStockCodeChange={setStockCode}
          />
          {error && <p className="error-message">{error}</p>}
          {report.dataNotes.length > 0 && (
            <section className="panel notes-panel">
              <h2>資料備註</h2>
              <ul>
                {report.dataNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <section className="content-grid">
          <ResultSummary report={report} />
          {report.rows.length > 0 && <PriceVolumeChart rows={report.rows} />}
          <RuleDetails report={report} />
          <ValidationPanel samples={builtInSamples} />
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace CSS with complete workbench styles**

Modify `src/styles.css`:

```css
:root {
  color: #172026;
  background: #f5f7f8;
  font-family:
    Inter, "Noto Sans TC", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
}

.top-bar {
  padding: 24px 32px 16px;
  border-bottom: 1px solid #d9e0e4;
  background: #ffffff;
}

.top-bar h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.top-bar p {
  margin: 0;
  color: #53636d;
}

.workspace {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
}

.sidebar,
.content-grid {
  display: grid;
  gap: 16px;
  align-content: start;
}

.content-grid {
  grid-template-columns: minmax(0, 1fr);
}

.panel {
  background: #ffffff;
  border: 1px solid #d9e0e4;
  border-radius: 8px;
  padding: 16px;
}

.panel h2,
.panel h3 {
  margin: 0;
}

.input-panel {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field label {
  font-weight: 650;
}

.field input,
.field select {
  width: 100%;
  border: 1px solid #bdc8ce;
  border-radius: 6px;
  padding: 9px 10px;
}

.field small,
.eyebrow,
dt {
  color: #64747d;
}

.summary-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px 220px;
  gap: 16px;
  align-items: center;
}

.summary-panel h2 {
  margin: 4px 0;
  font-size: 28px;
}

.summary-panel p {
  margin: 0;
}

.score-box {
  display: grid;
  justify-items: center;
  border: 1px solid #c7d4da;
  border-radius: 8px;
  padding: 14px;
  background: #f7fafb;
}

.score-box span {
  font-size: 38px;
  font-weight: 760;
}

dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

dd {
  margin: 2px 0 0;
  font-weight: 650;
}

.rule-groups {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.rule-group {
  border: 1px solid #e0e6e9;
  border-radius: 8px;
  padding: 12px;
}

.rule-group header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.rule-group ul,
.notes-panel ul {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 8px;
}

.rule {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.rule span {
  border-radius: 999px;
  padding: 3px 8px;
  text-align: center;
  font-size: 12px;
}

.rule-passed span {
  background: #d9f0e3;
  color: #1f6b43;
}

.rule-failed span {
  background: #f2e2de;
  color: #92402c;
}

.rule-unavailable span {
  background: #e4e8ef;
  color: #52606d;
}

.rule p {
  margin: 4px 0 0;
  color: #53636d;
}

.chart-panel {
  min-height: 430px;
}

.error-message {
  margin: 0;
  border: 1px solid #d99b8c;
  border-radius: 8px;
  padding: 12px;
  background: #fff1ee;
  color: #8f321d;
}

table {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e0e6e9;
  padding: 10px 8px;
  text-align: left;
}

@media (max-width: 900px) {
  .workspace,
  .summary-panel {
    grid-template-columns: 1fr;
  }

  .workspace {
    padding: 12px;
  }
}
```

## Task 10: Add App Smoke Test

**Files:**
- Create: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/App.test.tsx`

- [ ] **Step 1: Write smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the workbench with a score and rule details', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '台股波段強勢股判斷工具' })).toBeInTheDocument();
    expect(screen.getByLabelText('輸入資料')).toBeInTheDocument();
    expect(screen.getByLabelText('結果摘要')).toBeInTheDocument();
    expect(screen.getByLabelText('條件明細')).toBeInTheDocument();
    expect(screen.getByLabelText('樣本驗證')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run full tests**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm test
```

Expected: all tests pass.

## Task 11: Final Verification

**Files:**
- Read: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/package.json`
- Read: `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp/src/App.tsx`

- [ ] **Step 1: Run build**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm run build
```

Expected: build succeeds and `dist/` is produced.

- [ ] **Step 2: Start dev server**

Run:

```bash
cd /Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp
npm run dev
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser smoke check**

Open the local URL and verify:

- the workbench renders
- built-in sample analysis appears
- score, classification, rule groups, chart, and validation table are visible
- layout does not overlap at desktop width
- mobile width stacks sidebar and content

- [ ] **Step 4: Report outcome**

Report:

- project location
- dev server URL
- tests run
- build result
- any limitations, especially that live stock-code lookup is a placeholder until a data source is added

## Self-Review

Spec coverage:

- Single-stock evaluation: covered by `analyzeRows` and app state.
- CSV and built-in samples: covered by `csv.ts`, `sampleData.ts`, and `InputPanel`.
- 0-100 score and classifications: covered by `config.ts` and `scoring.ts`.
- Passed, failed, unavailable conditions: covered by `RuleResult` and `RuleDetails`.
- Web workbench: covered by Tasks 8-10.
- Small validation set: covered by `sampleData.ts` and `ValidationPanel`.
- No live API dependency: stock-code field is a placeholder by design.
- Technical-only MVP: scoring only uses OHLCV-derived indicators.

Placeholder scan:

- The plan does not use TBD, TODO, or unspecified implementation placeholders.
- Future capabilities are represented only as non-MVP boundaries.

Type consistency:

- `OhlcvRow`, `IndicatorSnapshot`, `RuleResult`, `RuleGroupResult`, and `MomentumReport` are defined before use.
- `scoreTechnicals` returns fields consumed by `analyzeRows`.
- UI components only consume exported domain types.

Execution notes:

- Installing dependencies requires network access.
- Writing to `/Users/hsuhaoche/Desktop/shit/taiwan-stock-momentum-mvp` may require elevated filesystem permission outside the sandbox.
- Do not run mutating git commands unless the user explicitly asks.
