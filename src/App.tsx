import { useMemo, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { PriceVolumeChart } from './components/PriceVolumeChart';
import { ResultSummary } from './components/ResultSummary';
import { RuleDetails } from './components/RuleDetails';
import { ChipFundamentalPanel } from './components/ChipFundamentalPanel';
import { SignalValidationPanel } from './components/SignalValidationPanel';
import { TraderDecisionPanel } from './components/TraderDecisionPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { runSignalBacktest } from './domain/backtest';
import { scoreChipFlow } from './domain/chipScoring';
import { parseCsvText } from './domain/csv';
import { buildTraderDecision } from './domain/decision';
import { calculateIndicators } from './domain/indicators';
import { fetchFinMindIndexRows, fetchFinMindStockRows } from './domain/finMindData';
import { fetchFinMindFundamental } from './domain/fundamentalData';
import { fetchFinMindChipRows } from './domain/finMindChipData';
import { normalizeStockCode } from './domain/stockCode';
import { analyzeRows } from './domain/report';
import { builtInSamples } from './domain/sampleData';
import type { ChipFlowRow, FundamentalSnapshot, OhlcvRow } from './domain/types';

export default function App() {
  const [selectedSampleId, setSelectedSampleId] = useState(builtInSamples[0].id);
  const [stockCode, setStockCode] = useState('');
  const [customRows, setCustomRows] = useState<OhlcvRow[] | null>(null);
  const [customIndexRows, setCustomIndexRows] = useState<OhlcvRow[] | null>(null);
  const [customChipRows, setCustomChipRows] = useState<ChipFlowRow[] | null>(null);
  const [fundamental, setFundamental] = useState<FundamentalSnapshot | null>(null);
  const [customName, setCustomName] = useState('');
  const [customStockCode, setCustomStockCode] = useState('');
  const [error, setError] = useState('');
  const [chipWarning, setChipWarning] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isChipLoading, setIsChipLoading] = useState(false);

  const selectedSample = builtInSamples.find((sample) => sample.id === selectedSampleId) ?? builtInSamples[0];
  const activeName = customRows ? customName : selectedSample.label;
  const activeRows = customRows ?? selectedSample.rows;
  const activeChipRows = customRows ? (customChipRows ?? []) : (selectedSample.chipRows ?? []);
  const activeChipStockCode = customRows ? customStockCode || 'custom' : selectedSample.id;

  const report = useMemo(() => analyzeRows(activeName, activeRows, customIndexRows ?? undefined), [activeName, activeRows, customIndexRows]);
  const snapshot = useMemo(() => calculateIndicators(activeRows), [activeRows]);
  const chipReport = useMemo(() => scoreChipFlow(activeChipRows, activeChipStockCode, fundamental ?? undefined), [activeChipRows, activeChipStockCode, fundamental]);
  const traderDecision = useMemo(() => buildTraderDecision(report, snapshot, chipReport), [report, snapshot, chipReport]);
  const backtest = useMemo(
    () => runSignalBacktest(activeRows, customIndexRows ?? undefined),
    [activeRows, customIndexRows],
  );

  async function handleCsvText(fileName: string, text: string) {
    try {
      setError('');
      setChipWarning('');
      setCustomRows(await parseCsvText(text));
      setCustomIndexRows(null);
      setCustomChipRows(null);
      setFundamental(null);
      setCustomName(fileName);
      setCustomStockCode('custom');
    } catch (csvError) {
      setCustomRows(null);
      setCustomIndexRows(null);
      setCustomChipRows(null);
      setFundamental(null);
      setCustomName('');
      setCustomStockCode('');
      setError(csvError instanceof Error ? csvError.message : 'CSV 解析失敗。');
    }
  }

  async function handleStockCodeLookup() {
    setIsLookupLoading(true);
    setError('');
    setChipWarning('');
    try {
      const normalizedCode = normalizeStockCode(stockCode);
      const [rows, indexRows, basic] = await Promise.all([fetchFinMindStockRows(normalizedCode), fetchFinMindIndexRows(), fetchFinMindFundamental(normalizedCode)]);
      setCustomRows(rows);
      setCustomIndexRows(indexRows);
      setCustomChipRows([]);
      setFundamental(basic);
      setChipWarning('為減少資料請求，籌碼資料未自動載入。');
      setCustomName(`${normalizedCode} FinMind`);
      setCustomStockCode(normalizedCode);
    } catch (lookupError) {
      setCustomRows(null);
      setCustomIndexRows(null);
      setCustomChipRows(null);
      setFundamental(null);
      setCustomName('');
      setCustomStockCode('');
      setError(lookupError instanceof Error ? lookupError.message : '股票資料查詢失敗。');
    } finally {
      setIsLookupLoading(false);
    }
  }

  function handleSampleChange(sampleId: string) {
    setSelectedSampleId(sampleId);
    setCustomRows(null);
    setCustomIndexRows(null);
    setCustomChipRows(null);
    setCustomName('');
    setCustomStockCode('');
    setError('');
    setChipWarning('');
  }

  async function handleLoadChip() {
    if (!customStockCode || customStockCode === 'custom') return;
    setIsChipLoading(true);
    try { setCustomChipRows(await fetchFinMindChipRows(customStockCode)); setChipWarning(''); }
    catch { setChipWarning('籌碼資料抓取失敗，暫以 unavailable 顯示。'); }
    finally { setIsChipLoading(false); }
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
          {(report.dataNotes.length > 0 || chipWarning) && (
            <section className="panel notes-panel">
              <h2>資料備註</h2>
              <ul>
                {report.dataNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
                {chipWarning && <li>{chipWarning}</li>}
              </ul>
            </section>
          )}
        </aside>

        <section className="content-grid">
          <ResultSummary report={report} />
          <TraderDecisionPanel decision={traderDecision} />
          <ChipFundamentalPanel report={chipReport} onLoadChip={customRows ? handleLoadChip : undefined} isLoadingChip={isChipLoading} />
          {report.rows.length > 0 && <PriceVolumeChart rows={report.rows} />}
          <RuleDetails report={report} />
          <SignalValidationPanel backtest={backtest} />
          <ValidationPanel samples={builtInSamples} />
        </section>
      </div>
    </main>
  );
}
