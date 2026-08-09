import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestType = body.requestType === "all" ? "all" : "single";
    const workOrderNo = String(body.workOrderNo || "").trim();

    if (requestType === "single" && !workOrderNo) {
      return NextResponse.json(
        { error: "Sistem / İş Emri numarası zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    let q = supabase
      .from("tofas_work_order_sync_requests")
      .select("id,status")
      .in("status", ["pending", "processing"])
      .eq("request_type", requestType);

    if (requestType === "single") {
      q = q.eq("work_order_no", workOrderNo);
    }

    const { data: existing } = await q.limit(1).maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyQueued: true });
    }

    const { error } = await supabase
      .from("tofas_work_order_sync_requests")
      .insert({
        request_type: requestType,
        work_order_no: requestType === "single" ? workOrderNo : null,
        status: "pending",
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Aktarım isteği oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}
