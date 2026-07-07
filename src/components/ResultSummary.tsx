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
