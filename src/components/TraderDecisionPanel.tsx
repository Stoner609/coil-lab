import type { TraderDecision } from '../domain/types';

interface TraderDecisionPanelProps {
  decision: TraderDecision;
}

export function TraderDecisionPanel({ decision }: TraderDecisionPanelProps) {
  return (
    <section aria-label="交易決策輔助" className="panel trader-decision-panel">
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
