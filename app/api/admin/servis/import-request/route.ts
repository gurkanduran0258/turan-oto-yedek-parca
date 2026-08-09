import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request) {
  try {
    const body = await request.json();
    const workOrderNo = String(body.workOrderNo || "").trim();

    if (!workOrderNo) {
      return NextResponse.json({error:"İş emri numarası zorunlu."},{status:400});
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("tofas_work_order_sync_requests")
      .select("id,status")
      .eq("work_order_no",workOrderNo)
      .in("status",["pending","processing"])
      .maybeSingle();

    if (existing) return NextResponse.json({success:true,alreadyQueued:true});

    const { error } = await supabase
      .from("tofas_work_order_sync_requests")
      .insert({work_order_no:workOrderNo,status:"pending"});

    if (error) throw error;

    return NextResponse.json({success:true});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error ? error.message : "İstek oluşturulamadı."},{status:500});
  }
}
