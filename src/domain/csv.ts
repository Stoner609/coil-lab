import Papa from 'papaparse';
import type { OhlcvRow } from './types';

interface CsvRecord {
  date?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

export function parseCsvText(text: string): Promise<OhlcvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRecord>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message));
          return;
        }

        resolve(
          result.data.map((row) => ({
            date: row.date ?? '',
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
          })),
        );
      },
      error: (error: Error) => reject(error),
    });
  });
}
