import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cats = [
  ["⚙️", "Motor"],
  ["◉", "Fren Sistemi"],
  ["💡", "Elektrik"],
  ["🚘", "Kaporta"],
  ["〽", "Süspansiyon"],
  ["▥", "Filtreler"],
  ["🧴", "Yağ"],
  ["⚙", "Şanzıman"],
];

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
  created_at: string | null;
  updated_at: string | null;
};

async function getFeaturedProducts() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        product_code,
        product_name,
        product_group,
        purchase_price,
        profit_margin,
        vat,
        sale_price,
        stock,
        image_url,
        created_at,
        updated_at
      `
    )
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Ana sayfa ürünleri alınamadı:", error.message);
    return [];
  }

  return ((data || []) as DatabaseProduct[]).map((product) => {
    const salePrice = Number(product.sale_price || 0);
    const purchasePrice = Number(product.purchase_price || 0);

    /*
      ProductCard eski ürün yapısını kullanıyor olabilir.
      Bu nedenle hem eski hem yeni alan adlarını birlikte gönderiyoruz.
    */
    return {
      id: product.id,

      code: product.product_code,
      product_code: product.product_code,
      productCode: product.product_code,
      oem: product.product_code,

      name: product.product_name,
      title: product.product_name,
      product_name: product.product_name,

      category: product.product_group || "Diğer",
      group: product.product_group || "Diğer",
      product_group: product.product_group || "Diğer",

      price: salePrice,
      salePrice,
      sale_price: salePrice,

      purchasePrice,
      purchase_price: purchasePrice,

      oldPrice: null,
      old_price: null,

      stock: Number(product.stock || 0),

      image:
        product.image_url ||
        "/urun-placeholder.png",
      imageUrl:
        product.image_url ||
        "/urun-placeholder.png",
      image_url:
        product.image_url ||
        "/urun-placeholder.png",

      slug: String(product.product_code)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    };
  });
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <main className="container">
      <section className="heroGrid">
        <aside className="vehicleBox">
          <h2>ARACINI SEÇ</h2>
          <p>Aracına uygun parçaları görüntüle</p>

          <select defaultValue="Fiat">
            <option>Fiat</option>
          </select>

          <select defaultValue="">
            <option value="">Model Seçin</option>
            <option>Egea</option>
            <option>Doblo</option>
            <option>Fiorino</option>
            <option>Linea</option>
          </select>

          <select defaultValue="">
            <option value="">Yıl Seçin</option>
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
          </select>

          <select defaultValue="">
            <option value="">Motor Seçin</option>
            <option>1.3 Multijet</option>
            <option>1.4 Fire</option>
          </select>

          <Link href="/urunler" className="primary">
            PARÇALARI LİSTELE
          </Link>
        </aside>

        <div className="heroImage heroCampaign">
          <div className="heroCopy">
            <span>TURAN OTO GÜVENCESİYLE</span>

            <h1>
              ORİJİNAL FIAT
              <br />
              <b>YEDEK PARÇA</b>
            </h1>

            <p>
              Opar filtre kitleri, bakım ürünleri ve mekanik parçalar
            </p>

            <Link href="/urunler" className="heroButton">
              ALIŞVERİŞE BAŞLA
            </Link>
          </div>

          <div className="heroVisual">
            <img
              src="/opar-filtre-banner.png"
              alt="Opar filtre bakım seti"
            />
          </div>
        </div>

        <aside className="trustBox">
          <div>
            🚚 <b>Aynı Gün Kargo</b>
            <small>16:00&apos;a kadar</small>
          </div>

          <div>
            🛡️ <b>%100 Orijinal</b>
            <small>Kalite garantisi</small>
          </div>

          <div>
            🏷️ <b>Uygun Fiyat</b>
            <small>Doğru parça</small>
          </div>

          <div>
            🎧 <b>7/24 Destek</b>
            <small>Uzman yardım</small>
          </div>
        </aside>
      </section>

      <section className="categoryStrip">
        {cats.map(([icon, name]) => (
          <Link
            href={`/urunler?kategori=${encodeURIComponent(name)}`}
            key={name}
          >
            <span>{icon}</span>
            <b>{name}</b>
          </Link>
        ))}
      </section>

      <div className="sectionHead">
        <h2>ÖNE ÇIKAN ÜRÜNLER</h2>

        <Link href="/urunler">
          Tümünü Gör ›
        </Link>
      </div>

      <section className="productsLayout">
        <aside className="sideCats">
          <h3>KATEGORİLER</h3>

          {cats.map(([, name]) => (
            <Link
              href={`/urunler?kategori=${encodeURIComponent(name)}`}
              key={name}
            >
              {name}
              <span>›</span>
            </Link>
          ))}
        </aside>

        <div className="productGrid">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
              />
            ))
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                width: "100%",
              }}
            >
              Henüz ürün bulunmuyor.
            </div>
          )}
        </div>
      </section>

      <section className="stats">
        <div>
          <b>20+</b>
          <span>Yıllık Tecrübe</span>
        </div>

        <div>
          <b>50.000+</b>
          <span>Ürün Çeşidi</span>
        </div>

        <div>
          <b>100.000+</b>
          <span>Mutlu Müşteri</span>
        </div>

        <div>
          <b>256 Bit</b>
          <span>Güvenli Alışveriş</span>
        </div>
      </section>
    </main>
  );
}
