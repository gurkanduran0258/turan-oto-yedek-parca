import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Tedarikçi adı zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from("suppliers")
      .insert({
        name,
        phone:
          body.phone || null,
        email:
          body.email || null,
        tax_number:
          body.tax_number ||
          null,
        note:
          body.note || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Hata",
      },
      {
        status: 500,
      }
    );
  }
}
