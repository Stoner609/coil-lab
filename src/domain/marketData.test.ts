import { describe, expect, it, vi } from 'vitest';
import { fetchTwseIndexRows, fetchTwseStockRows, parseTwseDate, parseTwseNumber } from './marketData';

const twseResponse = {
  stat: 'OK',
  data: [
    ['115/06/30', '12,345,000', '1,234,567,890', '1,000.00', '1,020.00', '995.00', '1,015.00', '+10.00', '12,345', ''],
    ['115/07/01', '10,000,000', '1,100,000,000', '1,016.00', '1,025.00', '1,010.00', '1,020.00', '+5.00', '9,999', ''],
  ],
};

const twseIndexResponse = {
  stat: 'OK',
  data: [
    ['115/06/30', '22,000.00', '22,200.00', '21,900.00', '22,100.00'],
    ['115/07/01', '22,150.00', '22,300.00', '22,000.00', '22,250.00'],
  ],
};

describe('marketData', () => {
  it('parses TWSE ROC dates into ISO dates', () => {
    expect(parseTwseDate('115/07/01')).toBe('2026-07-01');
  });

  it('parses TWSE formatted numbers', () => {
    expect(parseTwseNumber('1,020.00')).toBe(1020);
    expect(parseTwseNumber('--')).toBeNull();
  });

  it('fetches and converts TWSE monthly rows into OHLCV rows', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => twseResponse,
    });

    const rows = await fetchTwseStockRows('2330', {
      months: ['20260701'],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith('/twse/rwd/zh/afterTrading/STOCK_DAY?date=20260701&stockNo=2330&response=json');
    expect(rows).toEqual([
      { date: '2026-06-30', open: 1000, high: 1020, low: 995, close: 1015, volume: 12345000 },
      { date: '2026-07-01', open: 1016, high: 1025, low: 1010, close: 1020, volume: 10000000 },
    ]);
  });

  it('fetches and converts TWSE index rows into OHLC rows with zero volume', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => twseIndexResponse,
    });

    const rows = await fetchTwseIndexRows({
      months: ['20260701'],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith('/twse/rwd/zh/TAIEX/MI_5MINS_HIST?date=20260701&response=json');
    expect(rows).toEqual([
      { date: '2026-06-30', open: 22000, high: 22200, low: 21900, close: 22100, volume: 0 },
      { date: '2026-07-01', open: 22150, high: 22300, low: 22000, close: 22250, volume: 0 },
    ]);
  });
});
