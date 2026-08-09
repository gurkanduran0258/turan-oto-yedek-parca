"use client";

import { useEffect, useMemo, useState } from "react";

type AnyRow = Record<string, any>;

export default function VehicleHistoryClient() {
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState<AnyRow | null>(null);
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(q = query) {
    const value = q.trim();
    if (!value) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/admin/vehicle-history?q=${encodeURIComponent(value)}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Araç geçmişi okunamadı.");

      setVehicle(json.vehicle || null);

      if (!json.vehicle) {
        setMessage("Bu araç daha önce çekilmemiş. TOFAŞ'tan Sorgula butonunu kullan.");
      }
    } catch (e: any) {
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function syncTofas() {
    const value = query.trim();

    if (!value) {
      setMessage("Plaka, şase veya motor numarası gir.");
      return;
    }

    setLoading(true);
    setStatus("pending");
    setMessage("TOFAŞ sorgusu kuyruğa alınıyor...");

    try {
      const res = await fetch("/api/admin/vehicle-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sorgu oluşturulamadı.");

      setRequestId(json.request.id);
      setMessage("Yerel TOFAŞ servisi sorguluyor...");
    } catch (e: any) {
      setMessage(e.message || String(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!requestId) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/vehicle-history?requestId=${encodeURIComponent(requestId)}`,
          { cache: "no-store" }
        );

        const json = await res.json();
        const req = json.request;

        if (!req) return;

        setStatus(req.status || "");
        setMessage(req.message || "");

        if (req.status === "done") {
          clearInterval(timer);
          setLoading(false);
          setRequestId("");
          await load(query);
        }

        if (req.status === "error") {
          clearInterval(timer);
          setLoading(false);
          setRequestId("");
        }
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [requestId]);

  const items = useMemo(
    () => vehicle?.vehicle_history_items || [],
    [vehicle]
  );

  const requests = useMemo(
    () => vehicle?.vehicle_history_customer_requests || [],
    [vehicle]
  );

  const suggestions = useMemo(
    () => vehicle?.vehicle_history_service_suggestions || [],
    [vehicle]
  );

  return (
    <div style={{ padding: 28, minHeight: "100vh", background: "#f6f8fb" }}>
      <div style={{ color: "#c90020", fontWeight: 900, fontSize: 12 }}>
        SERVİS
      </div>

      <h1 style={{ margin: "4px 0 0", fontSize: 30 }}>
        Araç Geçmişi
      </h1>

      <p style={{ color: "#64748b", marginTop: 5 }}>
        TOFAŞ Araç Geçmişi ekranından servis geçmişi, müşteri istekleri ve servis önerileri.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px,1fr) 120px 190px",
          gap: 10,
          marginTop: 18,
          padding: 12,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="Plaka, şase veya motor numarası..."
          style={inputStyle}
        />

        <button onClick={() => load()} style={darkButton}>
          Ara
        </button>

        <button onClick={syncTofas} disabled={loading} style={redButton}>
          {loading ? "Sorgulanıyor..." : "TOFAŞ'tan Sorgula"}
        </button>
      </div>

      {message ? (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 9,
            background:
              status === "error"
                ? "#fee2e2"
                : status === "done"
                ? "#dcfce7"
                : "#eff6ff",
            color:
              status === "error"
                ? "#991b1b"
                : status === "done"
                ? "#166534"
                : "#1e40af",
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      ) : null}

      {!vehicle ? null : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            <Box title="Araç Bilgileri">
              <Line k="Plaka" v={vehicle.plate} />
              <Line k="Şase" v={vehicle.vin} />
              <Line k="Motor No" v={vehicle.engine_no} />
              <Line k="Ünite No" v={vehicle.unit_no} />
              <Line k="Model / Yıl" v={`${vehicle.model_code || "-"} / ${vehicle.model_year || "-"}`} />
              <Line k="Versiyon" v={vehicle.version_name} />
              <Line k="MVS" v={[vehicle.model_code, vehicle.version_code, vehicle.series_code].filter(Boolean).join(" / ")} />
              <Line k="Renk" v={`${vehicle.color_code || "-"} ${vehicle.color_name || ""}`} />
              <Line k="Ruhsat Tarihi" v={vehicle.registration_date} />
              <Line k="Satıcı Bayi" v={`${vehicle.selling_dealer || "-"} ${vehicle.selling_dealer_name || ""}`} />
            </Box>

            <Box title="Müşteri Bilgileri">
              <Line k="Müşteri Kodu" v={vehicle.customer_code} />
              <Line k="Müşteri" v={vehicle.customer_name} />
              <Line k="Adres" v={[vehicle.customer_address1, vehicle.customer_address2].filter(Boolean).join(" ")} />
              <Line k="Cep" v={vehicle.mobile_phone} />
              <Line k="Ev" v={vehicle.home_phone} />
              <Line k="İş" v={vehicle.work_phone} />
              <Line
                k="TOFAŞ Son Okuma"
                v={
                  vehicle.tofas_last_sync_at
                    ? new Date(vehicle.tofas_last_sync_at).toLocaleString("tr-TR")
                    : "-"
                }
              />
            </Box>
          </div>

          <SectionTitle
            title="Servis Geçmişi"
            count={items.length}
          />

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Servis</Th>
                  <Th>İşçilik / Parça Kodu</Th>
                  <Th>Açıklama</Th>
                  <Th>Birim</Th>
                  <Th>Miktar</Th>
                  <Th>KM</Th>
                  <Th>İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((x: AnyRow) => (
                  <tr key={x.id}>
                    <Td>{x.service_date || "-"}</Td>
                    <Td>{x.service_name || "-"}</Td>
                    <Td><b>{x.code || "-"}</b></Td>
                    <Td>{x.description || "-"}</Td>
                    <Td>{x.unit || "-"}</Td>
                    <Td>{fmtQty(x.quantity)}</Td>
                    <Td>{fmtInt(x.mileage)}</Td>
                    <Td>{x.operation || "-"}</Td>
                  </tr>
                ))}

                {!items.length ? (
                  <tr>
                    <Td colSpan={8}>Servis geçmişi bulunamadı.</Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <SectionTitle
            title="Müşteri İstekleri"
            count={requests.length}
          />

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Servis</Th>
                  <Th>İstek</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((x: AnyRow) => (
                  <tr key={x.id}>
                    <Td>{x.request_date || "-"}</Td>
                    <Td>{x.service_name || "-"}</Td>
                    <Td>{x.request_text || "-"}</Td>
                  </tr>
                ))}

                {!requests.length ? (
                  <tr>
                    <Td colSpan={3}>Müşteri isteği bulunamadı.</Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <SectionTitle
            title="Servis Önerileri"
            count={suggestions.length}
          />

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Servis</Th>
                  <Th>Öneri</Th>
                  <Th>Durum</Th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((x: AnyRow) => (
                  <tr key={x.id}>
                    <Td>{x.suggestion_date || "-"}</Td>
                    <Td>{x.service_name || "-"}</Td>
                    <Td>{x.suggestion_text || "-"}</Td>
                    <Td>{x.status || "-"}</Td>
                  </tr>
                ))}

                {!suggestions.length ? (
                  <tr>
                    <Td colSpan={4}>Servis önerisi bulunamadı.</Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <b>{title}</b>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: any }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 15,
        padding: "5px 0",
        borderBottom: "1px solid #f1f5f9",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#64748b" }}>{k}</span>
      <b style={{ textAlign: "right" }}>{v || "-"}</b>
    </div>
  );
}

function SectionTitle({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 22,
        marginBottom: 8,
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      <span
        style={{
          background: "#0f172a",
          color: "#fff",
          borderRadius: 999,
          padding: "5px 10px",
          fontWeight: 900,
          fontSize: 12,
        }}
      >
        {count} kayıt
      </span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 9,
        background: "#e9eef5",
        borderBottom: "1px solid #d5deea",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: 9,
        borderBottom: "1px solid #edf2f7",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function fmtQty(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString("tr-TR", {
    maximumFractionDigits: 3,
  });
}

function fmtInt(v: any) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || !n) return "-";
  return n.toLocaleString("tr-TR");
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  padding: "10px 12px",
  outline: "none",
  fontSize: 14,
};

const darkButton: React.CSSProperties = {
  border: 0,
  borderRadius: 9,
  background: "#0f172a",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const redButton: React.CSSProperties = {
  border: 0,
  borderRadius: 9,
  background: "#c90020",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  minWidth: 900,
};
