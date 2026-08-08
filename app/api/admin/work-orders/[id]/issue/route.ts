import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type P = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: P) {
  try {
    const { id } = await params;
    const workOrderId = Number(id);

    if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
      return NextResponse.json(
        { error: "Geçersiz iş emri." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // İş emrini bul
    const { data: order, error: orderError } = await supabase
      .from("work_orders")
      .select("id, work_order_no, stock_issued")
      .eq("id", workOrderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "İş emri bulunamadı." },
        { status: 404 }
      );
    }

    if (order.stock_issued) {
      return NextResponse.json(
        { error: "Bu iş emrinin stok çıkışı zaten yapılmış." },
        { status: 400 }
      );
    }

    // İş emrindeki parçaları getir
    const { data: items, error: itemsError } = await supabase
      .from("work_order_items")
      .select(
        "product_id, product_code, product_name, quantity"
      )
      .eq("work_order_id", workOrderId);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "İş emrinde parça bulunmuyor." },
        { status: 400 }
      );
    }

    // Önce bütün parçaların stok yeterliliğini kontrol et
    for (const item of items) {
      const { data: serviceStock, error: stockError } =
        await supabase
          .from("service_stock")
          .select("quantity")
          .eq("product_id", item.product_id)
          .maybeSingle();

      if (stockError) {
        return NextResponse.json(
          { error: stockError.message },
          { status: 500 }
        );
      }

      const available = Number(serviceStock?.quantity ?? 0);
      const required = Number(item.quantity ?? 0);

      if (available < required) {
        return NextResponse.json(
          {
            error:
              `${item.product_code} - ${item.product_name} için ` +
              `servis stoğu yetersiz. Mevcut: ${available}, ` +
              `Gerekli: ${required}`,
          },
          { status: 400 }
        );
      }
    }

    // Stokları düş
    for (const item of items) {
      const { data: serviceStock, error: stockReadError } =
        await supabase
          .from("service_stock")
          .select("quantity")
          .eq("product_id", item.product_id)
          .maybeSingle();

      if (stockReadError) {
        return NextResponse.json(
          { error: stockReadError.message },
          { status: 500 }
        );
      }

      if (!serviceStock) {
        return NextResponse.json(
          {
            error:
              `${item.product_code} için servis stok kaydı bulunamadı.`,
          },
          { status: 400 }
        );
      }

      const before = Number(serviceStock.quantity ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const after = before - quantity;

      if (after < 0) {
        return NextResponse.json(
          {
            error:
              `${item.product_code} için servis stoğu yetersiz.`,
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("service_stock")
        .update({
          quantity: after,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", item.product_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Stok hareketi oluştur
      const { error: movementError } = await supabase
        .from("service_stock_movements")
        .insert({
          product_id: item.product_id,
          work_order_id: workOrderId,
          movement_type: "İŞ EMRİ ÇIKIŞI",
          quantity: -quantity,
          stock_before: before,
          stock_after: after,
          note: order.work_order_no,
        });

      if (movementError) {
        return NextResponse.json(
          { error: movementError.message },
          { status: 500 }
        );
      }
    }

    // İş emrini güncelle
    const { error: workOrderUpdateError } = await supabase
      .from("work_orders")
      .update({
        stock_issued: true,
        stock_returned: false,
        status: "Onarımda",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workOrderId);

    if (workOrderUpdateError) {
      return NextResponse.json(
        { error: workOrderUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Parçalar servis stoğundan başarıyla düşüldü.",
    });
  } catch (error) {
    console.error("WORK ORDER STOCK ISSUE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stok çıkışı sırasında hata oluştu.",
      },
      { status: 500 }
    );
  }
}
