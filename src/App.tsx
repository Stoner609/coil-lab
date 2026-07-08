import { useMemo, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { PriceVolumeChart } from './components/PriceVolumeChart';
import { ResultSummary } from './components/ResultSummary';
import { RuleDetails } from './components/RuleDetails';
import { SignalValidationPanel } from './components/SignalValidationPanel';
import { TraderDecisionPanel } from './components/TraderDecisionPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { runSignalBacktest } from './domain/backtest';
import { parseCsvText } from './domain/csv';
import { buildTraderDecision } from './domain/decision';
import { calculateIndicators } from './domain/indicators';
import { fetchTwseIndexRows, fetchTwseStockRows, normalizeStockCode } from './domain/marketData';
import { analyzeRows } from './domain/report';
import { builtInSamples } from './domain/sampleData';
import type { OhlcvRow } from './domain/types';

export default function App() {
  const [selectedSampleId, setSelectedSampleId] = useState(builtInSamples[0].id);
  const [stockCode, setStockCode] = useState('');
  const [customRows, setCustomRows] = useState<OhlcvRow[] | null>(null);
  const [customIndexRows, setCustomIndexRows] = useState<OhlcvRow[] | null>(null);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const selectedSample = builtInSamples.find((sample) => sample.id === selectedSampleId) ?? builtInSamples[0];
  const activeName = customRows ? customName : selectedSample.label;
  const activeRows = customRows ?? selectedSample.rows;

  const report = useMemo(() => analyzeRows(activeName, activeRows, customIndexRows ?? undefined), [activeName, activeRows, customIndexRows]);
  const snapshot = useMemo(() => calculateIndicators(activeRows), [activeRows]);
  const traderDecision = useMemo(() => buildTraderDecision(report, snapshot), [report, snapshot]);
  const backtest = useMemo(
    () => runSignalBacktest(activeRows, customIndexRows ?? undefined),
    [activeRows, customIndexRows],
  );

  async function handleCsvText(fileName: string, text: string) {
    try {
      setError('');
      setCustomRows(await parseCsvText(text));
      setCustomIndexRows(null);
      setCustomName(fileName);
    } catch (csvError) {
      setCustomRows(null);
      setCustomIndexRows(null);
      setCustomName('');
      setError(csvError instanceof Error ? csvError.message : 'CSV 解析失敗。');
    }
  }

  async function handleStockCodeLookup() {
    setIsLookupLoading(true);
    setError('');
    try {
      const normalizedCode = normalizeStockCode(stockCode);
      const [rows, indexRows] = await Promise.all([fetchTwseStockRows(normalizedCode), fetchTwseIndexRows()]);
      setCustomRows(rows);
      setCustomIndexRows(indexRows);
      setCustomName(`${normalizedCode} TWSE`);
    } catch (lookupError) {
      setCustomRows(null);
      setCustomIndexRows(null);
      setCustomName('');
      setError(lookupError instanceof Error ? lookupError.message : '股票資料查詢失敗。');
    } finally {
      setIsLookupLoading(false);
    }
  }

  function handleSampleChange(sampleId: string) {
    setSelectedSampleId(sampleId);
    setCustomRows(null);
    setCustomIndexRows(null);
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
            onStockCodeLookup={handleStockCodeLookup}
            isLookupLoading={isLookupLoading}
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
          <TraderDecisionPanel decision={traderDecision} />
          {report.rows.length > 0 && <PriceVolumeChart rows={report.rows} />}
          <RuleDetails report={report} />
          <SignalValidationPanel backtest={backtest} />
          <ValidationPanel samples={builtInSamples} />
        </section>
      </div>
    </main>
  );
}
