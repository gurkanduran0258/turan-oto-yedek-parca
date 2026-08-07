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
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  created_at: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/giris");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            order_no,
            status,
            subtotal,
            shipping,
            total,
            payment_method,
            created_at
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        setOrders((data || []) as Order[]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Siparişler yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
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
            background: "#ffffff",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            Siparişlerim
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: 0,
            }}
          >
            Geçmiş ve devam eden siparişlerinizi görüntüleyin.
          </p>

          {error ? (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                padding: "35px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Siparişler yükleniyor...
            </div>
          ) : null}

          {!loading && !error && orders.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "22px",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(220px,1.5fr) minmax(120px,.8fr) minmax(140px,.8fr) auto",
                    alignItems: "center",
                    gap: "18px",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    background: "#ffffff",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "15px",
                      }}
                    >
                      #{order.order_no}
                    </strong>

                    <small
                      style={{
                        display: "block",
                        marginTop: "5px",
                        color: "#64748b",
                      }}
                    >
                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                    </small>

                    {order.payment_method ? (
                      <small
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: "#94a3b8",
                        }}
                      >
                        {order.payment_method}
                      </small>
                    ) : null}
                  </div>

                  <span
                    style={{
                      width: "fit-content",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background:
                        order.status === "Ödendi"
                          ? "#fef3c7"
                          : order.status === "Tamamlandı"
                            ? "#dcfce7"
                            : "#f1f5f9",
                      color:
                        order.status === "Ödendi"
                          ? "#92400e"
                          : order.status === "Tamamlandı"
                            ? "#166534"
                            : "#334155",
                      fontWeight: 800,
                      fontSize: "12px",
                    }}
                  >
                    {order.status}
                  </span>

                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {formatMoney(order.total)} TL
                  </strong>

                  <Link
                    href={`/hesabim/siparisler/${order.id}`}
                    style={{
                      color: "#c90020",
                      fontWeight: 800,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Detay ›
                  </Link>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && orders.length === 0 ? (
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
                Henüz siparişiniz bulunmuyor.
              </strong>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                İlk siparişinizi verdiğinizde burada görünecek.
              </p>

              <Link
                href="/urunler"
                className="primary"
              >
                ALIŞVERİŞE BAŞLA
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
