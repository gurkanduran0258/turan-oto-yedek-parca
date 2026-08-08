import { getSupabaseAdmin } from "@/lib/supabase-admin";
import CostManager from "./CostManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase =
    getSupabaseAdmin();

  const [
    { data: suppliers },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id,name")
      .order("name"),

    supabase
      .from("site_settings")
      .select(
        "default_profit_margin"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  return (
    <div style={{ padding: 34 }}>
      <h1>İrsaliye & Maliyet</h1>

      <p
        style={{
          color: "#64748b",
        }}
      >
        Alış fiyatını, KDV, kargo
        ve masrafları gir. Gerçek
        maliyet ve satış fiyatı
        hesaplansın.
      </p>

      <CostManager
        suppliers={
          (suppliers || []) as any[]
        }
        defaultMargin={Number(
          settings?.default_profit_margin ||
            40
        )}
      />
    </div>
  );
}
