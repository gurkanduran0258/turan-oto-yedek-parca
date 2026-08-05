'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type ProductRow = {
  productCode: string;
  name: string;
  category: string;
  purchasePrice: number;
  profitMargin: number;
  vatRate: number;
  salePrice: number;
  stock: number;
};

const normalize = (value: unknown) => String(value ?? '').trim();
const num = (value: unknown) => {
  if (typeof value === 'number') return value;
  const text = normalize(value).replace('%', '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const get = (row: Record<string, unknown>, names: string[]) => {
  const found = Object.keys(row).find((key) => names.some((name) => key.toLocaleLowerCase('tr-TR').includes(name)));
  return found ? row[found] : undefined;
};

export default function ExcelYuklePage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const invalidCount = useMemo(() => rows.filter((r) => !r.productCode || !r.name || r.salePrice <= 0).length, [rows]);

  async function readFile(file: File) {
    setMessage('');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    const parsed = source.map((row) => {
      const purchasePrice = num(get(row, ['alış', 'alis', 'purchase']));
      const profitMargin = num(get(row, ['kar marj', 'kâr marj', 'profit']));
      const vatRate = num(get(row, ['kdv', 'vat'])) || 20;
      const importedSale = num(get(row, ['satış rakamı kdv dahil', 'satış fiyatı kdv dahil', 'sale price']));
      const calculatedSale = purchasePrice * (1 + profitMargin / 100) * (1 + vatRate / 100);

      return {
        productCode: normalize(get(row, ['ürün kodu', 'urun kodu', 'product code', 'oem'])),
        name: normalize(get(row, ['parça adı', 'parca adi', 'ürün adı', 'urun adi', 'name'])),
        category: normalize(get(row, ['ürün grubu', 'urun grubu', 'kategori', 'category'])) || 'Diğer',
        purchasePrice,
        profitMargin,
        vatRate,
        salePrice: Number((importedSale || calculatedSale).toFixed(2)),
        stock: num(get(row, ['stok', 'stock'])),
      };
    }).filter((row) => row.productCode || row.name);

    setRows(parsed);
  }

  async function upload() {
    if (!rows.length || invalidCount) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Yükleme başarısız.');
      setMessage(`${result.count} ürün başarıyla eklendi veya güncellendi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Yükleme başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="formCard" style={{ maxWidth: 1200, margin: '32px auto' }}>
      <h1>Excel’den Ürün Yükle</h1>
      <p>Ürün kodu aynıysa kayıt güncellenir, yoksa yeni ürün oluşturulur.</p>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
      {rows.length > 0 && (
        <>
          <div className="infoBox" style={{ marginTop: 20 }}>
            <b>{rows.length} satır okundu</b>
            <p>{invalidCount ? `${invalidCount} hatalı satır var.` : 'Dosya yüklemeye hazır.'}</p>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th>Kod</th><th>Parça</th><th>Grup</th><th>Alış</th><th>Kar</th><th>KDV</th><th>Satış</th><th>Stok</th></tr></thead>
              <tbody>{rows.slice(0, 50).map((row, i) => (
                <tr key={`${row.productCode}-${i}`} style={{ borderTop: '1px solid #ddd' }}>
                  <td>{row.productCode}</td><td>{row.name}</td><td>{row.category}</td>
                  <td>{row.purchasePrice.toLocaleString('tr-TR')} TL</td><td>%{row.profitMargin}</td><td>%{row.vatRate}</td>
                  <td><b>{row.salePrice.toLocaleString('tr-TR')} TL</b></td><td>{row.stock}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button type="button" disabled={loading || invalidCount > 0} onClick={upload} style={{ marginTop: 20 }}>
            {loading ? 'Yükleniyor…' : 'Onayla ve Siteye Aktar'}
          </button>
        </>
      )}
      {message && <div className="infoBox" style={{ marginTop: 20 }}><b>{message}</b></div>}
    </main>
  );
}
