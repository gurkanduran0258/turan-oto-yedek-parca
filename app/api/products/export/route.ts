import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin().from('products').select('*').order('product_name');
    if (error) throw error;
    const headers = ['Ürün Kodu','Parça Adı','Ürün Grubu','Alış','Kar Marjı','KDV','Satış Rakamı Kdv Dahil','Stok'];
    const lines = [headers.map(csvCell).join(';'), ...(data ?? []).map((p) => [p.product_code,p.product_name,p.product_group,p.purchase_price,p.profit_margin,p.vat,p.sale_price,p.stock].map(csvCell).join(';'))];
    return new NextResponse('\uFEFF' + lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="turan-oto-urunler.csv"' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dışa aktarma başarısız.' }, { status: 500 });
  }
}
