import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import OrderStatusSelect from "./OrderStatusSelect";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const money = (value: number) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return (
    <div style={{ padding: 34 }}>
      <h1>Sipariş Takibi</h1>
      <p style={{ color: "#64748b" }}>
        Tüm siparişleri görüntüle ve durumlarını güncelle.
      </p>

      {error ? (
        <div>{error.message}</div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1000,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Müşteri</th>
                <th>Ödeme</th>
                <th>Toplam</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {(data || []).map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <b>#{order.order_no}</b>
                    <small>
                      {new Date(
                        order.created_at
                      ).toLocaleString("tr-TR")}
                    </small>
                  </td>

                  <td>
                    {[
                      order.address_snapshot?.first_name,
                      order.address_snapshot?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </td>

                  <td>
                    {order.payment_method || "-"}
                  </td>

                  <td>
                    <b>
                      {money(order.total)} TL
                    </b>
                  </td>

                  <td>
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </td>

                  <td>
                    <Link
                      href={`/admin/siparisler/${order.id}`}
                      style={{
                        color: "#c90020",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      Detay →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
