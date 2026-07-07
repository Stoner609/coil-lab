# CoilLab MVP Design

## Purpose

Build a first version of a Taiwan stock market tool that evaluates whether a single stock shows early signs of becoming a swing-trade momentum candidate.

The MVP focuses on finding stocks that may be 2-6 weeks before a stronger upward move. It is inspired by the user's interest in learning repeatable patterns from past strong stocks, but the first version is intentionally narrow: it validates technical rules before building a full-market scanner.

This tool is for research and screening. It must not present outputs as buy or sell recommendations.

## Scope

### In Scope

- Evaluate one stock at a time.
- Use daily OHLCV data from CSV files or built-in sample datasets.
- Score technical momentum conditions from 0 to 100.
- Classify the result as:
  - 80-100: strong candidate
  - 60-79: watchlist
  - 40-59: insufficient conditions
  - below 40: not qualified
- Explain every score with passed, failed, and unavailable conditions.
- Show a simple web workbench with upload, sample selection, summary, rule details, and charts.
- Support a small historical validation set with manually selected positive and negative samples.

### Out of Scope for MVP

- Full-market scanning.
- Automatic stock data ingestion from public APIs.
- Trading recommendations or exact buy/sell signals.
- Fundamental analysis such as revenue, EPS, margins, or industry trends.
- Chip-flow analysis such as foreign investor, investment trust, margin trading, or large-holder data.
- Short-term breakout trading and long-term growth investing models.

Future versions may add the preserved directions:

- Long-term growth stock analysis.
- Short-term breakout precursor analysis.
- Hybrid technical, fundamental, and chip-flow scoring.
- Public data API integration.
- Full-market ranking and alerts.

## Product Shape

The MVP is a hybrid research and product prototype:

- The core is a standalone technical rule engine.
- The web UI is a thin workbench for using and inspecting the engine.
- The validation flow is built into the project so rules can be tested against known examples.

This avoids building a polished interface before the rules are useful, while still giving the user a concrete tool to interact with.

## Data Inputs

The minimum CSV schema is:

```csv
date,open,high,low,close,volume
```

Rules:

- `date` must parse as a calendar date.
- Rows must be sortable in ascending date order.
- `open`, `high`, `low`, `close`, and `volume` must be numeric.
- At least 120 trading days are required for a full analysis.
- If fewer than 120 trading days are present, the tool must return a clear "data insufficient" result instead of guessing.

Optional future data:

- Market index OHLCV, such as Taiwan Weighted Index, for relative strength.
- Adjusted prices for dividends and capital actions.
- Stock name and industry metadata.

## Data Flow

```text
CSV or built-in sample
  -> data validation
  -> indicator calculation
  -> technical rule scoring
  -> report generation
  -> web UI rendering
```

The rule engine should not depend on the UI. The same engine should be usable later from tests, scripts, a CLI, or an API endpoint.

## Indicator Layer

The indicator layer computes reusable series and summary values:

- 20-day moving average.
- 60-day moving average.
- 20-day average volume.
- 60-day average volume.
- 20-day and 60-day price returns.
- Recent 20-60 day high and low.
- Recent range width and contraction.
- Distance from 20-day and 60-day moving averages.
- Recent high-volume down days.
- Optional relative strength against a market index when index data exists.

Unavailable optional data must be reported as unavailable, not silently treated as neutral strength.

## Rule Groups

The first scoring model has five groups.

### Trend Structure

Purpose: identify whether the stock is shifting into a stronger technical structure.

Signals:

- Close is above the 20-day moving average.
- Close is above the 60-day moving average.
- 20-day moving average is rising.
- 60-day moving average is flat or rising.
- Price recovered above key moving averages after a prior base.

### Base and Contraction

Purpose: identify the "before launch" phase instead of chasing an already extended move.

Signals:

- Price range has narrowed over the recent 20-60 trading days.
- Recent pullbacks hold above prior lows or the 60-day moving average.
- Price is near a base or platform high.
- Price has not already advanced too far in a short period.

### Volume Health

Purpose: distinguish healthy accumulation from weak or distribution-like price action.

Signals:

- Volume contracts during consolidation.
- Recent volume begins to warm up near the top of the base.
- Breakout attempts are not paired with heavy reversal candles.
- Recent high-volume down days are limited.

### Relative Strength

Purpose: confirm that the stock is outperforming the broader market.

Signals when market index data is available:

- 20-day return is stronger than the index.
- 60-day return is stronger than the index.
- Stock holds up better than the index during pullbacks.

If market index data is unavailable, this group is marked unavailable. The MVP then calculates the raw score from the 85 available technical points and normalizes it to a 100-point display score. It must not fake relative strength.

### Risk Deductions

Purpose: avoid false positives that are already extended, broken, or data-poor.

Risk signals:

- Price is too far above the 60-day moving average.
- Short-term advance is already excessive.
- Price breaks below the consolidation range.
- High-volume down days appear recently.
- Data is too short or malformed.
- Major required indicators cannot be calculated.

## Scoring Policy

The first version uses a transparent rule-based score rather than a machine learning model.

Initial group weights:

- Trend structure: 30 points.
- Base and contraction: 25 points.
- Volume health: 20 points.
- Relative strength: 15 points when market index data is available.
- Risk deductions: up to -20 points.
- Data quality gates can force a non-qualified result when required data is missing.

When relative strength is unavailable, the initial version computes:

```text
display_score = round(raw_score_without_relative_strength / 85 * 100)
```

The report must show both the normalized display score and the fact that relative strength was unavailable. Thresholds and weights must live in one configuration module so they can be tuned after validation.

Each rule returns:

- status: `passed`, `failed`, or `unavailable`
- score impact
- short explanation

The final report includes:

- total score
- classification
- group scores
- condition details
- risk notes
- data quality notes

## Web Workbench

The first screen is the working tool, not a landing page.

Primary sections:

- Input panel:
  - upload CSV
  - choose built-in sample
  - stock code input placeholder for future API-backed lookup
- Result summary:
  - stock code or sample name
  - analysis date
  - total score
  - classification
  - short conclusion
- Rule detail panel:
  - five rule groups
  - group score
  - passed, failed, and unavailable conditions
- Chart panel:
  - closing price
  - 20-day and 60-day moving averages
  - volume bars
  - recent base high and low markers
- Validation panel:
  - positive and negative sample scores
  - distribution of classifications
  - rule-level misses for later tuning

The UI should stay utilitarian and dense enough for repeated analysis. It should avoid marketing copy and avoid treating the result as a trading command.

## Validation Dataset Strategy

The user does not currently have prepared data, so the MVP includes a small dataset workflow.

Initial dataset:

- Manually identify a small set of past Taiwan swing momentum winners as positive samples.
- Manually identify a small set of ordinary or failed-pattern stocks as negative samples.
- For each sample, collect daily OHLCV for the months before the known move or failed period.
- Label the intended evaluation window as 2-6 weeks before the main move.

Validation goals:

- Positive samples should commonly score at least 60 before the main move.
- The strongest positive samples should commonly score at least 80 before or near the early breakout stage.
- Negative samples should not frequently score 80 or above.
- Rule explanations should make sense to a human reviewer.

The first validation is qualitative and directional, not a claim of predictive accuracy.

## Error Handling

Data format errors:

- missing required columns
- invalid dates
- nonnumeric OHLCV values
- empty files

Data sufficiency errors:

- fewer than 120 trading days
- missing volume data
- unable to calculate required moving averages

Analysis limitations:

- relative strength unavailable without index data
- raw prices may be affected by dividends or capital actions
- small sample validation can overfit
- the MVP only evaluates technical conditions

Errors and limitations should be shown in the report, not hidden in logs.

## Testing Strategy

Core rule engine tests:

- accepts valid OHLCV data
- rejects missing or malformed columns
- rejects insufficient history
- calculates moving averages and volume averages correctly
- scores obvious trend-strength fixtures higher than weak fixtures
- applies risk deductions for extended or broken patterns

Report tests:

- includes total score, classification, group scores, condition details, and risk notes
- marks unavailable relative strength correctly when index data is absent

UI smoke tests:

- built-in sample can be selected and analyzed
- CSV upload displays a result
- malformed CSV displays a useful error
- charts render without overlapping major UI elements

Validation checks:

- run positive and negative sample fixtures through the scoring engine
- review score distribution
- record false positives and false negatives for threshold tuning

## Non-Goals and Guardrails

- Do not claim the tool predicts stock prices.
- Do not output direct buy or sell instructions.
- Do not optimize against a large historical dataset before the rule definitions are understandable.
- Do not mix technical, fundamental, and chip-flow factors in the MVP score.
- Do not make the UI depend on live data availability.

## Open Follow-Up Work After MVP

- Add Taiwan market index data for relative strength.
- Add automatic public data ingestion.
- Add adjusted-price handling.
- Expand the validation dataset.
- Add basic backtest windows for signal timing.
- Add full-market screening.
- Add separate modules for growth, breakout, and hybrid scoring.
