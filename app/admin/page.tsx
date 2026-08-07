import Link from "next/link";
import {
  ShoppingCart,
  CircleDollarSign,
  PackageCheck,
  TriangleAlert,
  ArrowUpRight,
  Boxes,
} from "lucide-react";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(value: number) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function AdminDashboard() {
  const supabase = getSupabaseAdmin();

  const [
    ordersResult,
    paidOrdersResult,
    productsResult,
    recentOrdersResult,
    lowStockResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total,status,created_at"),

    supabase
      .from("orders")
      .select("id,total,status")
      .in("status", [
        "Ödendi",
        "Hazırlanıyor",
        "Kargoda",
        "Tamamlandı",
      ]),

    supabase
      .from("products")
      .select("id,stock"),

    supabase
      .from("orders")
      .select(
        "id,order_no,status,total,payment_method,created_at,address_snapshot"
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(7),

    supabase
      .from("products")
      .select(
        "id,product_code,product_name,stock,image_url"
      )
      .lte("stock", 5)
      .order("stock", {
        ascending: true,
      })
      .limit(7),
  ]);

  const orders = ordersResult.data || [];
  const paidOrders = paidOrdersResult.data || [];
  const products = productsResult.data || [];
  const recentOrders = recentOrdersResult.data || [];
  const lowStockProducts = lowStockResult.data || [];

  const totalRevenue = paidOrders.reduce(
    (sum: number, order: any) =>
      sum + Number(order.total || 0),
    0
  );

  const today = new Date();

  const todaysOrders = orders.filter((order: any) => {
    const created = new Date(order.created_at);

    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  }).length;

  const outOfStock = products.filter(
    (product: any) =>
      Number(product.stock || 0) === 0
  ).length;

  return (
    <div
      style={{
        padding: "34px 34px 70px",
      }}
    >
      {/* ÜST BAŞLIK */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <small
            style={{
              color: "#64748b",
              fontWeight: 800,
              letterSpacing: ".08em",
            }}
          >
            TURAN OTO YEDEK PARÇA
          </small>

          <h1
            style={{
              margin: "5px 0 6px",
              fontSize: 32,
            }}
          >
            Yönetim Merkezi
          </h1>

          <p
            style={{
              color: "#64748b",
              margin: 0,
            }}
          >
            Sipariş, stok, ürün ve satış durumunu
            tek ekrandan takip edin.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <Link
            href="/admin/excel-yukle"
            style={secondaryButton}
          >
            Excel Yükle
          </Link>

          <Link
            href="/admin/urunler"
            style={primaryButton}
          >
            Ürün Yönetimi
          </Link>
        </div>
      </div>

      {/* İSTATİSTİKLER */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,minmax(0,1fr))",
          gap: 16,
        }}
      >
        <StatCard
          label="Toplam Sipariş"
          value={String(orders.length)}
          icon={<ShoppingCart size={22} />}
          note={`${todaysOrders} bugün`}
        />

        <StatCard
          label="Toplam Ciro"
          value={`${money(totalRevenue)} TL`}
          icon={<CircleDollarSign size={22} />}
          note="Ödenmiş siparişler"
        />

        <StatCard
          label="Toplam Ürün"
          value={String(products.length)}
          icon={<PackageCheck size={22} />}
          note="Sistemdeki ürünler"
        />

        <StatCard
          label="Stok Uyarısı"
          value={String(lowStockProducts.length)}
          icon={<TriangleAlert size={22} />}
          note={`${outOfStock} ürün stokta yok`}
          danger
        />
      </section>

      {/* SİPARİŞ + STOK */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0,1.5fr) minmax(320px,.8fr)",
          gap: 20,
          marginTop: 22,
        }}
      >
        {/* SON SİPARİŞLER */}

        <div style={panelStyle}>
          <PanelTitle
            title="Son Siparişler"
            subtitle="Yeni siparişler burada görüntülenir."
            href="/admin/siparisler"
            action="Tümünü Gör"
          />

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {recentOrders.length ? (
              recentOrders.map((order: any) => {
                const customer =
                  [
                    order.address_snapshot?.first_name,
                    order.address_snapshot?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Müşteri";

                return (
                  <Link
                    href={`/admin/siparisler/${order.id}`}
                    key={order.id}
                    style={orderCard}
                  >
                    <div>
                      <strong>
                        #{order.order_no}
                      </strong>

                      <small style={muted}>
                        {customer}
                        {" • "}
                        {new Date(
                          order.created_at
                        ).toLocaleString("tr-TR")}
                      </small>
                    </div>

                    <span
                      style={statusBadge(order.status)}
                    >
                      {order.status}
                    </span>

                    <strong>
                      {money(order.total)} TL
                    </strong>

                    <ArrowUpRight
                      size={17}
                      color="#64748b"
                    />
                  </Link>
                );
              })
            ) : (
              <div style={emptyStyle}>
                Henüz sipariş bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* KRİTİK STOK */}

        <div style={panelStyle}>
          <PanelTitle
            title="Kritik Stok"
            subtitle="5 adet ve altındaki ürünler"
            href="/admin/stok"
            action="Stok Takibi"
          />

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {lowStockProducts.length ? (
              lowStockProducts.map((product: any) => (
                <div
                  key={product.id}
                  style={stockRow}
                >
                  <img
                    src={
                      product.image_url ||
                      "/opar-filtre-banner.png"
                    }
                    alt={product.product_name}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "contain",
                    }}
                  />

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: 13,
                      }}
                    >
                      {product.product_name}
                    </strong>

                    <small style={muted}>
                      OEM: {product.product_code}
                    </small>
                  </div>

                  <b
                    style={{
                      color:
                        Number(product.stock || 0) === 0
                          ? "#b91c1c"
                          : "#b45309",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Number(product.stock || 0)} adet
                  </b>
                </div>
              ))
            ) : (
              <div style={emptyStyle}>
                Kritik stok bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HIZLI İŞLEMLER */}

      <section
        style={{
          ...panelStyle,
          marginTop: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Boxes size={20} />

          <h2
            style={{
              margin: 0,
              fontSize: 18,
            }}
          >
            Hızlı İşlemler
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: 12,
          }}
        >
          <QuickLink
            href="/admin/urunler"
            title="Ürünleri Yönet"
            text="Ürün ekle, düzenle, fiyat ve stok değiştir."
          />

          <QuickLink
            href="/admin/excel-yukle"
            title="Excel'den Yükle"
            text="Mevcut Excel toplu ürün yükleme sistemini kullan."
          />

          <QuickLink
            href="/admin/siparisler"
            title="Sipariş Takibi"
            text="Yeni ve mevcut siparişleri görüntüle."
          />

          <QuickLink
            href="/admin/stok"
            title="Stok Takibi"
            text="Kritik ve tükenen ürünleri takip et."
          />
        </div>
      </section>
    </div>
  );
}

/* ============================= */
/* COMPONENTLER */
/* ============================= */

function StatCard({
  label,
  value,
  note,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 20,
        boxShadow:
          "0 10px 30px rgba(15,23,42,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div>
          <small
            style={{
              color: "#64748b",
              fontWeight: 800,
              letterSpacing: ".04em",
            }}
          >
            {label}
          </small>

          <strong
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 27,
              color: danger
                ? "#b91c1c"
                : "#0f172a",
            }}
          >
            {value}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 7,
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            {note}
          </span>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: danger
              ? "#fef2f2"
              : "#f1f5f9",
            color: danger
              ? "#b91c1c"
              : "#334155",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function PanelTitle({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle: string;
  href: string;
  action: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 15,
        alignItems: "center",
      }}
    >
      <div>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: 18,
          }}
        >
          {title}
        </h2>

        <small
          style={{
            color: "#64748b",
          }}
        >
          {subtitle}
        </small>
      </div>

      <Link
        href={href}
        style={{
          color: "#c90020",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        {action} →
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: 16,
        borderRadius: 11,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        color: "#0f172a",
        textDecoration: "none",
      }}
    >
      <strong
        style={{
          display: "block",
          marginBottom: 5,
        }}
      >
        {title}
      </strong>

      <small
        style={{
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {text}
      </small>
    </Link>
  );
}

/* ============================= */
/* STYLES */
/* ============================= */

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 20,
  boxShadow:
    "0 10px 30px rgba(15,23,42,.035)",
};

const orderCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0,1fr) auto auto auto",
  gap: 14,
  alignItems: "center",
  padding: "13px 14px",
  border: "1px solid #eef2f7",
  borderRadius: 10,
  textDecoration: "none",
  color: "#0f172a",
};

const stockRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "48px minmax(0,1fr) auto",
  gap: 12,
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
};

const muted: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  borderRadius: 10,
  background: "#f8fafc",
  color: "#64748b",
};

const primaryButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 9,
  background: "#c90020",
  color: "#fff",
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 13,
};

const secondaryButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 9,
  background: "#fff",
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 13,
};

function statusBadge(
  status: string
): React.CSSProperties {
  const map: Record<
    string,
    {
      background: string;
      color: string;
    }
  > = {
    Yeni: {
      background: "#dbeafe",
      color: "#1d4ed8",
    },

    "Ödeme Bekleniyor": {
      background: "#fef3c7",
      color: "#92400e",
    },

    Ödendi: {
      background: "#dcfce7",
      color: "#166534",
    },

    Hazırlanıyor: {
      background: "#e0e7ff",
      color: "#3730a3",
    },

    Kargoda: {
      background: "#cffafe",
      color: "#155e75",
    },

    Tamamlandı: {
      background: "#dcfce7",
      color: "#166534",
    },

    İptal: {
      background: "#fee2e2",
      color: "#991b1b",
    },
  };

  const selected =
    map[status] || {
      background: "#f1f5f9",
      color: "#334155",
    };

  return {
    ...selected,
    padding: "5px 9px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 11,
    whiteSpace: "nowrap",
  };
}
