import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type ProductBody = {
  product_code?: string;
  product_name?: string;
  product_group?: string;
  purchase_price?: number;
  profit_margin?: number;
  vat?: number;
  sale_price?: number;
  stock?: number;
  image_url?: string | null;
};

export async function POST(request: Request) {
  try {
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

    const productData = {
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
      .insert(productData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu ürün kodu zaten kayıtlı.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: data,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ürün kaydedilemedi.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
