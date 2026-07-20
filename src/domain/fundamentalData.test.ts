import { describe, expect, it, vi } from 'vitest';
import { fetchFinMindFundamental } from './fundamentalData';

const revenue = [
  { date: '2025-06-01', revenue: 100 }, { date: '2025-07-01', revenue: 100 }, { date: '2025-08-01', revenue: 100 },
  { date: '2026-04-01', revenue: 100 }, { date: '2026-05-01', revenue: 110 }, { date: '2026-06-01', revenue: 120 },
];
const financial = [
  { date: '2026-03-31', type: 'EPS', value: 4 }, { date: '2026-03-31', type: 'Revenue', value: 1000 },
  { date: '2026-03-31', type: 'GrossProfit', value: 250 }, { date: '2026-03-31', type: 'OperatingIncome', value: 120 },
];

describe('fundamental data', () => {
  it('uses two requests and maps revenue plus latest-quarter metrics', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 200, data: revenue }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 200, data: financial }) });
    const result = await fetchFinMindFundamental('3515', { fetchImpl, cacheTtlMs: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ monthlyRevenueAvailable: true, quarterlyFinancialsAvailable: true, eps: 4, grossMarginPct: 25, operatingMarginPct: 12 });
  });
});
