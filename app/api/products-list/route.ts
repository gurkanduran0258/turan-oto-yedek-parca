import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('pageSize') || 25)));
  const q = String(url.searchParams.get('q') || '').trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from('products').select('*', { count: 'exact' });
  if (q) {
    const safe = q.replaceAll(',', ' ');
    query = query.or(`product_code.ilike.%${safe}%,product_name.ilike.%${safe}%,product_group.ilike.%${safe}%`);
  }
  const { data, error, count } = await query.order('updated_at', { ascending: false }).range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [], total: count || 0, page, pageSize });
}
