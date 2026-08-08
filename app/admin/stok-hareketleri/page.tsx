import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id,movement_type,quantity,stock_before,stock_after,note,created_at,products(product_code,product_name)"
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(300);

  return (
    <div style={{ padding: 34 }}>
      <h1>Stok Hareketleri</h1>

      {error ? (
        <div>
          {error.message}
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e2e8f0",
            borderRadius: 11,
            overflow: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Hareket</th>
                <th>Adet</th>
                <th>Önce</th>
                <th>Sonra</th>
                <th>Not</th>
                <th>Tarih</th>
              </tr>
            </thead>

            <tbody>
              {(data || []).map((item: any) => (
                <tr key={item.id}>
                  <td>
                    {
                      item.products
                        ?.product_code
                    }{" "}
                    -{" "}
                    {
                      item.products
                        ?.product_name
                    }
                  </td>

                  <td>
                    {
                      item.movement_type
                    }
                  </td>

                  <td>
                    {item.quantity}
                  </td>

                  <td>
                    {
                      item.stock_before
                    }
                  </td>

                  <td>
                    {
                      item.stock_after
                    }
                  </td>

                  <td>
                    {item.note || "-"}
                  </td>

                  <td>
                    {new Date(
                      item.created_at
                    ).toLocaleString(
                      "tr-TR"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
