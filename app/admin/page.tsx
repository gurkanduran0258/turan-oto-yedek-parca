import Link from "next/link";
import {
  ShoppingCart,
  CircleDollarSign,
  PackageCheck,
  TriangleAlert,
  ArrowUpRight,
  Boxes,
  Users,
  Truck,
  ReceiptText,
  Settings,
  FileSpreadsheet,
  History,
} from "lucide-react";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const money = (value: number) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        minHeight: 130,
        boxShadow: "0 8px 30px rgba(15,23,42,.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 14, fontWeight: 700 }}>
            {label}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
          <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
            {note}
          </div>
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            borderRadius: 13,
            background: "#f8fafc",
            color: "#c90020",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        gap: 13,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "#fff1f2",
          color: "#c90020",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>
          {description}
        </div>
      </div>
      <ArrowUpRight size={18} style={{ marginLeft: "auto", color: "#94a3b8" }} />
    </Link>
  );
}

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();

  const [
    productsResult,
    ordersResult,
    lowStockResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, order_no, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("id, product_code, product_name, stock")
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(8),
  ]);

  const orders = ordersResult.data || [];
  const lowStock = lowStockResult.data || [];

  const totalRevenue = orders
    .filter((o: any) =>
      ["Ödendi", "Hazırlanıyor", "Kargoda", "Teslim Edildi"].includes(
        String(o.status || "")
      )
    )
    .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const paidOrders = orders.filter((o: any) =>
    ["Ödendi", "Hazırlanıyor", "Kargoda", "Teslim Edildi"].includes(
      String(o.status || "")
    )
  ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        padding: "32px",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1450, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                color: "#c90020",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: ".08em",
              }}
            >
              TURAN OTO
            </div>
            <h1 style={{ margin: "5px 0 0", fontSize: 34 }}>
              Yönetim Paneli
            </h1>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Sipariş, stok, müşteri, kargo ve maliyet operasyonları.
            </p>
          </div>

          <Link
            href="/"
            style={{
              textDecoration: "none",
              background: "#111827",
              color: "#fff",
              padding: "11px 15px",
              borderRadius: 10,
              fontWeight: 800,
            }}
          >
            Siteye Git
          </Link>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          <StatCard
            label="Toplam Ürün"
            value={String(productsResult.count || 0)}
            note="Ürün kataloğu"
            icon={<Boxes size={22} />}
          />
          <StatCard
            label="Son Siparişler"
            value={String(orders.length)}
            note="Son kayıtlar"
            icon={<ShoppingCart size={22} />}
          />
          <StatCard
            label="Ödenen Sipariş"
            value={String(paidOrders)}
            note="İşleme alınabilir"
            icon={<PackageCheck size={22} />}
          />
          <StatCard
            label="Toplam Ciro"
            value={`${money(totalRevenue)} TL`}
            note="Listelenen ödenmiş siparişler"
            icon={<CircleDollarSign size={22} />}
          />
          <StatCard
            label="Kritik Stok"
            value={String(lowStock.length)}
            note="5 adet ve altı"
            icon={<TriangleAlert size={22} />}
          />
        </section>

        <h2 style={{ marginTop: 30 }}>Hızlı İşlemler</h2>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))",
            gap: 12,
          }}
        >
          <QuickLink
            href="/admin/urunler"
            title="Ürün Yönetimi"
            description="Ürün, fiyat ve stokları yönet."
            icon={<Boxes size={20} />}
          />
          <QuickLink
            href="/admin/excel-yukle"
            title="Excel Yükleme"
            description="Mevcut toplu ürün yükleme ekranı."
            icon={<FileSpreadsheet size={20} />}
          />
          <QuickLink
            href="/admin/maliyet"
            title="İrsaliye & Maliyet"
            description="Alış, kargo, masraf ve kâr hesabı."
            icon={<ReceiptText size={20} />}
          />
          <QuickLink
            href="/admin/stok-hareketleri"
            title="Stok Hareketleri"
            description="Giriş ve çıkış geçmişini görüntüle."
            icon={<History size={20} />}
          />
          <QuickLink
            href="/admin/musteriler"
            title="Müşteriler"
            description="Kayıtlı müşteri hesaplarını görüntüle."
            icon={<Users size={20} />}
          />
          <QuickLink
            href="/admin/kargo"
            title="Kargo Yönetimi"
            description="Kargoya çıkacak siparişleri takip et."
            icon={<Truck size={20} />}
          />
          <QuickLink
            href="/admin/tedarikciler"
            title="Tedarikçiler"
            description="Tedarikçi ve alış kaynaklarını yönet."
            icon={<ReceiptText size={20} />}
          />
          <QuickLink
            href="/admin/ayarlar"
            title="Ayarlar"
            description="Kargo, stok ve kâr ayarları."
            icon={<Settings size={20} />}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(300px,.6fr)",
            gap: 16,
            marginTop: 28,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Son Siparişler</h2>
            {orders.length === 0 ? (
              <p style={{ color: "#64748b" }}>Henüz sipariş bulunmuyor.</p>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {orders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/admin/siparisler/${order.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 140px",
                      gap: 10,
                      alignItems: "center",
                      padding: 13,
                      border: "1px solid #eef2f7",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "#0f172a",
                    }}
                  >
                    <b>#{order.order_no || order.id}</b>
                    <span>{order.status || "Yeni"}</span>
                    <b style={{ textAlign: "right" }}>
                      {money(Number(order.total || 0))} TL
                    </b>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Kritik Stok</h2>
            {lowStock.length === 0 ? (
              <p style={{ color: "#64748b" }}>Kritik stok bulunmuyor.</p>
            ) : (
              <div style={{ display: "grid", gap: 9 }}>
                {lowStock.map((product: any) => (
                  <div
                    key={product.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "#fff7f7",
                      border: "1px solid #fee2e2",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      {product.product_code}
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginTop: 3,
                      }}
                    >
                      {product.product_name}
                    </div>
                    <div
                      style={{
                        color: "#b91c1c",
                        fontWeight: 900,
                        marginTop: 6,
                      }}
                    >
                      Stok: {Number(product.stock || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
