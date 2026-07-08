# Trader Decision Support Design

## Purpose

CoilLab currently answers one narrow question: whether a single Taiwan stock has early technical signs of becoming a swing-trade momentum candidate.

The next version should answer a more useful trader question: if this stock is a strong candidate, what else should the trader inspect before deciding whether to act?

The tool must remain a research and decision-support product. It must not present outputs as buy or sell instructions. The final trade decision still belongs to the trader.

## Product Goal

Add a trader decision layer on top of the existing strong-stock score.

The decision layer should summarize:

- Market context.
- Relative strength quality.
- Technical setup maturity.
- Volume and liquidity quality.
- Risk and invalidation levels.
- Optional fundamental and chip-flow placeholders when data is not available.
- Historical signal behavior through a signal-validation backtest.

The first version should favor explainable, inspectable outputs over complex modeling.

## Scope

### In Scope

- Keep the existing single-stock analysis flow.
- Add a decision-support summary that separates "stock is strong" from "setup is actionable".
- Add a setup state:
  - `actionable`: strong setup with manageable risk.
  - `watch`: promising but waiting for confirmation or better entry.
  - `extended`: strong but already too far from a reasonable entry.
  - `avoid`: weak, broken, or risk is not controllable.
- Add a risk/reward estimate based on technical levels:
  - candidate entry reference.
  - invalidation level.
  - nearest resistance or target reference.
  - reward-to-risk ratio when calculable.
- Add a signal-validation backtest that evaluates what happened after historical high-score signals.
- Show forward returns over 5, 10, 20, 40, and 60 trading days.
- Show maximum adverse excursion and maximum favorable excursion after each signal.
- Add tests for decision classification, risk/reward calculations, and backtest metrics.

### Out of Scope

- Automatic buy or sell recommendations.
- Portfolio sizing.
- Order execution.
- Intraday data.
- Machine learning prediction.
- Full-market scanning.
- Complete fundamental and chip-flow ingestion.
- Survivorship-bias-free institutional-grade backtesting.

Future versions may add full-market ranking, TPEx coverage, adjusted prices, industry metadata, monthly revenue, EPS, margin data, institutional buying, margin trading, and alerts.

## Trader Information Model

### 1. Market and Industry Context

A strong stock is lower quality when the broad market is breaking down.

The decision layer should eventually inspect:

- Taiwan Weighted Index trend.
- TPEx trend when TPEx data is available.
- Index 20-day and 60-day returns.
- Whether the stock is outperforming during market weakness.
- Industry or peer strength when metadata is available.

For this version, market context can use the existing optional index rows. Industry context should be represented as unavailable unless peer or industry data is explicitly supplied later.

### 2. Relative Strength

The existing relative strength checks compare stock returns against the weighted index. The next layer should make this more decision-oriented.

Useful outputs:

- 20-day excess return over index.
- 60-day excess return over index.
- Whether relative strength is improving.
- Whether relative strength data is unavailable.

The UI should avoid pretending missing data is neutral. Missing data should reduce confidence, not produce a fake positive.

### 3. Technical Setup

The existing score identifies trend, base, volume, relative strength, and risk. The decision layer should translate those details into setup language.

Useful outputs:

- Setup state.
- Current price location:
  - near platform high.
  - near moving average support.
  - extended from 60-day moving average.
  - below key trend levels.
- Invalidation level:
  - below recent 20-day low, 60-day base low, or 60-day moving average depending on available data.
- Entry reference:
  - close price for current-state evaluation.
  - optional future breakout reference from the 60-day range high.
- Risk percent from entry to invalidation.

### 4. Volume and Liquidity

The tool should distinguish healthy strength from fragile strength.

Useful outputs:

- 20-day average volume.
- 60-day average volume.
- 20/60 volume ratio.
- High-volume down-day count.
- Liquidity note if volume is too low to trust or trade comfortably.

For now, liquidity can be reported as a warning note. It should not become a hard trading rule until the user defines position size or minimum turnover requirements.

### 5. Fundamental and Chip-Flow Placeholders

Basic and chip-flow analysis are valuable, but the current data source does not include them.

The next version should include explicit unavailable states for:

- monthly revenue trend.
- EPS trend.
- margin trend.
- foreign investor buying.
- investment trust buying.
- margin financing overheating.

This keeps the product honest and prepares the data model without blocking the technical decision layer.

## Signal-Validation Backtest

### Purpose

The backtest should validate the scoring signal. It should not try to simulate perfect trading.

Core question:

When a stock first reaches a strong-candidate score, did it tend to produce favorable forward returns within the next 2-12 weeks?

### Signal Definition

A signal occurs when:

- the display score is at or above 80.
- the previous trading day was below 80, or there is no previous signal inside the cooldown window.
- enough future rows exist to calculate at least the 20-day forward return.

The default cooldown window should be 20 trading days so one long consolidation does not produce repeated duplicate signals every day.

### Metrics Per Signal

Each signal result should include:

- signal date.
- signal close.
- display score.
- classification.
- forward return after 5, 10, 20, 40, and 60 trading days when available.
- maximum favorable excursion within 20 and 60 trading days.
- maximum adverse excursion within 20 and 60 trading days.
- whether the invalidation level was touched within 20 trading days when calculable.

### Summary Metrics

The backtest summary should include:

- number of signals.
- average 20-day forward return.
- median 20-day forward return.
- win rate for 20-day forward return above 0.
- average max adverse excursion over 20 days.
- best and worst 20-day forward return.

The first version should work on the currently loaded single-stock dataset. Full-market backtesting can come later.

## UX Shape

The first screen remains the working tool.

Add two sections to the existing result area:

- Trader Decision Panel:
  - setup state.
  - confidence notes.
  - actionability blockers.
  - risk/reward estimate.
  - unavailable data notes.
- Signal Validation Panel:
  - summary metrics.
  - table of historical signals.
  - forward return columns.
  - adverse/favorable excursion columns.

The copy should use research language:

- "Actionable setup" is acceptable as a setup classification.
- "Buy", "sell", "must enter", and "guaranteed" are not acceptable.
- Every output should be explainable from observable data.

## Architecture

Extend the existing domain-first architecture.

New domain modules:

- `src/domain/decision.ts`: converts a `MomentumReport` and latest indicators into trader-facing setup state, risk/reward levels, and decision notes.
- `src/domain/backtest.ts`: walks historical rows, runs the existing analysis at each date, detects strong-candidate signals, and computes forward metrics.

New UI components:

- `src/components/TraderDecisionPanel.tsx`.
- `src/components/SignalValidationPanel.tsx`.

Existing modules should remain responsible for their current jobs:

- `indicators.ts`: reusable technical calculations.
- `scoring.ts`: rule score and classification.
- `report.ts`: single-date report orchestration.
- `App.tsx`: coordinates selected data and renders panels.

## Data Quality Rules

- At least 120 rows are still required for full current-state analysis.
- Backtest should skip windows that do not have enough lookback rows to calculate the score.
- Forward metrics should be `null` when future rows are unavailable.
- Unavailable optional data should be displayed explicitly.
- Backtest calculations must not use future data when detecting the signal date.

## Testing Requirements

Add focused Vitest coverage for:

- setup state classification.
- risk/reward calculation.
- unavailable optional data notes.
- signal detection cooldown.
- forward return calculations.
- maximum favorable and adverse excursion calculations.
- no lookahead in signal detection.

Existing tests must keep passing.

## Success Criteria

The next version is successful when a trader can inspect one stock and answer:

- Is this a strong candidate?
- Is the current setup actionable, extended, just watchlist, or avoid?
- What data is missing?
- What level would make the idea invalid?
- Is the risk/reward reasonable?
- How did similar high-score moments behave historically on this dataset?

