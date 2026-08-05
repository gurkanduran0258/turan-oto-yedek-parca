import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DatabaseProduct = {
  id: number;
  product_code: string;
  product_name: string;
  product_group: string | null;
  purchase_price: number | string | null;
  profit_margin: number | string | null;
  vat: number | string | null;
  sale_price: number | string | null;
  stock: number | null;
  image_url: string | null;
};

async function getProduct(id: string): Promise<DatabaseProduct | null> {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      product_code,
      product_name,
      product_group,
      purchase_price,
      profit_margin,
      vat,
      sale_price,
      stock,
      image_url
    `)
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    console.error("Ürün detay hatası:", error.message);
    return null;
  }

  return data as DatabaseProduct | null;
}

export default async function ProductDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const salePrice = Number(product.sale_price || 0);
  const oldPrice =
    salePrice > 0 ? Math.round(salePrice * 1.1) : 0;

  const image =
    product.image_url || "/opar-filtre-banner.png";

  const stock = Number(product.stock || 0);

  return (
    <main className="container">
      <div
        style={{
          padding: "24px 0 10px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#111827",
            textDecoration: "none",
          }}
        >
          ← Ana sayfaya dön
        </Link>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 1fr)",
          gap: "30px",
          alignItems: "start",
          padding: "20px 0 60px",
        }}
      >
        <div
          style={{
            border: "1px solid #dbe3ec",
            borderRadius: "12px",
            padding: "24px",
            minHeight: "460px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          <img
            src={image}
            alt={product.product_name}
            style={{
              width: "100%",
              maxWidth: "580px",
              maxHeight: "520px",
              objectFit: "contain",
            }}
          />
        </div>

        <div>
          <span
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: "999px",
              background: stock > 0 ? "#047857" : "#dc0023",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {stock > 0 ? "Stokta" : "Tükendi"}
          </span>

          <h1
            style={{
              fontSize: "36px",
              lineHeight: 1.15,
              margin: "0 0 18px",
              color: "#0f172a",
            }}
          >
            {product.product_name}
          </h1>

          <p
            style={{
              fontSize: "17px",
              marginBottom: "12px",
            }}
          >
            OPAR • {product.product_group || "Diğer"}
          </p>

          <p
            style={{
              fontSize: "17px",
              marginBottom: "14px",
            }}
          >
            OEM: <strong>{product.product_code}</strong>
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <strong
              style={{
                fontSize: "34px",
                color: "#0f172a",
              }}
            >
              {salePrice.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              TL
            </strong>

            {oldPrice > salePrice ? (
              <del
                style={{
                  color: "#94a3b8",
                  fontSize: "16px",
                }}
              >
                {oldPrice.toLocaleString("tr-TR")} TL
              </del>
            ) : null}
          </div>

          <p
            style={{
              color: stock > 0 ? "#047857" : "#b91c1c",
              fontWeight: 700,
              marginBottom: "24px",
            }}
          >
            Stokta {stock} adet
          </p>

          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "#f1f5f9",
              marginBottom: "18px",
            }}
          >
            <strong>Ürün Bilgileri</strong>

            <div
              style={{
                marginTop: "10px",
                display: "grid",
                gap: "8px",
              }}
            >
              <span>
                Ürün grubu:{" "}
                {product.product_group || "Belirtilmemiş"}
              </span>

              <span>
                Ürün kodu: {product.product_code}
              </span>

              <span>
                KDV dahil satış fiyatıdır.
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={stock <= 0}
            style={{
              padding: "14px 24px",
              border: "none",
              borderRadius: "8px",
              background: stock > 0 ? "#dc0023" : "#94a3b8",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "16px",
              cursor: stock > 0 ? "pointer" : "not-allowed",
            }}
          >
            {stock > 0 ? "SEPETE EKLE" : "STOKTA YOK"}
          </button>
        </div>
      </section>
    </main>
  );
}
