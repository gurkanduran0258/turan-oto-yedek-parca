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
  Wrench,
  ClipboardList,
  RefreshCw,
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
          gridTemplateColumns: "260px minmax(0, 1fr)",
          minHeight: "100vh",
        }}
      >
        {/* SOL MENÜ */}
        <aside
          style={{
            background:
              "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
            color: "#fff",
            padding: "24px 18px",
            borderRight: "1px solid #1e293b",
          }}
        >
          {/* LOGO / BAŞLIK */}
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
                width: 46,
                height: 46,
                borderRadius: 13,
                background: "#c90020",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 16,
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
                Premium Yönetim
              </small>
            </div>
          </Link>

          {/* MENÜ */}
          <nav
            style={{
              display: "grid",
              gap: 7,
            }}
          >
            <Nav
              href="/admin"
              icon={<LayoutDashboard size={18} />}
            >
              Genel Bakış
            </Nav>

            <Nav
              href="/admin/urunler"
              icon={<Package size={18} />}
            >
              Ürün Yönetimi
            </Nav>

            <Nav
              href="/admin/excel-yukle"
              icon={<FileSpreadsheet size={18} />}
            >
              Excel Yükleme
            </Nav>

            <Nav
              href="/admin/siparisler"
              icon={<ShoppingCart size={18} />}
            >
              Sipariş Takibi
            </Nav>

            <Nav
              href="/admin/stok"
              icon={<Boxes size={18} />}
            >
              Toptan / E-Ticaret Stok
            </Nav>

            <Nav
              href="/admin/servis-stok"
              icon={<Wrench size={18} />}
            >
              Servis Stok
            </Nav>

            <Nav
              href="/admin/is-emirleri"
              icon={<ClipboardList size={18} />}
            >
              İş Emirleri
            </Nav>

            <Nav
              href="/admin/tofas-gelenler"
              icon={<RefreshCw size={18} />}
            >
              TOFAŞ'tan Gelenler
            </Nav>

            <Nav
              href="/admin/stok-hareketleri"
              icon={<History size={18} />}
            >
              Toptan Stok Hareketleri
            </Nav>

            <Nav
              href="/admin/maliyet"
              icon={<ReceiptText size={18} />}
            >
              İrsaliye & Maliyet
            </Nav>

            <Nav
              href="/admin/tedarikciler"
              icon={<Building2 size={18} />}
            >
              Tedarikçiler
            </Nav>

            <Nav
              href="/admin/musteriler"
              icon={<Users size={18} />}
            >
              Müşteriler
            </Nav>

            <Nav
              href="/admin/kargo"
              icon={<Truck size={18} />}
            >
              Kargo Yönetimi
            </Nav>

            <Nav
              href="/admin/ayarlar"
              icon={<Settings size={18} />}
            >
              Ayarlar
            </Nav>
          </nav>

          {/* ALT KUTU */}
          <div
            style={{
              marginTop: 26,
              padding: 14,
              background: "#111827",
              border: "1px solid #243044",
              borderRadius: 11,
            }}
          >
            <small
              style={{
                color: "#64748b",
                fontWeight: 800,
                display: "block",
                marginBottom: 5,
              }}
            >
              STOK YAPISI
            </small>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              Toptan ve servis stokları ayrı çalışır.
              İş emri parça çıkışları sadece servis
              stoğunu etkiler.
            </div>
          </div>

          {/* SİTEYE DÖN */}
          <Link
            href="/"
            style={{
              marginTop: 14,
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

        {/* SAĞ İÇERİK */}
        <div
          style={{
            minWidth: 0,
          }}
        >
          {children}
        </div>
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
        transition: "all .2s ease",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          color: "#94a3b8",
        }}
      >
        {icon}
      </span>

      <span>{children}</span>
    </Link>
  );
}
