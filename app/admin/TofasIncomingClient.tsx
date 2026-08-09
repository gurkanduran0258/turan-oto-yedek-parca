"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  "Motor",
  "Fren",
  "Elektrik",
  "Kaporta",
  "Süspansiyon",
  "Filtre",
  "Yağ",
  "Şanzıman",
];

const money = (v: any) =>
  v == null ? "-" : Number(v).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " TL";

export default function TofasIncomingClient({ initialRows }: { initialRows: any[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [busyId, setBusyId] = useState<number | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");

    return initialRows.filter((r) => {
      const qOk =
        !q ||
        String(r.product_code || "").toLocaleLowerCase("tr-TR").includes(q) ||
        String(r.product_name || "").toLocaleLowerCase("tr-TR").includes(q);

      const sOk = status === "all" || r.status === status;
      return qOk && sOk;
    });
  }, [initialRows, query, status]);

  async function publish(id: number, category: string, stock: number, salePrice: number) {
    if (!category) return alert("Kategori seç.");
    if (!Number.isFinite(salePrice) || salePrice <= 0) return alert("Satış fiyatını kontrol et.");

    setBusyId(id);

    try {
      const r = await fetch(`/api/admin/tofas-gelenler/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, stock, salePrice }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Yayınlanamadı.");

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: number) {
    if (!confirm("Bu TOFAŞ ürünü reddedilsin mi?")) return;

    setBusyId(id);

    try {
      const r = await fetch(`/api/admin/tofas-gelenler/${id}/reject`, {
        method: "POST",
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Reddedilemedi.");

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = initialRows.filter((x) => x.status === "pending").length;
  const publishedCount = initialRows.filter((x) => x.status === "published").length;
  const rejectedCount = initialRows.filter((x) => x.status === "rejected").length;

  return (
    <div style={{ padding: 34 }}>
      <div>
        <small style={{ color: "#c90020", fontWeight: 900 }}>TOFAŞ BOS</small>
        <h1 style={{ margin: "5px 0" }}>TOFAŞ'tan Gelen Ürünler</h1>
        <p style={{ color: "#64748b", marginTop: 5 }}>
          Yeni parçaları kontrol et, kategori ve stok belirle, sonra siteye yayınla.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 20 }}>
        <Stat title="Onay Bekleyen" value={pendingCount} />
        <Stat title="Yayınlanan" value={publishedCount} />
        <Stat title="Reddedilen" value={rejectedCount} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, marginTop: 18 }}>
        <input
          placeholder="OEM veya ürün adı ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Onay Bekleyen</option>
          <option value="published">Yayınlanan</option>
          <option value="rejected">Reddedilen</option>
          <option value="all">Tümü</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {rows.map((row) => (
          <IncomingCard
            key={row.id}
            row={row}
            busy={busyId === row.id}
            onPublish={publish}
            onReject={reject}
          />
        ))}

        {!rows.length && (
          <div style={{ background: "#fff", padding: 35, borderRadius: 12, textAlign: "center", color: "#64748b" }}>
            Bu filtrede ürün bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}

function IncomingCard({
  row,
  busy,
  onPublish,
  onReject,
}: {
  row: any;
  busy: boolean;
  onPublish: (id: number, category: string, stock: number, salePrice: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}) {
  const [category, setCategory] = useState(row.selected_category || "");
  const [stock, setStock] = useState(Number(row.selected_stock || 0));
  const [salePrice, setSalePrice] = useState(
    Number(row.selected_sale_price ?? row.tofas_list_price_vat ?? 0)
  );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 17,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr", gap: 20 }}>
        <div>
          <small style={{ color: "#64748b" }}>OEM</small>
          <h2 style={{ margin: "3px 0 4px" }}>{row.product_code}</h2>
          <b>{row.product_name}</b>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 15 }}>
            <Price label="Liste KDV'li" value={row.tofas_list_price_vat} />
            <Price label="Yetkili Servis" value={row.tofas_service_price_vat} />
            <Price label="Yetkili Satıcı" value={row.tofas_dealer_price_vat} />
            <Price label="Ana Bayi" value={row.tofas_main_dealer_price_vat} />
            <Price label="Ort. Maliyet" value={row.tofas_average_cost} />
            <Price label="Son Alış" value={row.tofas_last_purchase_price} />
          </div>
        </div>

        <div>
          {row.status === "pending" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 180px", gap: 9 }}>
                <label>
                  <small>Kategori</small>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }}>
                    <option value="">Kategori seç</option>
                    {categories.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>

                <label>
                  <small>Stok</small>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, Number(e.target.value || 0)))}
                    style={{ width: "100%" }}
                  />
                </label>

                <label>
                  <small>Site Satış Fiyatı</small>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value || 0))}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  disabled={busy}
                  onClick={() => void onPublish(row.id, category, stock, salePrice)}
                  style={{
                    background: "#c90020",
                    color: "#fff",
                    border: 0,
                    padding: "11px 15px",
                    borderRadius: 8,
                    fontWeight: 900,
                  }}
                >
                  SİTEYE YAYINLA
                </button>

                <button disabled={busy} onClick={() => void onReject(row.id)}>
                  Reddet
                </button>
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 900 }}>
              Durum: {row.status === "published" ? "Yayınlandı" : "Reddedildi"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Price({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: "#f8fafc", padding: 9, borderRadius: 8 }}>
      <small style={{ color: "#64748b" }}>{label}</small>
      <b style={{ display: "block", marginTop: 3 }}>{money(value)}</b>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <small style={{ color: "#64748b", fontWeight: 800 }}>{title}</small>
      <b style={{ display: "block", fontSize: 26, marginTop: 5 }}>{value}</b>
    </div>
  );
}
