import { normalizeStockCode } from './stockCode';
import type { OhlcvRow } from './types';

interface FinMindResponse<T> {
  status: number;
  data?: T[];
}

interface FinMindStockRow {
  date: string;
  open: number;
  max: number;
  min: number;
  close: number;
  Trading_Volume: number;
}

interface FinMindIndexRow {
  date: string;
  price: number;
}

type FinMindFetch = (input: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

interface FetchFinMindOptions {
  startDate?: string;
  endDate?: string;
  fetchImpl?: FinMindFetch;
}

const FINMIND_PATH = '/finmind/api/v4/data';
const LOOKBACK_MONTHS = 8;

export async function fetchFinMindStockRows(
  stockCode: string,
  options: FetchFinMindOptions = {},
): Promise<OhlcvRow[]> {
  const normalizedCode = normalizeStockCode(stockCode);
  const payload = await fetchFinMindData<FinMindStockRow>('TaiwanStockPrice', normalizedCode, options);
  const rows = payload.map(toStockOhlcvRow).filter(isOhlcvRow).sort(byDate);

  if (rows.length === 0) throw new Error(`查無 ${normalizedCode} 的 FinMind 上市日成交資料。`);
  return rows;
}

export async function fetchFinMindIndexRows(options: FetchFinMindOptions = {}): Promise<OhlcvRow[]> {
  const payload = await fetchFinMindData<FinMindIndexRow>('TaiwanStockTotalReturnIndex', 'TAIEX', options);
  const rows = payload.map(toIndexOhlcvRow).filter(isOhlcvRow).sort(byDate);

  if (rows.length === 0) throw new Error('查無 FinMind TAIEX 資料，無法計算相對強度。');
  return rows;
}

async function fetchFinMindData<T>(
  dataset: string,
  dataId: string,
  options: FetchFinMindOptions,
): Promise<T[]> {
  const fetcher = options.fetchImpl ?? fetch;
  const { startDate, endDate } = dateRange(options);
  const params = new URLSearchParams({
    dataset,
    data_id: dataId,
    start_date: startDate,
    end_date: endDate,
  });
  const response = await fetcher(`${FINMIND_PATH}?${params}`);
  if (!response.ok) throw new Error(`FinMind 資料請求失敗：HTTP ${response.status}`);

  const payload = (await response.json()) as FinMindResponse<T>;
  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(`FinMind 資料請求失敗：HTTP ${payload.status}`);
  }
  return payload.data;
}

function toStockOhlcvRow(row: FinMindStockRow): OhlcvRow | null {
  return buildOhlcvRow(row.date, row.open, row.max, row.min, row.close, row.Trading_Volume);
}

function toIndexOhlcvRow(row: FinMindIndexRow): OhlcvRow | null {
  return buildOhlcvRow(row.date, row.price, row.price, row.price, row.price, 0);
}

function buildOhlcvRow(
  date: string,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
): OhlcvRow | null {
  if (!date || [open, high, low, close, volume].some((value) => !Number.isFinite(value))) return null;
  return { date, open, high, low, close, volume };
}

function dateRange(options: FetchFinMindOptions): { startDate: string; endDate: string } {
  if (options.startDate && options.endDate) return { startDate: options.startDate, endDate: options.endDate };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - LOOKBACK_MONTHS, now.getUTCDate()));
  return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isOhlcvRow(row: OhlcvRow | null): row is OhlcvRow {
  return row !== null;
}

function byDate(a: OhlcvRow, b: OhlcvRow): number {
  return a.date.localeCompare(b.date);
}
