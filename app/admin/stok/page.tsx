import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockPage() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,product_code,product_name,product_group,stock,sale_price,image_url"
    )
    .order("stock", {
      ascending: true,
    })
    .order("product_name", {
      ascending: true,
    });

  const products = data || [];

  const zero =
    products.filter(
      (product: any) =>
        Number(product.stock || 0) === 0
    ).length;

  const critical =
    products.filter(
      (product: any) => {
        const stock =
          Number(
            product.stock || 0
          );

        return (
          stock > 0 &&
          stock <= 5
        );
      }
    ).length;

  return (
    <div
      style={{
        padding: "34px 34px 70px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 16,
          alignItems:
            "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: 5,
            }}
          >
            Stok Takibi
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Ürün stoklarını ve kritik
            seviyeleri takip edin.
          </p>
        </div>

        <Link
          href="/admin/urunler"
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "10px 13px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Ürün Yönetimi
        </Link>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <Box
          label="Toplam Ürün"
          value={products.length}
        />

        <Box
          label="Kritik Stok"
          value={critical}
          warning
        />

        <Box
          label="Stokta Yok"
          value={zero}
          danger
        />
      </section>

      {error ? (
        <div
          style={{
            padding: 14,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: 8,
          }}
        >
          {error.message}
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth: 900,
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#f8fafc",
                }}
              >
                <th style={th}>
                  Görsel
                </th>

                <th style={th}>
                  OEM
                </th>

                <th style={th}>
                  Ürün
                </th>

                <th style={th}>
                  Grup
                </th>

                <th style={th}>
                  Stok
                </th>

                <th style={th}>
                  Durum
                </th>

                <th style={th}>
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product: any) => {
                  const stock =
                    Number(
                      product.stock ||
                        0
                    );

                  return (
                    <tr
                      key={
                        product.id
                      }
                    >
                      <td style={td}>
                        <img
                          src={
                            product.image_url ||
                            "/opar-filtre-banner.png"
                          }
                          alt={
                            product.product_name
                          }
                          style={{
                            width: 48,
                            height: 48,
                            objectFit:
                              "contain",
                          }}
                        />
                      </td>

                      <td style={td}>
                        <strong>
                          {
                            product.product_code
                          }
                        </strong>
                      </td>

                      <td style={td}>
                        {
                          product.product_name
                        }
                      </td>

                      <td style={td}>
                        {product.product_group ||
                          "-"}
                      </td>

                      <td style={td}>
                        <strong>
                          {stock}
                        </strong>
                      </td>

                      <td style={td}>
                        <span
                          style={stockBadge(
                            stock
                          )}
                        >
                          {stock === 0
                            ? "Stokta Yok"
                            : stock <= 5
                              ? "Kritik"
                              : "Normal"}
                        </span>
                      </td>

                      <td style={td}>
                        <Link
                          href={`/admin/urunler?search=${encodeURIComponent(
                            product.product_code
                          )}`}
                          style={{
                            color:
                              "#c90020",
                            fontWeight:
                              800,
                            textDecoration:
                              "none",
                          }}
                        >
                          Ürünü Aç →
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Box({
  label,
  value,
  warning = false,
  danger = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <small
        style={{
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        {label}
      </small>

      <strong
        style={{
          display: "block",
          fontSize: 28,
          marginTop: 8,
          color: danger
            ? "#b91c1c"
            : warning
              ? "#b45309"
              : "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "12px 13px",
  textAlign: "left",
  borderBottom:
    "1px solid #e2e8f0",
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "11px 13px",
  borderBottom:
    "1px solid #f1f5f9",
};

function stockBadge(
  stock: number
): React.CSSProperties {
  if (stock === 0) {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "5px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 800,
    };
  }

  if (stock <= 5) {
    return {
      background: "#fef3c7",
      color: "#92400e",
      padding: "5px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 800,
    };
  }

  return {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  };
}
