import type { BuiltInSample } from '../domain/sampleData';

interface InputPanelProps {
  samples: BuiltInSample[];
  selectedSampleId: string;
  onSampleChange: (sampleId: string) => void;
  onCsvText: (fileName: string, text: string) => void;
  stockCode: string;
  onStockCodeChange: (value: string) => void;
  onStockCodeLookup: () => void;
  isLookupLoading: boolean;
}

export function InputPanel(props: InputPanelProps) {
  async function handleFile(file: File | undefined) {
    if (!file) return;
    props.onCsvText(file.name, await readFileText(file));
  }

  return (
    <section className="panel input-panel" aria-label="輸入資料">
      <div className="field">
        <label htmlFor="sample">內建樣本</label>
        <select id="sample" value={props.selectedSampleId} onChange={(event) => props.onSampleChange(event.target.value)}>
          {props.samples.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="csv">上傳 CSV</label>
        <input id="csv" type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event.currentTarget.files?.[0])} />
      </div>

      <div className="field">
        <label htmlFor="stock-code">股票代號</label>
        <div className="lookup-row">
          <input
            id="stock-code"
            value={props.stockCode}
            onChange={(event) => props.onStockCodeChange(event.target.value)}
            placeholder="例如 2330"
          />
          <button type="button" onClick={props.onStockCodeLookup} disabled={props.isLookupLoading}>
            {props.isLookupLoading ? '查詢中' : '查詢'}
          </button>
        </div>
        <small>目前支援 TWSE 上市股票日成交資料；上櫃 TPEx 後續加入。</small>
      </div>
    </section>
  );
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('CSV 檔案讀取失敗。'));
    reader.readAsText(file);
  });
}
