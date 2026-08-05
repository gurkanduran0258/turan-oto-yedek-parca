import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Görsel seçilmedi.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Yalnızca görsel dosyası yüklenebilir.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Görsel en fazla 5 MB olabilir.' }, { status: 400 });

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage.from('product-images').upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(path);
    return NextResponse.json({ image_url: data.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Görsel yüklenemedi.' }, { status: 500 });
  }
}
