import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import OrderStatusSelect from "../OrderStatusSelect";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

const money = (value: number) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function Page({
  params,
}: Props) {
  const { id } = await params;

  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    notFound();
  }

  const supabase = getSupabaseAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id");

  return (
    <div style={{ padding: 34 }}>
      <Link href="/admin/siparisler">
        ← Siparişlere dön
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 15,
        }}
      >
        <div>
          <h1>#{order.order_no}</h1>
          <div>
            {new Date(
              order.created_at
            ).toLocaleString("tr-TR")}
          </div>
        </div>

        <OrderStatusSelect
          orderId={order.id}
          currentStatus={order.status}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.4fr .7fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        <div style={panel}>
          <h2>Ürünler</h2>

          {(items || []).map((item: any) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "60px 1fr auto auto",
                gap: 12,
                alignItems: "center",
                padding: 11,
                borderBottom:
                  "1px solid #eef2f7",
              }}
            >
              <img
                src={
                  item.image_url ||
                  "/opar-filtre-banner.png"
                }
                alt={item.product_name}
                style={{
                  width: 55,
                  height: 55,
                  objectFit: "contain",
                }}
              />

              <div>
                <b>
                  {item.product_name}
                </b>
                <small>
                  OEM: {item.product_code}
                </small>
              </div>

              <span>
                {item.quantity} adet
              </span>

              <b>
                {money(
                  item.line_total
                )}{" "}
                TL
              </b>
            </div>
          ))}
        </div>

        <aside style={panel}>
          <h2>Sipariş Bilgileri</h2>

          <p>
            Ödeme:{" "}
            <b>
              {order.payment_method ||
                "-"}
            </b>
          </p>

          <p>
            Toplam:{" "}
            <b>
              {money(
                order.total
              )}{" "}
              TL
            </b>
          </p>

          <p>
            Kargo:{" "}
            <b>
              {order.shipping_company ||
                "-"}
            </b>
          </p>

          <p>
            Takip No:{" "}
            <b>
              {order.tracking_number ||
                "-"}
            </b>
          </p>

          <p>
            Admin Notu:{" "}
            {order.admin_note ||
              "-"}
          </p>
        </aside>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 18,
};
