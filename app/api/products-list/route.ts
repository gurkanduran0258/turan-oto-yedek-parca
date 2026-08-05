import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(
      1,
      Number(searchParams.get("page") || 1)
    );

    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 25))
    );

    const search = (
      searchParams.get("search") || ""
    ).trim();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("products")
      .select(
        `
          id,
          product_code,
          product_name,
          product_group,
          purchase_price,
          profit_margin,
          vat,
          sale_price,
          stock,
          image_url,
          created_at,
          updated_at
        `,
        {
          count: "exact",
        }
      )
      .order("updated_at", {
        ascending: false,
      })
      .range(from, to);

    if (search) {
      const safeSearch = search
        .replace(/[%(),]/g, " ")
        .trim();

      query = query.or(
        `product_code.ilike.%${safeSearch}%,product_name.ilike.%${safeSearch}%,product_group.ilike.%${safeSearch}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Ürün listeleme hatası:", error);

      return NextResponse.json(
        {
          error: error.message,
          products: [],
          total: 0,
          page,
          pageSize,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        products: data || [],
        total: count || 0,
        page,
        pageSize,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ürünler getirilemedi.";

    console.error("Products list API:", error);

    return NextResponse.json(
      {
        error: message,
        products: [],
        total: 0,
        page: 1,
        pageSize: 25,
      },
      {
        status: 500,
      }
    );
  }
}
