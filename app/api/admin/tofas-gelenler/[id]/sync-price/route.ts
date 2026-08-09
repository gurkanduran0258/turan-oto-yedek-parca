import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: Props) {
  try {
    const { id } = await params;
    const queueId = Number(id);

    if (!Number.isInteger(queueId)) {
      return NextResponse.json(
        { error:"Geçersiz kayıt." },
        { status:400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from("tofas_import_queue")
      .select("id,product_code,status")
      .eq("id", queueId)
      .maybeSingle();

    if (error) throw error;

    if (!row) {
      return NextResponse.json(
        { error:"Ürün bulunamadı." },
        { status:404 }
      );
    }

    const { data: existing } = await supabase
      .from("tofas_sync_requests")
      .select("id,status")
      .eq("queue_id", queueId)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success:true,
        alreadyQueued:true
      });
    }

    const { error: insertError } = await supabase
      .from("tofas_sync_requests")
      .insert({
        product_code: row.product_code,
        queue_id: row.id,
        status:"pending"
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success:true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İstek oluşturulamadı."
      },
      { status:500 }
    );
  }
}
