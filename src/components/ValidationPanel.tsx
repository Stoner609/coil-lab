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
