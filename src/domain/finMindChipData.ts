import { normalizeStockCode } from './stockCode';
import type { ChipFlowRow } from './types';

const cache = new Map<string, Promise<ChipFlowRow[]>>();

export async function fetchFinMindChipRows(stockCode: string): Promise<ChipFlowRow[]> {
  const code = normalizeStockCode(stockCode);
  const existing = cache.get(code);
  if (existing) return existing;
  const request = load(code);
  cache.set(code, request);
  try { return await request; } catch (error) { cache.delete(code); throw error; }
}

async function load(stockCode: string): Promise<ChipFlowRow[]> {
  const end = new Date(); const start = new Date(end); start.setDate(end.getDate() - 60);
  const query = (dataset: string) => `/finmind/api/v4/data?dataset=${dataset}&data_id=${stockCode}&start_date=${start.toISOString().slice(0,10)}&end_date=${end.toISOString().slice(0,10)}`;
  const [a, b] = await Promise.all([fetch(query('TaiwanStockInstitutionalInvestorsBuySell')), fetch(query('TaiwanStockMarginPurchaseShortSale'))]);
  const [ap, bp] = await Promise.all([a.json(), b.json()]) as any[];
  if (!a.ok || !b.ok || ap.status !== 200 || bp.status !== 200) throw new Error('籌碼資料請求失敗');
  const rows = new Map<string, ChipFlowRow>();
  for (const x of bp.data ?? []) rows.set(x.date, { date:x.date, stockCode, foreignNetBuyShares:null, investmentTrustNetBuyShares:null, dealerNetBuyShares:null, totalInstitutionNetBuyShares:null, marginBuyBalance:x.MarginPurchaseTodayBalance ?? null, marginBuyChange: diff(x.MarginPurchaseTodayBalance,x.MarginPurchaseYesterdayBalance), shortSellBalance:x.ShortSaleTodayBalance ?? null, shortSellChange:diff(x.ShortSaleTodayBalance,x.ShortSaleYesterdayBalance) });
  for (const x of ap.data ?? []) { const r = rows.get(x.date) ?? { date:x.date, stockCode, foreignNetBuyShares:null, investmentTrustNetBuyShares:null, dealerNetBuyShares:null, totalInstitutionNetBuyShares:null, marginBuyBalance:null, marginBuyChange:null, shortSellBalance:null, shortSellChange:null }; const net = Number(x.buy)-Number(x.sell); if (x.name === 'Foreign_Investor') r.foreignNetBuyShares=net; if (x.name === 'Investment_Trust') r.investmentTrustNetBuyShares=net; if (x.name?.includes('Dealer')) r.dealerNetBuyShares=(r.dealerNetBuyShares ?? 0)+net; rows.set(x.date,r); }
  for (const r of rows.values()) r.totalInstitutionNetBuyShares=[r.foreignNetBuyShares,r.investmentTrustNetBuyShares,r.dealerNetBuyShares].some(x=>x===null)?null:(r.foreignNetBuyShares!+r.investmentTrustNetBuyShares!+r.dealerNetBuyShares!);
  return [...rows.values()].sort((x,y)=>x.date.localeCompare(y.date));
}
function diff(a: unknown,b: unknown) { return typeof a === 'number' && typeof b === 'number' ? a-b : null; }
