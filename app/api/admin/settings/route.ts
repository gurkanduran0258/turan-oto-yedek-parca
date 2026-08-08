import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request
) {
  try {
    const body =
      await request.json();

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from("site_settings")
      .update({
        company_name:
          body.company_name,
        phone:
          body.phone,
        support_email:
          body.support_email,
        free_shipping_threshold:
          body.free_shipping_threshold,
        standard_shipping_fee:
          body.standard_shipping_fee,
        low_stock_threshold:
          body.low_stock_threshold,
        default_profit_margin:
          body.default_profit_margin,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", 1)
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
