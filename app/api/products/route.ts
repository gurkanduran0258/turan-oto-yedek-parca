import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Görsel yükleme isteği form-data olarak gönderilmedi.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Görsel dosyası bulunamadı.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece JPG, PNG veya WEBP yüklenebilir.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Görsel en fazla 5 MB olabilir.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
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
