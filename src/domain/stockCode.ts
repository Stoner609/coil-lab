export function normalizeStockCode(stockCode: string): string {
  const normalized = stockCode.trim().toUpperCase().replace(/\.(TW|TWO)$/, '');
  if (!/^[0-9A-Z]{4,6}$/.test(normalized)) throw new Error('請輸入有效股票代號，例如 2330。');
  return normalized;
}
