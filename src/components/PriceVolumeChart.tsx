import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { movingAverage } from '../domain/indicators';
import type { OhlcvRow } from '../domain/types';

export function PriceVolumeChart({ rows }: { rows: OhlcvRow[] }) {
  const ma20 = movingAverage(rows.map((row) => row.close), 20);
  const ma60 = movingAverage(rows.map((row) => row.close), 60);
  const startIndex = Math.max(0, rows.length - 120);
  const chartRows = rows.slice(-120).map((row, index) => {
    const sourceIndex = startIndex + index;
    return {
      date: row.date.slice(5),
      close: row.close,
      ma20: ma20[sourceIndex],
      ma60: ma60[sourceIndex],
      volume: row.volume,
    };
  });

  return (
    <section className="panel chart-panel" aria-label="價格與量能圖">
      <h2>價格與量能</h2>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartRows}>
          <CartesianGrid stroke="#e1e7ea" />
          <XAxis dataKey="date" minTickGap={28} />
          <YAxis yAxisId="price" orientation="left" domain={['dataMin - 5', 'dataMax + 5']} />
          <YAxis yAxisId="volume" orientation="right" hide />
          <Tooltip />
          <Legend />
          <Bar yAxisId="volume" dataKey="volume" fill="#b8c4ca" name="成交量" />
          <Line yAxisId="price" type="monotone" dataKey="close" stroke="#1f6f8b" dot={false} name="收盤" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#d08a1d" dot={false} name="MA20" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#5468c7" dot={false} name="MA60" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
