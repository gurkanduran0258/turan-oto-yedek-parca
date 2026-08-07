import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DatabaseProduct = {
  id: number;
  product_code: string;
  product_name: string;
  product_group: string | null;
  sale_price: number | string | null;
  stock: number | null;
  image_url: string | null;
};

type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  oem: string;
  stock: number;
  vehicle: string;
  image: string;
  badge: string;
};

const categories = [
  ["⚙️", "Motor", "Motor"],
  ["◉", "Fren Sistemi", "Fren"],
  ["💡", "Elektrik", "Elektrik"],
  ["🚘", "Kaporta", "Kaporta"],
  ["〽", "Süspansiyon", "Süspansiyon"],
  ["▥", "Filtreler", "Filtre"],
  ["🧴", "Yağ", "Yağ"],
  ["⚙", "Şanzıman", "Şanzıman"],
];

function normalizeCategory(
  value: string | null
) {
  const text = (
    value || ""
  )
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (text.includes("filtre")) {
    return "Filtre";
  }

  if (text.includes("fren")) {
    return "Fren";
  }

  if (text.includes("motor")) {
    return "Motor";
  }

  if (text.includes("elektrik")) {
    return "Elektrik";
  }

  if (text.includes("kaporta")) {
    return "Kaporta";
  }

  if (
    text.includes("süspansiyon") ||
    text.includes("suspansiyon")
  ) {
    return "Süspansiyon";
  }

  if (
    text === "yağ" ||
    text === "yag"
  ) {
    return "Yağ";
  }

  if (
    text.includes("şanzıman") ||
    text.includes("sanziman")
  ) {
    return "Şanzıman";
  }

  return value || "Diğer";
}

function mapProduct(
  product: DatabaseProduct
): Product {
  const price = Number(
    product.sale_price || 0
  );

  const stock = Number(
    product.stock || 0
  );

  return {
    id: Number(product.id),

    name:
      product.product_name ||
      "Ürün",

    brand: "OPAR",

    category:
      normalizeCategory(
        product.product_group
      ),

    price,

    oldPrice:
      price > 0
        ? Number(
            (
              price * 1.1
            ).toFixed(2)
          )
        : 0,

    oem:
      product.product_code ||
      "",

    stock,

    vehicle: "",

    image:
      product.image_url ||
      "/opar-filtre-banner.png",

    badge:
      stock > 0
        ? "Stokta"
        : "Tükendi",
  };
}

async function getProducts() {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select(`
      id,
      product_code,
      product_name,
      product_group,
      sale_price,
      stock,
      image_url
    `)
    .order("id", {
      ascending: false,
    })
    .limit(8);

  if (error) {
    console.error(
      "Ana sayfa ürün hatası:",
      error.message
    );

    return [];
  }

  return (
    (data || []) as DatabaseProduct[]
  ).map(mapProduct);
}

export default async function Home() {
  const products =
    await getProducts();

  return (
    <main className="container">

      {/* HERO */}
      <section className="heroGrid">

        {/* SOL */}
        <aside className="vehicleBox">
          <h2>
            ARACINI SEÇ
          </h2>

          <p>
            Aracına uygun parçaları
            görüntüle
          </p>

          <select
            defaultValue="Fiat"
          >
            <option value="Fiat">
              Fiat
            </option>
          </select>

          <select
            defaultValue=""
          >
            <option value="">
              Model Seçin
            </option>

            <option value="Egea">
              Egea
            </option>

            <option value="Doblo">
              Doblo
            </option>

            <option value="Fiorino">
              Fiorino
            </option>

            <option value="Linea">
              Linea
            </option>
          </select>

          <select
            defaultValue=""
          >
            <option value="">
              Yıl Seçin
            </option>

            <option>
              2026
            </option>

            <option>
              2025
            </option>

            <option>
              2024
            </option>

            <option>
              2023
            </option>

            <option>
              2022
            </option>
          </select>

          <select
            defaultValue=""
          >
            <option value="">
              Motor Seçin
            </option>

            <option>
              1.3 Multijet
            </option>

            <option>
              1.4 Fire
            </option>

            <option>
              1.6 Multijet
            </option>
          </select>

          <Link
            href="/urunler"
            className="primary"
          >
            PARÇALARI LİSTELE
          </Link>

          <Link
            href="/sasi-sorgula"
            style={{
              display: "block",
              marginTop: "12px",
              textAlign: "center",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            🔎 ŞASE İLE ARA
          </Link>
        </aside>

        {/* ORTA KAMPANYA */}
        <div className="heroImage heroCampaign">

          <div className="heroCopy">
            <span>
              TURAN OTO GÜVENCESİYLE
            </span>

            <h1>
              ORİJİNAL FIAT
              <br />

              <b>
                YEDEK PARÇA
              </b>
            </h1>

            <p>
              Opar filtre kitleri,
              bakım ürünleri ve mekanik
              parçalar
            </p>

            <Link
              href="/urunler"
              className="heroButton"
            >
              ALIŞVERİŞE BAŞLA
            </Link>
          </div>

          <div className="heroVisual">
            <img
              src="/opar-filtre-banner.png"
              alt="Opar Fiat Yedek Parça"
            />
          </div>

        </div>

        {/* SAĞ */}
        <aside className="trustBox">

          <div>
            🚚

            <b>
              Aynı Gün Kargo
            </b>

            <small>
              16:00'a kadar
            </small>
          </div>

          <div>
            🛡️

            <b>
              %100 Orijinal
            </b>

            <small>
              Kalite garantisi
            </small>
          </div>

          <div>
            🏷️

            <b>
              Uygun Fiyat
            </b>

            <small>
              Doğru parça
            </small>
          </div>

          <div>
            🎧

            <b>
              7/24 Destek
            </b>

            <small>
              Uzman yardım
            </small>
          </div>

        </aside>

      </section>

      {/* KATEGORİLER */}
      <section className="categoryStrip">

        {categories.map(
          ([
            icon,
            title,
            category,
          ]) => (
            <Link
              key={title}
              href={`/urunler?category=${encodeURIComponent(
                category
              )}`}
            >
              <span>
                {icon}
              </span>

              <b>
                {title}
              </b>
            </Link>
          )
        )}

      </section>

      {/* ÖNE ÇIKAN */}
      <div className="sectionHead">

        <h2>
          ÖNE ÇIKAN ÜRÜNLER
        </h2>

        <Link href="/urunler">
          Tümünü Gör ›
        </Link>

      </div>

      <section className="productsLayout">

        {/* SOL KATEGORİLER */}
        <aside className="sideCats">

          <h3>
            KATEGORİLER
          </h3>

          {categories.map(
            ([
              ,
              title,
              category,
            ]) => (
              <Link
                key={title}
                href={`/urunler?category=${encodeURIComponent(
                  category
                )}`}
              >
                {title}

                <span>
                  ›
                </span>
              </Link>
            )
          )}

        </aside>

        {/* GERÇEK SUPABASE ÜRÜNLERİ */}
        <div className="productGrid">

          {products.length > 0 ? (
            products.map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                />
              )
            )
          ) : (
            <div
              style={{
                padding: "30px",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              Henüz ürün bulunamadı.
            </div>
          )}

        </div>

      </section>

      {/* ALT İSTATİSTİK */}
      <section className="stats">

        <div>
          <b>
            20+
          </b>

          <span>
            Yıllık Tecrübe
          </span>
        </div>

        <div>
          <b>
            50.000+
          </b>

          <span>
            Ürün Çeşidi
          </span>
        </div>

        <div>
          <b>
            100.000+
          </b>

          <span>
            Mutlu Müşteri
          </span>
        </div>

        <div>
          <b>
            256 Bit
          </b>

          <span>
            Güvenli Alışveriş
          </span>
        </div>

      </section>

    </main>
  );
}
