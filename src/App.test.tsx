import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./domain/marketData', () => ({
  normalizeStockCode: (stockCode: string) => stockCode.trim(),
  fetchTwseStockRows: vi.fn(async () =>
    Array.from({ length: 140 }, (_, index) => {
      const date = new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10);
      const price = 100 + index * 0.5;
      return {
        date,
        open: price - 1,
        high: price + 2,
        low: price - 2,
        close: price,
        volume: 1000 + index,
      };
    }),
  ),
  fetchTwseIndexRows: vi.fn(async () =>
    Array.from({ length: 140 }, (_, index) => {
      const date = new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10);
      const price = 90 + index * 0.1;
      return {
        date,
        open: price - 1,
        high: price + 2,
        low: price - 2,
        close: price,
        volume: 0,
      };
    }),
  ),
}));

describe('App', () => {
  it('renders the workbench with a score and rule details', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '台股波段強勢股判斷工具' })).toBeInTheDocument();
    expect(screen.getByLabelText('輸入資料')).toBeInTheDocument();
    expect(screen.getByLabelText('結果摘要')).toBeInTheDocument();
    expect(screen.getByLabelText('條件明細')).toBeInTheDocument();
    expect(screen.getByLabelText('樣本驗證')).toBeInTheDocument();
  });

  it('clears the custom CSV report when a later upload cannot be parsed', async () => {
    const user = userEvent.setup();
    render(<App />);

    const validCsv = [
      'date,open,high,low,close,volume',
      ...Array.from({ length: 120 }, (_, index) => {
        const date = new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10);
        return `${date},10,12,9,11,1000`;
      }),
    ].join('\n');

    const input = screen.getByLabelText('上傳 CSV');
    await user.upload(input, new File([validCsv], 'custom.csv', { type: 'text/csv' }));

    expect(await screen.findByText('custom.csv')).toBeInTheDocument();

    await user.upload(input, new File(['not,a,valid,csv\n1,2'], 'bad.csv', { type: 'text/csv' }));

    expect(await screen.findByText(/CSV 解析失敗|Too few fields|Invalid Record Length/)).toBeInTheDocument();
    expect(screen.queryByText('custom.csv')).not.toBeInTheDocument();
  });

  it('loads stock data by stock code and analyzes the fetched rows', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('股票代號'), '2330');
    await user.click(screen.getByRole('button', { name: '查詢' }));

    expect(await screen.findByText('2330 TWSE')).toBeInTheDocument();
    expect(await screen.findByText('已納入')).toBeInTheDocument();
  });
});
