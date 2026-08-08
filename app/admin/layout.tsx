import "./admin-table.css";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  FileSpreadsheet,
  Users,
  Truck,
  ReceiptText,
  Building2,
  History,
  Settings,
  ExternalLink,
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
        background: "#f6f8fb",
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
            background: "linear-gradient(180deg,#0b1220 0%,#111827 100%)",
            color: "#fff",
            padding: "24px 18px",
            borderRight: "1px solid #1e293b",
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
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "#c90020",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              TO
            </div>

            <div>
              <strong style={{ display: "block" }}>
                Turan Oto
              </strong>
              <small style={{ color: "#94a3b8" }}>
                Premium Yönetim
              </small>
            </div>
          </Link>

          <nav style={{ display: "grid", gap: 7 }}>
            <Nav href="/admin" icon={<LayoutDashboard size={18} />}>
              Genel Bakış
            </Nav>

            <Nav href="/admin/urunler" icon={<Package size={18} />}>
              Ürün Yönetimi
            </Nav>

            <Nav href="/admin/excel-yukle" icon={<FileSpreadsheet size={18} />}>
              Excel Yükleme
            </Nav>

            <Nav href="/admin/siparisler" icon={<ShoppingCart size={18} />}>
              Sipariş Takibi
            </Nav>

            <Nav href="/admin/stok" icon={<Boxes size={18} />}>
              Stok Takibi
            </Nav>

            <Nav href="/admin/stok-hareketleri" icon={<History size={18} />}>
              Stok Hareketleri
            </Nav>

            <Nav href="/admin/maliyet" icon={<ReceiptText size={18} />}>
              İrsaliye & Maliyet
            </Nav>

            <Nav href="/admin/tedarikciler" icon={<Building2 size={18} />}>
              Tedarikçiler
            </Nav>

            <Nav href="/admin/musteriler" icon={<Users size={18} />}>
              Müşteriler
            </Nav>

            <Nav href="/admin/kargo" icon={<Truck size={18} />}>
              Kargo Yönetimi
            </Nav>

            <Nav href="/admin/ayarlar" icon={<Settings size={18} />}>
              Ayarlar
            </Nav>
          </nav>

          <Link
            href="/"
            style={{
              marginTop: 26,
              display: "flex",
              gap: 9,
              alignItems: "center",
              color: "#cbd5e1",
              textDecoration: "none",
              padding: "11px 12px",
              border: "1px solid #243044",
              borderRadius: 10,
            }}
          >
            <ExternalLink size={17} />
            Siteyi Gör
          </Link>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}

function Nav({
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
        gap: 10,
        alignItems: "center",
        padding: "11px 12px",
        borderRadius: 9,
        color: "#dbe4ef",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
