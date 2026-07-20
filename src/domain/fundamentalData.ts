import { normalizeStockCode } from './stockCode';
import type { FundamentalSnapshot } from './types';

type Fetcher = (input: string) => Promise<Pick<Response, 'ok' | 'json'>>;
interface Options { fetchImpl?: Fetcher; cacheTtlMs?: number }
const cache = new Map<string, { expires: number; value: FundamentalSnapshot }>();

export async function fetchFinMindFundamental(code: string, options: Options = {}): Promise<FundamentalSnapshot> {
  const stockCode = normalizeStockCode(code); const hit = cache.get(stockCode);
  if (hit && hit.expires > Date.now()) return { ...hit.value };
  const fetcher = options.fetchImpl ?? fetch;
  try {
    const [r, f] = await Promise.all([
      fetcher(`/finmind/api/v4/data?dataset=TaiwanStockMonthRevenue&data_id=${stockCode}&start_date=2025-01-01`),
      fetcher(`/finmind/api/v4/data?dataset=TaiwanStockFinancialStatements&data_id=${stockCode}&start_date=2025-01-01`),
    ]);
    const [rp, fp] = await Promise.all([r.json(), f.json()]) as [{ status: number; data?: any[] }, { status: number; data?: any[] }];
    if (!r.ok || !f.ok || rp.status !== 200 || fp.status !== 200) throw new Error();
    const rev = (rp.data ?? []).sort((a, b) => a.date.localeCompare(b.date)); const latest = rev.at(-1);
    const prev = rev.at(-2); const yearAgo = latest && rev.find(x => x.date === `${Number(latest.date.slice(0,4))-1}${latest.date.slice(4)}`);
    const q = (fp.data ?? []).reduce((a, x) => { (a[x.date] ??= {})[x.type] = x.value; return a; }, {} as Record<string, Record<string, number>>);
    const date = Object.keys(q).sort().at(-1); const v = date ? q[date] : undefined;
    const value: FundamentalSnapshot = { stockCode, monthlyRevenueAvailable: !!latest, latestRevenueMonth: latest?.date ?? null, revenueYoYPct: pct(latest?.revenue, yearAgo?.revenue), revenueMoMPct: pct(latest?.revenue, prev?.revenue), trailingThreeMonthRevenueYoYPct: null, quarterlyFinancialsAvailable: !!v, latestQuarter: date ?? null, eps: v?.EPS ?? null, grossMarginPct: ratio(v?.GrossProfit, v?.Revenue), operatingMarginPct: ratio(v?.OperatingIncome, v?.Revenue) };
    cache.set(stockCode, { expires: Date.now() + (options.cacheTtlMs ?? 86400000), value }); return value;
  } catch { return unavailable(stockCode); }
}
function pct(a?: number, b?: number) { return a == null || !b ? null : Number((((a / b) - 1) * 100).toFixed(2)); }
function ratio(a?: number, b?: number) { return a == null || !b ? null : Number(((a / b) * 100).toFixed(2)); }
function unavailable(stockCode: string): FundamentalSnapshot { return { stockCode, monthlyRevenueAvailable:false,latestRevenueMonth:null,revenueYoYPct:null,revenueMoMPct:null,trailingThreeMonthRevenueYoYPct:null,quarterlyFinancialsAvailable:false,latestQuarter:null,eps:null,grossMarginPct:null,operatingMarginPct:null }; }
