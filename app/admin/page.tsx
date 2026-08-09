import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

import {
  Package,
  ShoppingCart,
  Boxes,
  Wrench,
  RefreshCw,
  FileSpreadsheet,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCount(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  filter?: (query: any) => any
) {
  try {
    let query: any = supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true,
      });

    if (filter) {
      query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`${table} count:`, error.message);
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();

  /*
   * ANA SAYFA İSTATİSTİKLERİ
   */

  const [
    productCount,
    orderCount,
    lowStockCount,
    tofasPendingCount,
  ] = await Promise.all([
    getCount(supabase, "products"),

    getCount(supabase, "orders"),

    getCount(
      supabase,
      "products",
      (q) => q.lte("stock", 5)
    ),

    getCount(
      supabase,
      "tofas_import_queue",
      (q) => q.eq("status", "pending")
    ),
  ]);

  /*
   * ÜRÜNLERDEN TOPLAM STOK
   */

  let totalStock = 0;

  try {
    const { data } = await supabase
      .from("products")
      .select("stock");

    totalStock = (data || []).reduce(
      (total: number, row: any) =>
        total + Number(row.stock || 0),
      0
    );
  } catch {
    totalStock = 0;
  }

  /*
   * TOFAŞ SON GELENLER
   */

  let latestTofas: any[] = [];

  try {
    const { data } = await supabase
      .from("tofas_import_queue")
      .select(
        `
        id,
        product_code,
        product_name,
        status,
        tofas_list_price_vat,
        last_price_sync_at,
        created_at
        `
      )
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      })
      .limit(6);

    latestTofas = data || [];
  } catch {
    latestTofas = [];
  }

  return (
    <div
      style={{
        padding: 28,
        maxWidth: 1600,
        margin: "0 auto",
      }}
    >
      {/* BAŞLIK */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              color: "#c90020",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: ".08em",
            }}
          >
            TURAN OTO
          </div>

          <h1
            style={{
              margin: "4px 0 4px",
              fontSize: 32,
              letterSpacing: "-.03em",
            }}
          >
            Yönetim Paneli
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Satış, stok ve TOFAŞ ürün yönetiminin
            genel görünümü.
          </p>
        </div>

        <Link
          href="/"
          style={{
            background: "#0f172a",
            color: "#fff",
            textDecoration: "none",
            padding: "11px 16px",
            borderRadius: 9,
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Siteyi Gör →
        </Link>
      </div>

      {/* ÜST İSTATİSTİKLER */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 13,
          marginTop: 24,
        }}
      >
        <StatCard
          title="Toplam Ürün"
          value={productCount}
          subtitle="Yayındaki ürün kartları"
          icon={<Package size={22} />}
        />

        <StatCard
          title="Toplam Stok"
          value={totalStock}
          subtitle="E-Ticaret / toptan stok"
          icon={<Boxes size={22} />}
        />

        <StatCard
          title="Siparişler"
          value={orderCount}
          subtitle="Toplam sipariş"
          icon={<ShoppingCart size={22} />}
        />

        <StatCard
          title="TOFAŞ Onay Bekleyen"
          value={tofasPendingCount}
          subtitle="Kontrol edilmesi gereken parçalar"
          icon={<RefreshCw size={22} />}
          important={tofasPendingCount > 0}
        />
      </div>

      {/* İKİNCİ SATIR */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(300px, .9fr)",
          gap: 15,
          marginTop: 16,
        }}
      >
        {/* TOFAŞ GELENLER */}

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "17px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #eef2f7",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                }}
              >
                TOFAŞ'tan Son Gelenler
              </h2>

              <small
                style={{
                  color: "#64748b",
                }}
              >
                Onay bekleyen son parçalar
              </small>
            </div>

            <Link
              href="/admin/tofas-gelenler"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#c90020",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              Tümünü Gör
              <ArrowRight size={16} />
            </Link>
          </div>

          {latestTofas.length > 0 ? (
            <div>
              {latestTofas.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "135px minmax(0,1fr) 145px 130px",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 18px",
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  <strong>
                    {product.product_code}
                  </strong>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {product.product_name}
                  </div>

                  <div>
                    <small
                      style={{
                        display: "block",
                        color: "#94a3b8",
                      }}
                    >
                      Liste Fiyatı
                    </small>

                    <strong>
                      {money(
                        product.tofas_list_price_vat
                      )}
                    </strong>
                  </div>

                  <div>
                    {product.last_price_sync_at ? (
                      <span
                        style={{
                          display: "inline-block",
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "5px 7px",
                          borderRadius: 6,
                          fontWeight: 900,
                          fontSize: 11,
                        }}
                      >
                        ✓ Güncellendi
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          background: "#f1f5f9",
                          color: "#64748b",
                          padding: "5px 7px",
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 11,
                        }}
                      >
                        Kontrol Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 35,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Onay bekleyen TOFAŞ ürünü yok.
            </div>
          )}
        </section>

        {/* UYARILAR */}

        <section
          style={{
            display: "grid",
            gap: 13,
            alignContent: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 9,
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                <AlertTriangle size={19} />
              </div>

              <div>
                <small
                  style={{
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  DÜŞÜK STOK
                </small>

                <strong
                  style={{
                    display: "block",
                    fontSize: 22,
                  }}
                >
                  {lowStockCount}
                </strong>
              </div>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Stoku 5 adet veya altında olan ürünler.
            </p>

            <Link
              href="/admin/stok"
              style={secondaryLink}
            >
              Stokları İncele →
            </Link>
          </div>

          <div
            style={{
              background:
                "linear-gradient(135deg,#0f172a,#1e293b)",
              color: "#fff",
              borderRadius: 14,
              padding: 19,
            }}
          >
            <TrendingUp size={22} />

            <h3
              style={{
                margin: "10px 0 6px",
              }}
            >
              TOFAŞ Otomasyonu
            </h3>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: 12,
                lineHeight: 1.6,
                marginTop: 0,
              }}
            >
              Yeni TOFAŞ parçaları önce onay
              ekranına gelir. Kontrol edilmeden
              mağazaya yayınlanmaz.
            </p>

            <Link
              href="/admin/tofas-gelenler"
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Onay Ekranına Git →
            </Link>
          </div>
        </section>
      </div>

      {/* HIZLI İŞLEMLER */}

      <section
        style={{
          marginTop: 16,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <h2
          style={{
            margin: "0 0 14px",
            fontSize: 18,
          }}
        >
          Hızlı İşlemler
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <QuickLink
            href="/admin/urunler"
            icon={<Package size={20} />}
            title="Ürün Yönetimi"
            text="Ürünleri düzenle"
          />

          <QuickLink
            href="/admin/excel-yukle"
            icon={<FileSpreadsheet size={20} />}
            title="Excel Yükle"
            text="Toplu ürün aktar"
          />

          <QuickLink
            href="/admin/siparisler"
            icon={<ShoppingCart size={20} />}
            title="Siparişler"
            text="Siparişleri yönet"
          />

          <QuickLink
            href="/admin/servis-stok"
            icon={<Wrench size={20} />}
            title="Servis Stok"
            text="Servis parçalarını yönet"
          />

          <QuickLink
            href="/admin/is-emirleri"
            icon={<ClipboardList size={20} />}
            title="İş Emirleri"
            text="Parça çıkışlarını yönet"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  important = false,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  important?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: important
          ? "1px solid #fecaca"
          : "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 17,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <small
            style={{
              color: "#64748b",
              fontWeight: 800,
            }}
          >
            {title}
          </small>

          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 27,
              color: important
                ? "#c90020"
                : "#0f172a",
            }}
          >
            {value.toLocaleString("tr-TR")}
          </strong>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            borderRadius: 11,
            background: important
              ? "#fff1f2"
              : "#f1f5f9",
            color: important
              ? "#c90020"
              : "#334155",
          }}
        >
          {icon}
        </div>
      </div>

      <small
        style={{
          display: "block",
          color: "#94a3b8",
          marginTop: 8,
        }}
      >
        {subtitle}
      </small>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: 13,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        textDecoration: "none",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: "#f1f5f9",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            fontSize: 13,
          }}
        >
          {title}
        </strong>

        <small
          style={{
            color: "#64748b",
          }}
        >
          {text}
        </small>
      </div>
    </Link>
  );
}

function money(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return (
    Number(value).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

const secondaryLink: React.CSSProperties = {
  display: "inline-block",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
};
