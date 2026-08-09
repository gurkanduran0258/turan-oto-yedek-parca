import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const queueId = Number(id);

    if (!Number.isInteger(queueId)) {
      return NextResponse.json({ error: "Geçersiz kayıt." }, { status: 400 });
    }

    const body = await request.json();
    const category = String(body.category || "").trim();
    const stock = Math.max(0, Math.floor(Number(body.stock || 0)));
    const salePrice = Number(body.salePrice || 0);

    if (!category) {
      return NextResponse.json({ error: "Kategori seç." }, { status: 400 });
    }

    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      return NextResponse.json({ error: "Geçerli satış fiyatı gir." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: row, error: queueError } = await supabase
      .from("tofas_import_queue")
      .select("*")
      .eq("id", queueId)
      .maybeSingle();

    if (queueError) throw queueError;
    if (!row) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("product_code", row.product_code)
      .maybeSingle();

    const purchasePrice =
      Number(row.tofas_last_purchase_price ?? row.tofas_average_cost ?? 0) || 0;

    const productPayload = {
      product_code: row.product_code,
      product_name: row.product_name,
      product_group: category,
      purchase_price: Number(purchasePrice.toFixed(2)),
      profit_margin: 0,
      vat: 20,
      sale_price: Number(salePrice.toFixed(2)),
      stock,
      image_url: "/opar-filtre-banner.png",

      tofas_imported: true,
      tofas_review_required: false,

      tofas_product_name: row.product_name,
      tofas_part_status: row.tofas_part_status,
      tofas_package_quantity: row.tofas_package_quantity,
      tofas_stock_sale_type: row.tofas_stock_sale_type,

      tofas_list_price: row.tofas_list_price,
      tofas_list_price_vat: row.tofas_list_price_vat,
      tofas_service_price: row.tofas_service_price,
      tofas_service_price_vat: row.tofas_service_price_vat,
      tofas_dealer_price: row.tofas_dealer_price,
      tofas_dealer_price_vat: row.tofas_dealer_price_vat,
      tofas_retail_price: row.tofas_retail_price,
      tofas_retail_price_vat: row.tofas_retail_price_vat,
      tofas_main_dealer_price: row.tofas_main_dealer_price,
      tofas_main_dealer_price_vat: row.tofas_main_dealer_price_vat,

      tofas_last_sale_price: row.tofas_last_sale_price,
      tofas_average_cost: row.tofas_average_cost,
      tofas_last_purchase_price: row.tofas_last_purchase_price,
      tofas_price_change_date: row.tofas_price_change_date,
      tofas_last_purchase_date: row.tofas_last_purchase_date,

      tofas_sync_status: "OK",
      tofas_sync_error: null,
      tofas_last_sync: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("products")
        .insert(productPayload);

      if (error) throw error;
    }

    const { error: queueUpdateError } = await supabase
      .from("tofas_import_queue")
      .update({
        status: "published",
        selected_category: category,
        selected_stock: stock,
        selected_sale_price: salePrice,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", queueId);

    if (queueUpdateError) throw queueUpdateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yayınlanamadı." },
      { status: 500 }
    );
  }
}
