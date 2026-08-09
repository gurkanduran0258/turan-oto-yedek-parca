import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const query = String(body?.query || "").trim();

  if (!query) {
    return NextResponse.json(
      { error: "Plaka, şase veya motor numarası gir." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("vehicle_history_sync_requests")
    .insert({
      query,
      status: "pending",
      message: "Yerel TOFAŞ servisi bekleniyor...",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const q = String(req.nextUrl.searchParams.get("q") || "").trim();
  const requestId = String(req.nextUrl.searchParams.get("requestId") || "").trim();

  if (requestId) {
    const { data, error } = await supabase
      .from("vehicle_history_sync_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  }

  if (!q) {
    return NextResponse.json({ vehicle: null });
  }

  const normalized = q.replace(/\s+/g, "").toUpperCase();

  const { data: vehicles, error } = await supabase
    .from("vehicle_history_vehicles")
    .select(`
      *,
      vehicle_history_items(*),
      vehicle_history_customer_requests(*),
      vehicle_history_service_suggestions(*)
    `)
    .or(`plate.ilike.%${normalized}%,vin.ilike.%${normalized}%,engine_no.ilike.%${normalized}%`)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const vehicle = vehicles?.[0] || null;

  if (vehicle) {
    vehicle.vehicle_history_items =
      (vehicle.vehicle_history_items || []).sort(
        (a: any, b: any) => (a.row_order || 0) - (b.row_order || 0)
      );

    vehicle.vehicle_history_customer_requests =
      (vehicle.vehicle_history_customer_requests || []).sort(
        (a: any, b: any) => (a.row_order || 0) - (b.row_order || 0)
      );

    vehicle.vehicle_history_service_suggestions =
      (vehicle.vehicle_history_service_suggestions || []).sort(
        (a: any, b: any) => (a.row_order || 0) - (b.row_order || 0)
      );
  }

  return NextResponse.json({ vehicle });
}
