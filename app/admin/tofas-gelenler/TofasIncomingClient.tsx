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
  v == null
    ? "-"
    : Number(v).toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " ₺";

export default function TofasIncomingClient({
  initialRows,
  initialPendingSyncIds,
}: {
  initialRows: any[];
  initialPendingSyncIds: number[];
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(
    new Set(initialPendingSyncIds)
  );

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");

    return initialRows.filter((r) => {
      const queryOk =
        !q ||
        String(r.product_code || "")
          .toLocaleLowerCase("tr-TR")
          .includes(q) ||
        String(r.product_name || "")
          .toLocaleLowerCase("tr-TR")
          .includes(q);

      const statusOk = status === "all" || r.status === status;

      return queryOk && statusOk;
    });
  }, [initialRows, query, status]);

  const pendingCount = initialRows.filter((x) => x.status === "pending").length;
  const publishedCount = initialRows.filter((x) => x.status === "published").length;
  const rejectedCount = initialRows.filter((x) => x.status === "rejected").length;

  async function requestPriceSync(id: number) {
    setSyncingIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(
        `/api/admin/tofas-gelenler/${id}/sync-price`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fiyat güncelleme isteği oluşturulamadı.");
      }

      alert("TOFAŞ fiyat güncelleme kuyruğuna alındı.");
    } catch (error) {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      alert(error instanceof Error ? error.message : "Hata");
    }
  }

  return (
    <div style={{ padding: 26 }}>
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        gap:16,
        alignItems:"end"
      }}>
        <div>
          <small style={{ color:"#c90020", fontWeight:900 }}>TOFAŞ BOS</small>
          <h1 style={{ margin:"4px 0" }}>TOFAŞ'tan Gelen Ürünler</h1>
          <p style={{ margin:0, color:"#64748b" }}>
            Yeni parçaları kontrol et, fiyatı güncelle ve siteye yayınla.
          </p>
        </div>

        <button
          onClick={() => router.refresh()}
          style={{
            background:"#0f172a",
            color:"#fff",
            border:0,
            padding:"10px 14px",
            borderRadius:8,
            fontWeight:800
          }}
        >
          Listeyi Yenile
        </button>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:10,
        marginTop:16
      }}>
        <Stat title="Onay Bekleyen" value={pendingCount} />
        <Stat title="Yayınlanan" value={publishedCount} />
        <Stat title="Reddedilen" value={rejectedCount} />
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 190px",
        gap:8,
        marginTop:14
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="OEM veya ürün adı ara..."
          style={inputStyle}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
        >
          <option value="pending">Onay Bekleyen</option>
          <option value="published">Yayınlanan</option>
          <option value="rejected">Reddedilen</option>
          <option value="all">Tümü</option>
        </select>
      </div>

      <div style={{
        marginTop:12,
        background:"#fff",
        border:"1px solid #e2e8f0",
        borderRadius:12,
        overflow:"auto"
      }}>
        <table style={{
          width:"100%",
          minWidth:1550,
          borderCollapse:"collapse",
          fontSize:13
        }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              <Th>OEM</Th>
              <Th>Ürün</Th>
              <Th>Liste KDV'li</Th>
              <Th>Servis</Th>
              <Th>Ana Bayi</Th>
              <Th>Ort. Maliyet</Th>
              <Th>Son Alış</Th>
              <Th>Kategori</Th>
              <Th>Stok</Th>
              <Th>Site Fiyatı</Th>
              <Th>İşlem</Th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <CompactRow
                key={row.id}
                row={row}
                busy={busyId === row.id}
                syncing={syncingIds.has(row.id)}
                setBusyId={setBusyId}
                onPriceSync={requestPriceSync}
                router={router}
              />
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={11} style={{
                  padding:35,
                  textAlign:"center",
                  color:"#64748b"
                }}>
                  Bu filtrede ürün bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompactRow({
  row,
  busy,
  syncing,
  setBusyId,
  onPriceSync,
  router,
}: any) {
  const [category, setCategory] = useState(row.selected_category || "");
  const [stock, setStock] = useState(Number(row.selected_stock || 0));
  const [salePrice, setSalePrice] = useState(
    Number(row.selected_sale_price ?? row.tofas_list_price_vat ?? 0)
  );

  async function publish() {
    if (!category) return alert("Kategori seç.");
    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      return alert("Satış fiyatını kontrol et.");
    }

    setBusyId(row.id);

    try {
      const response = await fetch(
        `/api/admin/tofas-gelenler/${row.id}/publish`,
        {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            category,
            stock,
            salePrice
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Yayınlanamadı.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    if (!confirm("Ürün reddedilsin mi?")) return;

    setBusyId(row.id);

    try {
      const response = await fetch(
        `/api/admin/tofas-gelenler/${row.id}/reject`,
        { method:"POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Reddedilemedi.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <tr style={{ borderTop:"1px solid #eef2f7" }}>
      <Td><b>{row.product_code}</b></Td>

      <Td>
        <div style={{
          maxWidth:300,
          fontWeight:700,
          whiteSpace:"normal"
        }}>
          {row.product_name}
        </div>
      </Td>

      <Td><b>{money(row.tofas_list_price_vat)}</b></Td>
      <Td>{money(row.tofas_service_price_vat)}</Td>
      <Td>{money(row.tofas_main_dealer_price_vat)}</Td>
      <Td>{money(row.tofas_average_cost)}</Td>
      <Td>{money(row.tofas_last_purchase_price)}</Td>

      <Td>
        {row.status === "pending" ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...smallInput, minWidth:130 }}
          >
            <option value="">Kategori seç</option>
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ) : (
          row.selected_category || "-"
        )}
      </Td>

      <Td>
        {row.status === "pending" ? (
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) =>
              setStock(Math.max(0, Number(e.target.value || 0)))
            }
            style={{ ...smallInput, width:70 }}
          />
        ) : (
          row.selected_stock
        )}
      </Td>

      <Td>
        {row.status === "pending" ? (
          <input
            type="number"
            step="0.01"
            value={salePrice}
            onChange={(e) =>
              setSalePrice(Number(e.target.value || 0))
            }
            style={{ ...smallInput, width:105 }}
          />
        ) : (
          money(row.selected_sale_price)
        )}
      </Td>

      <Td>
        {row.status === "pending" ? (
          <div style={{
            display:"flex",
            gap:5,
            flexWrap:"wrap",
            minWidth:250
          }}>
            <button
              disabled={syncing}
              onClick={() => void onPriceSync(row.id)}
              style={{
                ...buttonBase,
                background:"#1d4ed8",
                color:"#fff"
              }}
            >
              {syncing ? "Kuyrukta" : "TOFAŞ'tan Fiyat Güncelle"}
            </button>

            <button
              disabled={busy}
              onClick={() => void publish()}
              style={{
                ...buttonBase,
                background:"#c90020",
                color:"#fff"
              }}
            >
              Yayınla
            </button>

            <button
              disabled={busy}
              onClick={() => void reject()}
              style={buttonBase}
            >
              Reddet
            </button>
          </div>
        ) : (
          <b>{row.status === "published" ? "Yayınlandı" : "Reddedildi"}</b>
        )}
      </Td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      textAlign:"left",
      padding:"11px 10px",
      color:"#475569",
      fontSize:12,
      whiteSpace:"nowrap"
    }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{
      padding:"9px 10px",
      verticalAlign:"middle",
      whiteSpace:"nowrap"
    }}>
      {children}
    </td>
  );
}

function Stat({ title, value }: { title:string; value:number }) {
  return (
    <div style={{
      background:"#fff",
      border:"1px solid #e2e8f0",
      borderRadius:10,
      padding:"12px 14px"
    }}>
      <small style={{ color:"#64748b", fontWeight:800 }}>{title}</small>
      <b style={{ display:"block", fontSize:22, marginTop:3 }}>{value}</b>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border:"1px solid #cbd5e1",
  borderRadius:8,
  padding:"10px 12px",
  background:"#fff"
};

const smallInput: React.CSSProperties = {
  border:"1px solid #cbd5e1",
  borderRadius:7,
  padding:"7px 8px",
  background:"#fff"
};

const buttonBase: React.CSSProperties = {
  border:"1px solid #cbd5e1",
  borderRadius:7,
  padding:"7px 9px",
  fontWeight:800,
  cursor:"pointer",
  fontSize:12
};
