import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type ImportRow = {
  productCode: string;
  name: string;
  category?: string;
  purchasePrice?: number;
  profitMargin?: number;
  vatRate?: number;
  salePrice?: number;
  stock?: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { rows?: ImportRow[] };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: 'Aktarılacak ürün bulunamadı.' }, { status: 400 });
    }

    const cleaned = body.rows.map((row) => ({
      product_code: String(row.productCode ?? '').trim(),
      name: String(row.name ?? '').trim(),
      category: String(row.category ?? 'Diğer').trim(),
      purchase_price: Number(row.purchasePrice ?? 0),
      profit_margin: Number(row.profitMargin ?? 0),
      vat_rate: Number(row.vatRate ?? 20),
      sale_price: Number(row.salePrice ?? 0),
      stock: Number(row.stock ?? 0),
      updated_at: new Date().toISOString(),
    })).filter((row) => row.product_code && row.name);

    if (!cleaned.length) {
      return NextResponse.json({ error: 'Geçerli ürün satırı bulunamadı.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .upsert(cleaned, { onConflict: 'product_code' })
      .select('product_code');

    if (error) throw error;
    return NextResponse.json({ success: true, count: data?.length ?? cleaned.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
