import type { SignalBacktestReport } from '../domain/types';

interface SignalValidationPanelProps {
  backtest: SignalBacktestReport;
}

export function SignalValidationPanel({ backtest }: SignalValidationPanelProps) {
  return (
    <section aria-label="訊號驗證回測" className="panel signal-validation-panel">
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
            {backtest.signals.length === 0 ? (
              <tr>
                <td colSpan={6}>尚無符合門檻的歷史訊號。</td>
              </tr>
            ) : (
              backtest.signals.slice(-8).map((signal) => (
                <tr key={signal.signalDate}>
                  <td>{signal.signalDate}</td>
                  <td>{signal.displayScore}</td>
                  <td>{formatPct(signal.forwardReturns.day5)}</td>
                  <td>{formatPct(signal.forwardReturns.day20)}</td>
                  <td>{formatPct(signal.forwardReturns.day60)}</td>
                  <td>{formatPct(signal.maxAdverse20)}</td>
                </tr>
              ))
            )}
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
