import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const payload = {
    product_code: String(body.product_code || '').trim(),
    product_name: String(body.product_name || '').trim(),
    product_group: String(body.product_group || '').trim(),
    purchase_price: Number(body.purchase_price || 0),
    profit_margin: Number(body.profit_margin || 0),
    vat: Number(body.vat ?? 20),
    sale_price: Number(body.sale_price || 0),
    stock: Number(body.stock || 0),
    image_url: body.image_url ? String(body.image_url) : null,
    updated_at: new Date().toISOString(),
  };
  if (!payload.product_code || !payload.product_name) {
    return NextResponse.json({ error: 'Ürün kodu ve parça adı zorunludur.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('products').update(payload).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
