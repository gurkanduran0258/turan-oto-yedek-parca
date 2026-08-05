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

const finite = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { rows?: ImportRow[] };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: 'Aktarılacak ürün bulunamadı.' }, { status: 400 });
    }

    const cleaned = body.rows.map((row) => ({
      product_code: String(row.productCode ?? '').trim(),
      product_name: String(row.name ?? '').trim(),
      product_group: String(row.category ?? 'Diğer').trim() || 'Diğer',
      purchase_price: finite(row.purchasePrice),
      profit_margin: finite(row.profitMargin),
      vat: finite(row.vatRate, 20),
      sale_price: finite(row.salePrice),
      stock: Math.trunc(finite(row.stock)),
      updated_at: new Date().toISOString(),
    })).filter((row) => row.product_code && row.product_name && row.sale_price > 0);

    if (!cleaned.length) {
      return NextResponse.json({ error: 'Geçerli ürün satırı bulunamadı.' }, { status: 400 });
    }

    const codes = cleaned.map((row) => row.product_code);
    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from('products').select('product_code').in('product_code', codes);
    if (existingError) throw existingError;
    const existingCodes = new Set((existing ?? []).map((item) => item.product_code));

    const { error } = await supabase.from('products').upsert(cleaned, { onConflict: 'product_code' });
    if (error) throw error;

    const updated = cleaned.filter((row) => existingCodes.has(row.product_code)).length;
    return NextResponse.json({ success: true, total: cleaned.length, updated, created: cleaned.length - updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
