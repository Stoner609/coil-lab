import { describe, expect, it, vi } from 'vitest';
import { fetchFinMindIndexRows, fetchFinMindStockRows } from './finMindData';

const stockResponse = {
  status: 200,
  data: [
    { date: '2026-07-02', open: 216, max: 221, min: 215, close: 218, Trading_Volume: 350568 },
    { date: '2026-07-01', open: 224, max: 227, min: 213.5, close: 213.5, Trading_Volume: 1190619 },
  ],
};

const indexResponse = {
  status: 200,
  data: [
    { date: '2026-07-02', price: 107239.33 },
    { date: '2026-07-01', price: 107781.17 },
  ],
};

describe('FinMind market data', () => {
  it('fetches a stock interval in one request and maps it to sorted OHLCV rows', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => stockResponse });

    const rows = await fetchFinMindStockRows('3515', {
      startDate: '2026-03-15',
      endDate: '2026-07-20',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/finmind/api/v4/data?dataset=TaiwanStockPrice&data_id=3515&start_date=2026-03-15&end_date=2026-07-20',
    );
    expect(rows).toEqual([
      { date: '2026-07-01', open: 224, high: 227, low: 213.5, close: 213.5, volume: 1190619 },
      { date: '2026-07-02', open: 216, high: 221, low: 215, close: 218, volume: 350568 },
    ]);
  });

  it('fetches the TAIEX interval in one request and maps its prices to OHLC rows', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => indexResponse });

    const rows = await fetchFinMindIndexRows({
      startDate: '2026-03-15',
      endDate: '2026-07-20',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/finmind/api/v4/data?dataset=TaiwanStockTotalReturnIndex&data_id=TAIEX&start_date=2026-03-15&end_date=2026-07-20',
    );
    expect(rows).toEqual([
      { date: '2026-07-01', open: 107781.17, high: 107781.17, low: 107781.17, close: 107781.17, volume: 0 },
      { date: '2026-07-02', open: 107239.33, high: 107239.33, low: 107239.33, close: 107239.33, volume: 0 },
    ]);
  });

  it('reports a failed FinMind response status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ status: 429, data: [] }) });

    await expect(fetchFinMindStockRows('3515', { fetchImpl })).rejects.toThrow('FinMind 資料請求失敗：HTTP 429');
  });
});
