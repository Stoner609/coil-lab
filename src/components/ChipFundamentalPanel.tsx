import type { ChipFlowReport } from '../domain/types';

interface ChipFundamentalPanelProps {
  report: ChipFlowReport;
  onLoadChip?: () => void;
  isLoadingChip?: boolean;
}

export function ChipFundamentalPanel({ report, onLoadChip, isLoadingChip }: ChipFundamentalPanelProps) {
  return (
    <section aria-label="籌碼與基本面" className="panel chip-fundamental-panel">
      <h2>籌碼與基本面</h2>
      {onLoadChip && <button type="button" onClick={onLoadChip} disabled={isLoadingChip}>{isLoadingChip ? '載入籌碼中…' : '載入籌碼'}</button>}
      <div className={`setup-state chip-state-${report.classification}`}>
        <strong>{labelFor(report.classification)}</strong>
        <span>
          籌碼分數 {report.score} / {report.maxScore}
        </span>
      </div>

      <div className="metric-grid">
        <Metric label="外資買賣超" value={formatNullable(report.latestRow?.foreignNetBuyShares ?? null)} />
        <Metric label="投信買賣超" value={formatNullable(report.latestRow?.investmentTrustNetBuyShares ?? null)} />
        <Metric label="融資餘額" value={formatNullable(report.latestRow?.marginBuyBalance ?? null)} />
        <Metric label="融券餘額" value={formatNullable(report.latestRow?.shortSellBalance ?? null)} />
      </div>
      <h3>基本面</h3>
      <div className="metric-grid">
        <Metric label="月營收年增" value={formatPercent(report.fundamental.revenueYoYPct)} />
        <Metric label="近三月營收年增" value={formatPercent(report.fundamental.trailingThreeMonthRevenueYoYPct)} />
        <Metric label="EPS" value={formatNullable(report.fundamental.eps)} />
        <Metric label="毛利率" value={formatPercent(report.fundamental.grossMarginPct)} />
        <Metric label="營益率" value={formatPercent(report.fundamental.operatingMarginPct)} />
      </div>

      <div className="rule-groups">
        {report.rules.map((rule) => (
          <article className="rule-group" key={rule.id}>
            <header>
              <h3>{rule.label}</h3>
              <span>{rule.scoreImpact}</span>
            </header>
            <p>{rule.explanation}</p>
          </article>
        ))}
      </div>

      <ul className="compact-notes">
        {[...report.confidenceNotes, ...report.blockers, ...report.unavailableData].map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
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

function labelFor(classification: ChipFlowReport['classification']): string {
  if (classification === 'supportive') return '籌碼支撐';
  if (classification === 'mixed') return '籌碼混合';
  if (classification === 'risky') return '籌碼風險';
  return '資料不足';
}

function formatNullable(value: number | null): string {
  return value === null ? '無資料' : value.toLocaleString('en-US');
}

function formatPercent(value: number | null): string { return value === null ? '無資料' : `${value.toFixed(2)}%`; }
