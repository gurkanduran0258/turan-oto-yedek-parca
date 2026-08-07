"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AccountNav from "@/components/AccountNav";
import { supabase } from "@/lib/supabase-client";

type Order = {
  id: number;
  order_no: string;
  status: string;
  total: number;
  payment_method: string | null;
  created_at: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      const { data, error } =
        await supabase
          .from("orders")
          .select(
            `
              id,
              order_no,
              status,
              total,
              payment_method,
              created_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        setError(error.message);
      } else {
        setOrders(
          (data || []) as Order[]
        );
      }

      setLoading(false);
    }

    void loadOrders();
  }, [router]);

  return (
    <main
      className="container"
      style={{
        padding: "42px 0 70px",
      }}
    >
      <div style={layoutStyle}>
        <AccountNav />

        <section style={cardStyle}>
          <h1
            style={{
              marginTop: 0,
            }}
          >
            Siparişlerim
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Geçmiş ve devam eden
            siparişlerinizi görüntüleyin.
          </p>

          {error ? (
            <div style={errorStyle}>
              {error}
            </div>
          ) : null}

          {loading ? (
            <p>
              Siparişler yükleniyor...
            </p>
          ) : orders.length ? (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "22px",
              }}
            >
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/hesabim/siparisler/${order.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.5fr 1fr 1fr auto",
                    alignItems: "center",
                    gap: "15px",
                    padding: "16px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "9px",
                    textDecoration: "none",
                    color: "#0f172a",
                  }}
                >
                  <div>
                    <strong>
                      #{order.order_no}
                    </strong>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        marginTop: "5px",
                      }}
                    >
                      {new Date(
                        order.created_at
                      ).toLocaleDateString(
                        "tr-TR"
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      width: "fit-content",
                      padding: "5px 9px",
                      borderRadius: "999px",
                      background: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 800,
                      fontSize: "12px",
                    }}
                  >
                    {order.status}
                  </span>

                  <strong>
                    {formatMoney(
                      order.total
                    )}{" "}
                    TL
                  </strong>

                  <span
                    style={{
                      color: "#c90020",
                      fontWeight: 800,
                    }}
                  >
                    Detay ›
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "35px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "10px",
                marginTop: "20px",
              }}
            >
              <strong>
                Henüz siparişiniz
                bulunmuyor.
              </strong>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                İlk siparişinizi
                verdiğinizde burada
                görünecek.
              </p>

              <Link
                href="/urunler"
                className="primary"
              >
                ALIŞVERİŞE BAŞLA
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "240px minmax(0,1fr)",
  gap: "24px",
  alignItems: "start",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "28px",
  background: "#ffffff",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginTop: "15px",
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontWeight: 700,
};
