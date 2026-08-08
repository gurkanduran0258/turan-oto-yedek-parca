import { getSupabaseAdmin } from "@/lib/supabase-admin";
import TedarikciForm from "./TedarikciForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  return (
    <div style={{ padding: 34 }}>
      <h1>Tedarikçiler</h1>

      <TedarikciForm />

      <div
        style={{
          display: "grid",
          gap: 9,
        }}
      >
        {(data || []).map((item: any) => (
          <div
            key={item.id}
            style={{
              background: "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <b>{item.name}</b>

            <div
              style={{
                color: "#64748b",
                marginTop: 4,
              }}
            >
              {item.phone || "-"} •{" "}
              {item.email || "-"} •
              Vergi No:{" "}
              {item.tax_number || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
