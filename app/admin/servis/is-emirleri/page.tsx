import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkOrdersPage() {
  const supabase = getSupabaseAdmin();

  const { data: orders, error } = await supabase
    .from("service_work_orders")
    .select(`
      *,
      service_work_order_parts(*),
      service_work_order_labor(*)
    `)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return <div style={{ padding: 28, color: "#991b1b" }}>{error.message}</div>;
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ color: "#c90020", fontWeight: 900, fontSize: 12 }}>
        SERVİS
      </div>
      <h1 style={{ margin: "4px 0" }}>İş Emirleri</h1>
      <p style={{ color: "#64748b" }}>
        TOFAŞ'tan okunan araç, müşteri, yedek parça ve işçilik bilgileri.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        {(orders || []).map((wo: any) => (
          <details
            key={wo.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "170px 110px 150px 1fr 150px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <b>{wo.work_order_no}</b>
              <b>{wo.plate || "-"}</b>
              <span>{wo.vin || "-"}</span>
              <span>{wo.vehicle_description || wo.customer_name || "-"}</span>
              <b>{money(wo.grand_total)}</b>
            </summary>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
                marginTop: 14,
              }}
            >
              <Box title="Araç">
                <Line k="Plaka" v={wo.plate} />
                <Line k="Şase" v={wo.vin} />
                <Line k="Motor No" v={wo.engine_no} />
                <Line k="Ünite No" v={wo.unit_no} />
                <Line k="Model/Yıl" v={wo.model_year} />
                <Line k="Araç" v={wo.vehicle_description} />
                <Line k="Renk" v={wo.color} />
                <Line k="KM" v={wo.mileage} />
              </Box>

              <Box title="Müşteri / Servis">
                <Line k="Müşteri" v={wo.customer_name} />
                <Line k="Müşteri Kodu" v={wo.customer_code} />
                <Line k="Telefon" v={wo.customer_phone} />
                <Line k="Danışman" v={wo.advisor_name} />
                <Line k="Teslim Eden" v={wo.delivery_person} />
                <Line k="İKK Türü" v={wo.ikk_type} />
                <Line k="İKK Sınıfı" v={wo.ikk_class} />
                <Line k="Kabul" v={wo.acceptance_status} />
              </Box>

              <Box title="Tutarlar">
                <Line k="Parça" v={money(wo.parts_subtotal)} />
                <Line k="İşçilik" v={money(wo.labor_subtotal)} />
                <Line k="İskonto" v={money(wo.discount_total)} />
                <Line k="KDV" v={money(wo.vat_total)} />
                <Line k="Genel Toplam" v={money(wo.grand_total)} />
                <Line
                  k="TOFAŞ Son Okuma"
                  v={wo.tofas_last_sync_at
                    ? new Date(wo.tofas_last_sync_at).toLocaleString("tr-TR")
                    : "-"}
                />
              </Box>
            </div>

            {wo.customer_request && (
              <div
                style={{
                  marginTop: 12,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 9,
                  padding: 11,
                }}
              >
                <b>Müşteri İsteği:</b> {wo.customer_request}
              </div>
            )}

            <h3>Yedek Parçalar</h3>
            <table style={table}>
              <thead>
                <tr>
                  <Th>İş Satırı</Th>
                  <Th>OEM</Th>
                  <Th>Parça</Th>
                  <Th>Adet</Th>
                  <Th>Birim</Th>
                  <Th>İsk.</Th>
                  <Th>KDV</Th>
                  <Th>Toplam</Th>
                </tr>
              </thead>
              <tbody>
                {(wo.service_work_order_parts || []).map((p: any) => (
                  <tr key={p.id}>
                    <Td>{p.labor_code || "-"}</Td>
                    <Td>{p.product_code || "-"}</Td>
                    <Td>{p.description}</Td>
                    <Td>{p.quantity}</Td>
                    <Td>{money(p.unit_price)}</Td>
                    <Td>%{p.discount_rate}</Td>
                    <Td>%{p.vat_rate}</Td>
                    <Td>{money(p.line_total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>İşçilikler</h3>
            <table style={table}>
              <thead>
                <tr>
                  <Th>İş Satırı</Th>
                  <Th>Kod</Th>
                  <Th>İşçilik</Th>
                  <Th>Saat/Adet</Th>
                  <Th>Birim</Th>
                  <Th>İsk.</Th>
                  <Th>KDV</Th>
                  <Th>Toplam</Th>
                </tr>
              </thead>
              <tbody>
                {(wo.service_work_order_labor || []).map((p: any) => (
                  <tr key={p.id}>
                    <Td>{p.row_ref || "-"}</Td>
                    <Td>{p.labor_code || "-"}</Td>
                    <Td>{p.description}</Td>
                    <Td>{p.quantity}</Td>
                    <Td>{money(p.unit_price)}</Td>
                    <Td>%{p.discount_rate}</Td>
                    <Td>%{p.vat_rate}</Td>
                    <Td>{money(p.line_total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}

        {!orders?.length && (
          <div
            style={{
              background: "#fff",
              padding: 30,
              borderRadius: 12,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Henüz TOFAŞ'tan aktarılmış iş emri yok.
          </div>
        )}
      </div>
    </div>
  );
}

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 8,
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>
      {children}
    </td>
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
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
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
        padding: "4px 0",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#64748b" }}>{k}</span>
      <b>{v ?? "-"}</b>
    </div>
  );
}
function money(v: any) {
  return (
    Number(v || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}
