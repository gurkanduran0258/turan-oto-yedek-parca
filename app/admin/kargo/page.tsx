import { getSupabaseAdmin } from "@/lib/supabase-admin";
import KargoManager from "./KargoManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_no,status,shipping_company,tracking_number,address_snapshot,created_at"
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  return (
    <div style={{ padding: 34 }}>
      <h1>Kargo Yönetimi</h1>

      <p style={{ color: "#64748b" }}>
        Kargo firması ve takip numarası gir.
      </p>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {(data || []).map((order: any) => (
          <div
            key={order.id}
            style={{
              background: "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 11,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <b>
                #{order.order_no}
              </b>

              <span>
                {order.status}
              </span>
            </div>

            <KargoManager
              id={order.id}
              company={
                order.shipping_company
              }
              tracking={
                order.tracking_number
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
