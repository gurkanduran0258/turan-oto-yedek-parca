import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ImportProduct = {
  product_code?: string;
  product_name?: string;
  product_group?: string | null;
  purchase_price?: number;
  profit_margin?: number;
  vat?: number;
  sale_price?: number;
  stock?: number;
  image_url?: string;
};

type SerpImage = {
  title?: string;
  original?: string;
  thumbnail?: string;
  source?: string;
  link?: string;
  original_width?: number;
  original_height?: number;
};

function unauthorized() {
  return NextResponse.json(
    { success: false, product_code: "", error: "Yetkisiz işlem." },
    { status: 401 }
  );
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chooseBestImage(
  images: SerpImage[],
  productCode: string,
  productName: string
): SerpImage | null {
  const code = normalize(productCode).replace(/\s+/g, "");
  const usefulTokens = normalize(productName)
    .split(" ")
    .filter((token) => token.length >= 4)
    .slice(0, 8);

  const scored = images
    .map((image) => {
      const text = normalize(
        [image.title, image.source, image.link, image.original]
          .filter(Boolean)
          .join(" ")
      );
      const compactText = text.replace(/\s+/g, "");
      let score = 0;

      if (code && compactText.includes(code)) score += 100;

      for (const token of usefulTokens) {
        if (text.includes(token)) score += 8;
      }

      if (text.includes("opar")) score += 14;
      if (text.includes("mopar")) score += 8;
      if (text.includes("fiat")) score += 6;
      if (text.includes("yedek parca")) score += 5;

      if (text.includes("logo")) score -= 35;
      if (text.includes("diagram")) score -= 18;
      if (text.includes("sema")) score -= 18;
      if (text.includes("icon")) score -= 25;

      const pixels =
        Number(image.original_width || 0) * Number(image.original_height || 0);
      if (pixels >= 250_000) score += 6;
      if (pixels >= 1_000_000) score += 4;

      return { image, score };
    })
    .filter((item) => item.image.original || item.image.thumbnail)
    .sort((a, b) => b.score - a.score);

  // Kod hiç eşleşmediyse düşük güvenli sonucu kabul etmiyoruz.
  if (!scored.length || scored[0].score < 30) return null;

  return scored[0].image;
}

async function searchImage(productCode: string, productName: string) {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY Vercel ortam değişkenine eklenmemiş.");
  }

  const query = `"${productCode}" "${productName}" OPAR Fiat yedek parça`;

  const params = new URLSearchParams({
    engine: "google_images",
    q: query,
    api_key: apiKey,
    google_domain: "google.com.tr",
    gl: "tr",
    hl: "tr",
    safe: "active",
    tbs: "itp:photos,isz:m",
  });

  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Görsel arama servisi: ${response.status} ${text.slice(0, 180)}`);
  }

  const payload = JSON.parse(text) as {
    images_results?: SerpImage[];
    error?: string;
  };

  if (payload.error) throw new Error(payload.error);

  return chooseBestImage(
    Array.isArray(payload.images_results) ? payload.images_results : [],
    productCode,
    productName
  );
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function downloadImage(imageUrl: string) {
  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fotoğraf indirilemedi: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    throw new Error("Bulunan bağlantı bir görsel dosyası değil.");
  }

  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > 5 * 1024 * 1024) {
    throw new Error("Bulunan görsel 5 MB sınırını aşıyor.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    throw new Error("Görsel boş veya 5 MB sınırından büyük.");
  }

  return {
    buffer,
    contentType,
    extension: extensionFromContentType(contentType),
  };
}

async function saveImageToStorage(
  sourceUrl: string,
  productCode: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const image = await downloadImage(sourceUrl);

  const safeCode = productCode.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const storagePath = `auto/${safeCode}.${image.extension}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, image.buffer, {
      contentType: image.contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw new Error(`Storage yükleme hatası: ${error.message}`);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  const suppliedPassword = request.headers.get("x-admin-password") || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword || suppliedPassword !== adminPassword) {
    return unauthorized();
  }

  let productCode = "";

  try {
    const body = (await request.json()) as ImportProduct;

    productCode = String(body.product_code || "").trim();
    const productName = String(body.product_name || "").trim();

    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,
          product_code: productCode,
          error: "Ürün kodu ve parça adı zorunludur.",
        },
        { status: 400 }
      );
    }

    let finalImageUrl = String(body.image_url || "").trim();
    let imageSource: string | null = finalImageUrl || null;
    let imageStatus = finalImageUrl
      ? "Excel görseli Supabase’e kopyalandı."
      : "Fotoğraf bulunamadı.";

    try {
      if (!finalImageUrl) {
        const candidate = await searchImage(productCode, productName);

        if (candidate) {
          imageSource = candidate.original || candidate.thumbnail || null;
        }
      }

      if (imageSource) {
        try {
          finalImageUrl = await saveImageToStorage(imageSource, productCode);
        } catch (firstDownloadError) {
          // Bazı kaynak siteler orijinal resmi engeller; SerpApi küçük resmi yedek olur.
          if (!body.image_url) {
            const candidate = await searchImage(productCode, productName);
            const fallback = candidate?.thumbnail;

            if (fallback && fallback !== imageSource) {
              imageSource = fallback;
              finalImageUrl = await saveImageToStorage(fallback, productCode);
            } else {
              throw firstDownloadError;
            }
          } else {
            throw firstDownloadError;
          }
        }

        imageStatus = "Fotoğraf bulundu ve Supabase Storage’a kaydedildi.";
      }
    } catch (imageError) {
      imageStatus =
        imageError instanceof Error
          ? `Ürün kaydedildi; fotoğraf alınamadı: ${imageError.message}`
          : "Ürün kaydedildi; fotoğraf alınamadı.";
    }

    const purchasePrice = Number(body.purchase_price || 0);
    const profitMargin = Number(body.profit_margin || 0);
    const vat = Number(body.vat || 20);

    const calculatedSalePrice =
      purchasePrice * (1 + profitMargin / 100) * (1 + vat / 100);

    const productData = {
      product_code: productCode,
      product_name: productName,
      product_group: String(body.product_group || "Diğer").trim() || "Diğer",
      purchase_price: purchasePrice,
      profit_margin: profitMargin,
      vat,
      sale_price: Number(body.sale_price || calculatedSalePrice || 0),
      stock: Math.max(0, Math.trunc(Number(body.stock || 0))),
      image_url: finalImageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("products")
      .upsert(productData, {
        onConflict: "product_code",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      product_code: productCode,
      product_name: productName,
      image_url: finalImageUrl || null,
      image_source: imageSource,
      image_status: imageStatus,
      product: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        product_code: productCode,
        error: error instanceof Error ? error.message : "Ürün aktarılamadı.",
      },
      { status: 500 }
    );
  }
}
