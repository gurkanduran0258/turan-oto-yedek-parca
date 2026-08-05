import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type UploadBody = {
  fileName?: string;
  fileType?: string;
  fileData?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadBody;

    const fileName = body.fileName?.trim();
    const fileType = body.fileType?.trim();
    const fileData = body.fileData?.trim();

    if (!fileName || !fileType || !fileData) {
      return NextResponse.json(
        { error: 'Görsel bilgileri eksik gönderildi.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Sadece JPG, PNG veya WEBP yüklenebilir.' },
        { status: 400 }
      );
    }

    const base64Data = fileData.includes(',')
      ? fileData.split(',')[1]
      : fileData;

    const buffer = Buffer.from(base64Data, 'base64');

    if (!buffer.length) {
      return NextResponse.json(
        { error: 'Görsel dosyası okunamadı.' },
        { status: 400 }
      );
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Görsel en fazla 5 MB olabilir.' },
        { status: 400 }
      );
    }

    const extension =
      fileName.split('.').pop()?.toLowerCase() ||
      (fileType === 'image/png'
        ? 'png'
        : fileType === 'image/webp'
          ? 'webp'
          : 'jpg');

    const storagePath =
      `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, {
        contentType: fileType,
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
      .getPublicUrl(storagePath);

    return NextResponse.json({
      image_url: data.publicUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Görsel yüklenemedi.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
