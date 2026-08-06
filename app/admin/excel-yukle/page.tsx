"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type ImportRow = {
  product_code: string;
  product_name: string;
  product_group: string;
  purchase_price: number;
  profit_margin: number;
  vat: number;
  sale_price: number;
  stock: number;
  image_url?: string;
};

type ImportResult = {
  success: boolean;
  product_code: string;
  product_name?: string;
  image_url?: string | null;
  image_source?: string | null;
  image_status?: string;
  error?: string;
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let text = String(value ?? "").trim();
  if (!text) return 0;

  text = text.replace(/[₺TL%\s]/gi, "");

  const hasComma = text.includes(",");
  const hasDot = text.includes(".");

  if (hasComma && hasDot) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (hasComma) {
    text = text.replace(",", ".");
  } else if (hasDot) {
    const parts = text.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      text = parts.join("");
    }
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findValue(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row);
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const [key, value] of entries) {
    const normalizedKey = normalizeHeader(key);
    if (normalizedAliases.includes(normalizedKey)) return value;
  }

  return undefined;
}

function mapExcelRow(row: Record<string, unknown>): ImportRow | null {
  const productCode = String(
    findValue(row, ["Ürün Kodu", "Urun Kodu", "product_code", "kod", "OEM"]) ?? ""
  ).trim();

  const productName = String(
    findValue(row, ["Parça Adı", "Parca Adi", "product_name", "Ürün Adı", "Urun Adi"]) ?? ""
  ).trim();

  if (!productCode || !productName) return null;

  const purchasePrice = parseNumber(
    findValue(row, ["Alış", "Alis", "Alış Fiyatı", "Alis Fiyati", "purchase_price"])
  );

  const profitMargin = parseNumber(
    findValue(row, ["Kar Marjı", "Kar Marji", "profit_margin"])
  );

  const vat = parseNumber(findValue(row, ["KDV", "KDV %", "vat"])) || 20;

  let salePrice = parseNumber(
    findValue(row, [
      "Satış Rakamı Kdv Dahil",
      "Satis Rakami Kdv Dahil",
      "Satış KDV Dahil",
      "Satis KDV Dahil",
      "Satış Fiyatı KDV Dahil",
      "Satis Fiyati KDV Dahil",
      "sale_price",
    ])
  );

  if (!salePrice && purchasePrice > 0) {
    salePrice =
      purchasePrice *
      (1 + profitMargin / 100) *
      (1 + vat / 100);
  }

  return {
    product_code: productCode,
    product_name: productName,
    product_group: String(
      findValue(row, ["Ürün Grubu", "Urun Grubu", "product_group", "Kategori"]) ?? "Diğer"
    ).trim() || "Diğer",
    purchase_price: Number(purchasePrice.toFixed(2)),
    profit_margin: Number(profitMargin.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    sale_price: Number(salePrice.toFixed(2)),
    stock: Math.max(
      0,
      Math.trunc(parseNumber(findValue(row, ["Stok", "stock", "Stok Adedi"])))
    ),
    image_url: String(
      findValue(row, ["image_url", "Görsel URL", "Gorsel URL", "Fotoğraf", "Fotograf"]) ?? ""
    ).trim() || undefined,
  };
}

export default function ExcelImportPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [message, setMessage] = useState("");

  const successCount = useMemo(
    () => results.filter((result) => result.success).length,
    [results]
  );

  const imageCount = useMemo(
    () => results.filter((result) => result.success && result.image_url).length,
    [results]
  );

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setResults([]);
    setCurrent(0);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) throw new Error("Excel sayfası bulunamadı.");

      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: true,
      });

      const mappedRows = rawRows
        .map(mapExcelRow)
        .filter((row): row is ImportRow => row !== null);

      if (!mappedRows.length) {
        throw new Error(
          "Geçerli ürün bulunamadı. Ürün Kodu ve Parça Adı sütunlarını kontrol et."
        );
      }

      setRows(mappedRows);
      setMessage(`${mappedRows.length} ürün yüklemeye hazır.`);
    } catch (error) {
      setRows([]);
      setMessage(
        error instanceof Error ? error.message : "Excel dosyası okunamadı."
      );
    } finally {
      event.target.value = "";
    }
  }

  async function startImport() {
    if (!rows.length || running) return;

    if (!adminPassword.trim()) {
      setMessage("Admin şifresini yaz.");
      return;
    }

    setRunning(true);
    setResults([]);
    setCurrent(0);
    setMessage("Ürünler ve fotoğraflar aktarılıyor...");

    const output: ImportResult[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      setCurrent(index + 1);

      try {
        const response = await fetch("/api/products/auto-import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(row),
        });

        const text = await response.text();
        let result: ImportResult;

        try {
          result = JSON.parse(text) as ImportResult;
        } catch {
          result = {
            success: false,
            product_code: row.product_code,
            error: text || `Sunucu hatası: ${response.status}`,
          };
        }

        if (!response.ok) {
          result.success = false;
          result.product_code ||= row.product_code;
        }

        output.push(result);
      } catch (error) {
        output.push({
          success: false,
          product_code: row.product_code,
          error: error instanceof Error ? error.message : "İstek başarısız.",
        });
      }

      setResults([...output]);

      // Arama servisinin hız sınırına takılmamak için kısa bekleme.
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    }

    setRunning(false);
    setMessage(
      `${output.filter((item) => item.success).length}/${rows.length} ürün işlendi.`
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <a href="/admin" style={styles.backLink}>
          ← Yönetim paneli
        </a>

        <h1 style={styles.title}>Excel’den Otomatik Ürün ve Fotoğraf Yükle</h1>

        <p style={styles.description}>
          Excel’i seç. Sistem her ürün kodunu Google Görseller’de arar, en uygun
          fotoğrafı Supabase Storage’a kopyalar ve ürünü ekler veya günceller.
        </p>

        <div style={styles.warning}>
          Fotoğraf eşleştirmesi otomatik olduğu için yükleme tamamlanınca ürün
          görsellerini yönetim panelinden hızlıca kontrol et.
        </div>

        <div style={styles.card}>
          <label style={styles.label}>
            Excel dosyası
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              disabled={running}
            />
          </label>

          <label style={styles.label}>
            Admin şifresi
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Vercel ADMIN_PASSWORD değeri"
              style={styles.input}
              disabled={running}
            />
          </label>

          <button
            type="button"
            onClick={startImport}
            disabled={!rows.length || running}
            style={{
              ...styles.button,
              opacity: !rows.length || running ? 0.55 : 1,
            }}
          >
            {running
              ? `İşleniyor ${current}/${rows.length}`
              : "Ürünleri ve Fotoğrafları Yükle"}
          </button>

          {fileName ? <p><b>Dosya:</b> {fileName}</p> : null}
          {message ? <p style={styles.message}>{message}</p> : null}

          {running || results.length ? (
            <div style={styles.progressOuter}>
              <div
                style={{
                  ...styles.progressInner,
                  width: `${
                    rows.length ? Math.round((current / rows.length) * 100) : 0
                  }%`,
                }}
              />
            </div>
          ) : null}
        </div>

        {results.length ? (
          <>
            <div style={styles.summary}>
              <div><b>{successCount}</b><span>Başarılı ürün</span></div>
              <div><b>{imageCount}</b><span>Fotoğraf bulundu</span></div>
              <div>
                <b>{results.length - successCount}</b>
                <span>Hatalı ürün</span>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Kod</th>
                    <th style={styles.th}>Durum</th>
                    <th style={styles.th}>Fotoğraf</th>
                    <th style={styles.th}>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={`${result.product_code}-${index}`}>
                      <td style={styles.td}><b>{result.product_code}</b></td>
                      <td style={styles.td}>
                        {result.success ? "✅ Aktarıldı" : "❌ Hata"}
                      </td>
                      <td style={styles.td}>
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt={result.product_code}
                            style={styles.thumb}
                          />
                        ) : (
                          "Bulunamadı"
                        )}
                      </td>
                      <td style={styles.td}>
                        {result.error || result.image_status || "Tamamlandı"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "70vh", padding: "36px 20px 70px", background: "#fff" },
  container: { maxWidth: "1180px", margin: "0 auto" },
  backLink: { color: "#0f172a", textDecoration: "none" },
  title: { marginTop: "28px", fontSize: "34px", color: "#0f172a" },
  description: { maxWidth: "850px", lineHeight: 1.65, color: "#475569" },
  warning: {
    margin: "18px 0",
    padding: "13px 15px",
    borderRadius: "9px",
    background: "#fff7ed",
    color: "#9a3412",
    fontWeight: 700,
  },
  card: {
    display: "grid",
    gap: "17px",
    padding: "24px",
    border: "1px solid #dbe3ec",
    borderRadius: "14px",
  },
  label: { display: "grid", gap: "8px", fontWeight: 700, color: "#1e293b" },
  input: {
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    maxWidth: "420px",
  },
  button: {
    width: "fit-content",
    padding: "13px 18px",
    border: 0,
    borderRadius: "8px",
    background: "#c81e1e",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  message: { fontWeight: 700, color: "#0f172a" },
  progressOuter: {
    height: "12px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    borderRadius: "999px",
    background: "#047857",
    transition: "width 250ms ease",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: "14px",
    margin: "22px 0",
  },
  tableWrap: { overflowX: "auto", border: "1px solid #dbe3ec", borderRadius: "12px" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "760px" },
  th: { padding: "12px", textAlign: "left", background: "#f8fafc" },
  td: { padding: "12px", borderTop: "1px solid #eef2f7", verticalAlign: "middle" },
  thumb: { width: "80px", height: "80px", objectFit: "contain", borderRadius: "7px" },
};
