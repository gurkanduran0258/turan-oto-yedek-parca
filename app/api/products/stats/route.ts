import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ count: total, error: totalError }, { count: inStock, error: stockError }, { data: latest, error: latestError }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).gt('stock', 0),
      supabase.from('products').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (totalError || stockError || latestError) throw totalError || stockError || latestError;
    return NextResponse.json({ total: total ?? 0, inStock: inStock ?? 0, outOfStock: (total ?? 0) - (inStock ?? 0), lastUpdate: latest?.updated_at ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'İstatistik alınamadı.' }, { status: 500 });
  }
}
