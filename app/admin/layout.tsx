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
  Car,
  RefreshCcw,
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
        {/* =====================================================
            SOL MENÜ
        ===================================================== */}

        <aside
          style={{
            background:
              "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
            color: "#fff",
            padding: "24px 18px",
            borderRight: "1px solid #1e293b",
            minHeight: "100vh",
          }}
        >
          {/* =====================================================
              LOGO / BAŞLIK
          ===================================================== */}

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
                flexShrink: 0,
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

          {/* =====================================================
              GENEL
          ===================================================== */}

          <MenuTitle>GENEL</MenuTitle>

          <nav
            style={{
              display: "grid",
              gap: 5,
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
          </nav>

          {/* =====================================================
              STOK
          ===================================================== */}

          <MenuTitle>STOK</MenuTitle>

          <nav
            style={{
              display: "grid",
              gap: 5,
            }}
          >
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
          </nav>

          {/* =====================================================
              SERVİS
          ===================================================== */}

          <MenuTitle>SERVİS</MenuTitle>

          <nav
            style={{
              display: "grid",
              gap: 5,
            }}
          >
            <Nav
              href="/admin/servis/is-emirleri"
              icon={<ClipboardList size={18} />}
            >
              İş Emirleri
            </Nav>

            <Nav
              href="/admin/servis/arac-gecmisi"
              icon={<Car size={18} />}
            >
              Araç Geçmişi
            </Nav>

            <Nav
              href="/admin/tofas-gelenler"
              icon={<RefreshCcw size={18} />}
            >
              TOFAŞ&apos;tan Gelenler
            </Nav>
          </nav>

          {/* =====================================================
              STOK HAREKET / MALİYET
          ===================================================== */}

          <MenuTitle>OPERASYON</MenuTitle>

          <nav
            style={{
              display: "grid",
              gap: 5,
            }}
          >
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
          </nav>

          {/* =====================================================
              SİSTEM
          ===================================================== */}

          <MenuTitle>SİSTEM</MenuTitle>

          <nav
            style={{
              display: "grid",
              gap: 5,
            }}
          >
            <Nav
              href="/admin/ayarlar"
              icon={<Settings size={18} />}
            >
              Ayarlar
            </Nav>
          </nav>

          {/* =====================================================
              STOK AÇIKLAMASI
          ===================================================== */}

          <div
            style={{
              marginTop: 28,
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

          {/* =====================================================
              SİTEYE DÖN
          ===================================================== */}

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
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <ExternalLink size={17} />

            Siteyi Gör
          </Link>
        </aside>

        {/* =====================================================
            SAĞ İÇERİK
        ===================================================== */}

        <main
          style={{
            minWidth: 0,
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   NAV
========================================================= */

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
        padding: "10px 12px",
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
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <span>{children}</span>
    </Link>
  );
}

/* =========================================================
   MENÜ BAŞLIĞI
========================================================= */

function MenuTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        color: "#64748b",
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1.1,
        marginTop: 22,
        marginBottom: 7,
        paddingLeft: 11,
      }}
    >
      {children}
    </div>
  );
}
