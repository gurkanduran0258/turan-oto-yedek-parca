import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Props = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Props) {
  try {
    const { id } = await params;
    const queueId = Number(id);

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("tofas_import_queue")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", queueId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reddedilemedi." },
      { status: 500 }
    );
  }
}
