import { getSupabaseAdmin } from "@/lib/supabase-admin";
import AyarlarForm from "./AyarlarForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase =
    getSupabaseAdmin();

  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div style={{ padding: 34 }}>
      <h1>Ayarlar</h1>
      <AyarlarForm
        initial={data || {}}
      />
    </div>
  );
}
