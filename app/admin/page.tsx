import { getSupabaseAdmin } from "@/lib/supabase-admin";
import TofasIncomingClient from "./TofasIncomingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("tofas_import_queue")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 34 }}>
        <h1>TOFAŞ'tan Gelen Ürünler</h1>
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: 14, borderRadius: 10 }}>
          {error.message}
        </div>
      </div>
    );
  }

  return <TofasIncomingClient initialRows={(data || []) as any[]} />;
}
