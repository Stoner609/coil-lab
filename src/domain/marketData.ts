import type { OhlcvRow } from './types';

interface TwseResponse {
  stat: string;
  data?: string[][];
}

interface FetchTwseOptions {
  months?: string[];
  fetchImpl?: typeof fetch;
}

const TWSE_STOCK_DAY_PATH = '/twse/rwd/zh/afterTrading/STOCK_DAY';
const TWSE_TAIEX_PATH = '/twse/rwd/zh/TAIEX/MI_5MINS_HIST';

export async function fetchTwseStockRows(stockCode: string, options: FetchTwseOptions = {}): Promise<OhlcvRow[]> {
  const normalizedCode = normalizeStockCode(stockCode);
  const fetcher = options.fetchImpl ?? fetch;
  const months = options.months ?? recentMonthStarts(8);
  const rowsByDate = new Map<string, OhlcvRow>();

  for (const month of months) {
    const url = `${TWSE_STOCK_DAY_PATH}?date=${month}&stockNo=${normalizedCode}&response=json`;
    const response = await fetcher(url);
    if (!response.ok) {
      throw new Error(`TWSE 資料請求失敗：HTTP ${response.status}`);
    }

    const payload = (await response.json()) as TwseResponse;
    if (payload.stat !== 'OK' || !Array.isArray(payload.data)) {
      continue;
    }

    payload.data.map(parseTwseRow).filter(isOhlcvRow).forEach((row) => rowsByDate.set(row.date, row));
  }

  const rows = Array.from(rowsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) {
    throw new Error(`查無 ${normalizedCode} 的 TWSE 上市日成交資料。上櫃股票之後會接 TPEx。`);
  }

  return rows;
}

export async function fetchTwseIndexRows(options: FetchTwseOptions = {}): Promise<OhlcvRow[]> {
  const fetcher = options.fetchImpl ?? fetch;
  const months = options.months ?? recentMonthStarts(8);
  const rowsByDate = new Map<string, OhlcvRow>();

  for (const month of months) {
    const url = `${TWSE_TAIEX_PATH}?date=${month}&response=json`;
    const response = await fetcher(url);
    if (!response.ok) {
      throw new Error(`TWSE 加權指數資料請求失敗：HTTP ${response.status}`);
    }

    const payload = (await response.json()) as TwseResponse;
    if (payload.stat !== 'OK' || !Array.isArray(payload.data)) {
      continue;
    }

    payload.data.map(parseTwseIndexRow).filter(isOhlcvRow).forEach((row) => rowsByDate.set(row.date, row));
  }

  const rows = Array.from(rowsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) {
    throw new Error('查無 TWSE 加權指數資料，無法計算相對強度。');
  }

  return rows;
}

export function normalizeStockCode(stockCode: string): string {
  const normalized = stockCode.trim().toUpperCase().replace(/\.(TW|TWO)$/, '');
  if (!/^[0-9A-Z]{4,6}$/.test(normalized)) {
    throw new Error('請輸入有效股票代號，例如 2330。');
  }
  return normalized;
}

export function parseTwseDate(value: string): string {
  const [rocYear, month, day] = value.split('/').map(Number);
  if (!rocYear || !month || !day) {
    throw new Error(`TWSE 日期格式無法解析：${value}`);
  }

  const year = rocYear + 1911;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseTwseNumber(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();
  if (normalized === '' || normalized === '--') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTwseRow(row: string[]): OhlcvRow | null {
  const [dateValue, volumeValue, , openValue, highValue, lowValue, closeValue] = row;
  const open = parseTwseNumber(openValue);
  const high = parseTwseNumber(highValue);
  const low = parseTwseNumber(lowValue);
  const close = parseTwseNumber(closeValue);
  const volume = parseTwseNumber(volumeValue);

  if (open === null || high === null || low === null || close === null || volume === null) {
    return null;
  }

  return {
    date: parseTwseDate(dateValue),
    open,
    high,
    low,
    close,
    volume,
  };
}

function parseTwseIndexRow(row: string[]): OhlcvRow | null {
  const [dateValue, openValue, highValue, lowValue, closeValue] = row;
  const open = parseTwseNumber(openValue);
  const high = parseTwseNumber(highValue);
  const low = parseTwseNumber(lowValue);
  const close = parseTwseNumber(closeValue);

  if (open === null || high === null || low === null || close === null) {
    return null;
  }

  return {
    date: parseTwseDate(dateValue),
    open,
    high,
    low,
    close,
    volume: 0,
  };
}

function isOhlcvRow(row: OhlcvRow | null): row is OhlcvRow {
  return row !== null;
}

function recentMonthStarts(monthCount: number): string[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - index, 1));
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}01`;
  });
}
