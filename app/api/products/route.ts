import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!String(body.product_code || '').trim() || !String(body.product_name || '').trim()) {
      return NextResponse.json({ error: 'Ürün kodu ve parça adı zorunludur.' }, { status: 400 });
    }
    const payload = {
      product_code: String(body.product_code).trim(),
      product_name: String(body.product_name).trim(),
      product_group: String(body.product_group || '').trim(),
      purchase_price: Number(body.purchase_price || 0),
      profit_margin: Number(body.profit_margin || 0),
      vat: Number(body.vat ?? 20),
      sale_price: Number(body.sale_price || 0),
      stock: Number(body.stock || 0),
      image_url: body.image_url ? String(body.image_url) : null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ürün eklenirken beklenmeyen hata oluştu.' }, { status: 500 });
  }
}
