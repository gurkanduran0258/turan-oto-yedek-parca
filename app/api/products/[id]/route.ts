import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_group?: string | null;
  purchase_price?: number;
  profit_margin?: number;
  vat?: number;
  sale_price?: number;
  stock?: number;
  image_url?: string | null;
};

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz ürün ID.' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as ProductBody;

    const productCode = body.product_code?.trim();
    const productName = body.product_name?.trim();

    if (!productCode) {
      return NextResponse.json(
        { error: 'Ürün kodu zorunludur.' },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        { error: 'Parça adı zorunludur.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const updateData = {
      product_code: productCode,
      product_name: productName,
      product_group: body.product_group?.trim() || null,
      purchase_price: Number(body.purchase_price) || 0,
      profit_margin: Number(body.profit_margin) || 0,
      vat: Number(body.vat) || 20,
      sale_price: Number(body.sale_price) || 0,
      stock: Number(body.stock) || 0,
      image_url: body.image_url?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu ürün kodu başka bir üründe kayıtlı.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ürün güncellenemedi.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz ürün ID.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ürün silinemedi.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
