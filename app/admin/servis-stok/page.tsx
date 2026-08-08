import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ServisStokPage() {
  const supabase = getSupabaseAdmin();

  const { data: stocks, error } = await supabase
    .from("service_stock")
    .select(`
      id,
      product_id,
      quantity,
      min_stock,
      shelf,
      products (
        id,
        product_code,
        product_name,
        sale_price,
        stock
      )
    `)
    .order("id", { ascending: false });

  return (
    <main style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 30 }}>
            🔧 Servis Stok
          </h1>

          <p style={{ color: "#64748b", marginTop: 8 }}>
            Serviste kullanılan yedek parçaların stok yönetimi
          </p>
        </div>

        <Link
          href="/admin/is-emirleri"
          style={{
            background: "#dc0028",
            color: "white",
            padding: "12px 18px",
            borderRadius: 9,
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          İş Emirleri →
        </Link>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          Servis stok verisi alınamadı: {error.message}
        </div>
      )}

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <strong>
            Servis Deposu ({stocks?.length ?? 0} kalem)
          </strong>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <Th>OEM Kodu</Th>
                <Th>Parça</Th>
                <Th>Servis Stok</Th>
                <Th>Toptan Stok</Th>
                <Th>Raf</Th>
                <Th>Durum</Th>
              </tr>
            </thead>

            <tbody>
              {(stocks ?? []).map((row: any) => {
                const product = Array.isArray(row.products)
                  ? row.products[0]
                  : row.products;

                const quantity = Number(row.quantity ?? 0);
                const minimum = Number(row.min_stock ?? 0);

                return (
                  <tr
                    key={row.id}
                    style={{
                      borderTop: "1px solid #edf2f7",
                    }}
                  >
                    <Td>
                      <strong>
                        {product?.product_code ?? "-"}
                      </strong>
                    </Td>

                    <Td>
                      {product?.product_name ?? "Ürün bulunamadı"}
                    </Td>

                    <Td>
                      <strong>{quantity} adet</strong>
                    </Td>

                    <Td>
                      {Number(product?.stock ?? 0)} adet
                    </Td>

                    <Td>{row.shelf || "-"}</Td>

                    <Td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 800,
                          background:
                            quantity <= minimum
                              ? "#fee2e2"
                              : "#dcfce7",
                          color:
                            quantity <= minimum
                              ? "#b91c1c"
                              : "#166534",
                        }}
                      >
                        {quantity <= minimum
                          ? "Kritik Stok"
                          : "Stokta"}
                      </span>
                    </Td>
                  </tr>
                );
              })}

              {!stocks?.length && !error && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Henüz servis stoğuna parça aktarılmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "14px 16px",
        fontSize: 12,
        color: "#64748b",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "15px 16px",
        fontSize: 14,
      }}
    >
      {children}
    </td>
  );
}
