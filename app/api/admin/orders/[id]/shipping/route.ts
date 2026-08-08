import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Props
) {
  try {
    const { id } =
      await params;

    const body =
      await request.json();

    const supabase =
      getSupabaseAdmin();

    const tracking =
      String(
        body.tracking_number ||
          ""
      ).trim();

    const updateData: any = {
      shipping_company:
        String(
          body.shipping_company ||
            ""
        ).trim() || null,

      tracking_number:
        tracking || null,

      updated_at:
        new Date().toISOString(),
    };

    if (tracking) {
      updateData.status =
        "Kargoda";

      updateData.shipped_at =
        new Date().toISOString();
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .update(updateData)
      .eq(
        "id",
        Number(id)
      )
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
      order: data,
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
