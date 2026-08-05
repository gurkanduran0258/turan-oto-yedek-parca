import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı.' },
        { status: 400 }
      );
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      image_url: data.publicUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Görsel yüklenemedi.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
