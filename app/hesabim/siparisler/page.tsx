"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AccountNav from "@/components/AccountNav";
import { supabase } from "@/lib/supabase-client";

type Order = {
  id: number;
  order_no: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  address_snapshot: {
    title?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    district?: string;
    neighborhood?: string | null;
    address_line?: string;
    postal_code?: string | null;
  } | null;
  created_at: string;
};

type OrderItem = {
  id: number;
  product_id: number | null;
  product_code: string | null;
  product_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

function money(value: number) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      const orderId = Number(params.id);

      if (!Number.isInteger(orderId) || orderId <= 0) {
        setError("Geçersiz sipariş numarası.");
        setLoading(false);
        return;
      }

      const { data: orderData, error: orderError } =
        await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .maybeSingle();

      if (orderError) {
        setError(orderError.message);
        setLoading(false);
        return;
      }

      if (!orderData) {
        setError("Sipariş bulunamadı.");
        setLoading(false);
        return;
      }

      setOrder(orderData as Order);

      const { data: itemData, error: itemError } =
        await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId)
          .order("id");

      if (itemError) {
        setError(itemError.message);
      } else {
        setItems((itemData || []) as OrderItem[]);
      }

      setLoading(false);
    }

    void load();
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="container" style={{ padding: "50px 0" }}>
        Sipariş yükleniyor...
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "42px 0 70px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0,1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <AccountNav />

        <section
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "28px",
            background: "#fff",
          }}
        >
          <Link
            href="/hesabim/siparisler"
            style={{
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            ← Siparişlerime dön
          </Link>

          {error ? (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : order ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  marginTop: "22px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1 style={{ marginBottom: "6px" }}>
                    Sipariş #{order.order_no}
                  </h1>

                  <span style={{ color: "#64748b" }}>
                    {new Date(order.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>

                <strong
                  style={{
                    color: "#b45309",
                    background: "#fef3c7",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    height: "fit-content",
                  }}
                >
                  {order.status}
                </strong>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "28px",
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "85px minmax(0,1fr) auto auto",
                      gap: "16px",
                      alignItems: "center",
                      border: "1px solid #e2e8f0",
                      borderRadius: "9px",
                      padding: "12px",
                    }}
                  >
                    <img
                      src={
                        item.image_url ||
                        "/opar-filtre-banner.png"
                      }
                      alt={item.product_name}
                      style={{
                        width: "78px",
                        height: "78px",
                        objectFit: "contain",
                      }}
                    />

                    <div>
                      <strong>{item.product_name}</strong>

                      <div
                        style={{
                          marginTop: "5px",
                          color: "#64748b",
                        }}
                      >
                        OEM: {item.product_code || "-"}
                      </div>
                    </div>

                    <span>{item.quantity} adet</span>

                    <strong>
                      {money(item.line_total)} TL
                    </strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  maxWidth: "380px",
                  marginLeft: "auto",
                  marginTop: "25px",
                  padding: "18px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <p style={rowStyle}>
                  <span>Ara Toplam</span>
                  <b>{money(order.subtotal)} TL</b>
                </p>

                <p style={rowStyle}>
                  <span>Kargo</span>
                  <b>
                    {Number(order.shipping) === 0
                      ? "Ücretsiz"
                      : `${money(order.shipping)} TL`}
                  </b>
                </p>

                <p
                  style={{
                    ...rowStyle,
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "12px",
                    fontSize: "18px",
                  }}
                >
                  <span>Toplam</span>
                  <b>{money(order.total)} TL</b>
                </p>
              </div>

              {order.address_snapshot ? (
                <div
                  style={{
                    marginTop: "25px",
                    padding: "18px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                  }}
                >
                  <strong>Teslimat Adresi</strong>

                  <p
                    style={{
                      color: "#475569",
                      lineHeight: 1.7,
                      marginBottom: 0,
                    }}
                  >
                    {order.address_snapshot.first_name}{" "}
                    {order.address_snapshot.last_name}
                    <br />

                    {order.address_snapshot.neighborhood
                      ? `${order.address_snapshot.neighborhood}, `
                      : ""}

                    {order.address_snapshot.address_line}
                    <br />

                    {order.address_snapshot.district} /{" "}
                    {order.address_snapshot.city}
                    <br />

                    {order.address_snapshot.phone}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
};
