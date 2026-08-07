import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  FileSpreadsheet,
  Search,
  Users,
  Truck,
  Settings,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr)",
          minHeight: "100vh",
        }}
      >
        <aside
          style={{
            background: "#0b1220",
            color: "#fff",
            padding: "24px 18px",
            borderRight: "1px solid #172033",
          }}
        >
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#fff",
              textDecoration: "none",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#c90020",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              TO
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: 16,
                }}
              >
                Turan Oto
              </strong>

              <small
                style={{
                  color: "#94a3b8",
                }}
              >
                Yönetim Paneli
              </small>
            </div>
          </Link>

          <nav style={{ display: "grid", gap: 8 }}>
            <AdminNavLink
              href="/admin"
              icon={<LayoutDashboard size={18} />}
            >
              Genel Bakış
            </AdminNavLink>

            <AdminNavLink
              href="/admin/urunler"
              icon={<Package size={18} />}
            >
              Ürün Yönetimi
            </AdminNavLink>

            <AdminNavLink
              href="/admin/siparisler"
              icon={<ShoppingCart size={18} />}
            >
              Sipariş Takibi
            </AdminNavLink>

            <AdminNavLink
              href="/admin/stok"
              icon={<Boxes size={18} />}
            >
              Stok Takibi
            </AdminNavLink>

            <AdminNavLink
              href="/admin/excel-yukle"
              icon={<FileSpreadsheet size={18} />}
            >
              Excel Yükleme
            </AdminNavLink>

            <AdminNavLink
              href="/sasi-sorgula"
              icon={<Search size={18} />}
            >
              Şase Sorgula
            </AdminNavLink>

            <AdminNavLink
              href="/admin/musteriler"
              icon={<Users size={18} />}
            >
              Müşteriler
            </AdminNavLink>

            <AdminNavLink
              href="/admin/kargo"
              icon={<Truck size={18} />}
            >
              Kargo Yönetimi
            </AdminNavLink>

            <AdminNavLink
              href="/admin/ayarlar"
              icon={<Settings size={18} />}
            >
              Ayarlar
            </AdminNavLink>
          </nav>

          <div
            style={{
              marginTop: 28,
              padding: 14,
              border: "1px solid #1e293b",
              borderRadius: 12,
              background: "#111827",
              color: "#94a3b8",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Ürün, sipariş ve stok akışlarını tek
            ekrandan yönetin.
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 12px",
        borderRadius: 9,
        textDecoration: "none",
        color: "#dbe4ef",
        background: "transparent",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
