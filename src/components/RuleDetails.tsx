import type { MomentumReport, RuleStatus } from '../domain/types';

const statusText: Record<RuleStatus, string> = {
  passed: '通過',
  failed: '未通過',
  unavailable: '資料不足',
  warning: '警示',
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
              <span>
                {group.score} / {group.maxScore}
              </span>
            </header>
            <ul>
              {group.rules.map((rule) => (
                <li key={rule.id} className={`rule rule-${rule.status}`}>
                  <span>{group.id === 'risk' && rule.status === 'passed' ? '未觸發' : statusText[rule.status]}</span>
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
