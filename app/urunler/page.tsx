"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { CartProduct } from "@/components/CartProvider";

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

type ProductsResponse = {
  products: DatabaseProduct[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

const CATEGORIES = [
  "Tümü",
  "Motor",
  "Fren",
  "Elektrik",
  "Kaporta",
  "Süspansiyon",
  "Filtre",
  "Yağ",
  "Şanzıman",
];

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C");
}

function detectCategory(product: DatabaseProduct): string {
  const text = normalizeText(
    `${product.product_group || ""} ${product.product_name || ""}`
  );

  // FİLTRE
  if (
    text.includes("FILTRE") ||
    text.includes("POLEN") ||
    text.includes("HAVA FILT") ||
    text.includes("YAKIT FILT")
  ) {
    return "Filtre";
  }

  // YAĞ
  if (
    text.includes("YAG ") ||
    text.includes("YAGI") ||
    text.includes("YAG POMP") ||
    text.includes("MOTOR YAG")
  ) {
    return "Yağ";
  }

  // FREN
  if (
    text.includes("FREN") ||
    text.includes("BALATA") ||
    text.includes("DISK") ||
    text.includes("KALIPER")
  ) {
    return "Fren";
  }

  // ELEKTRİK
  if (
    text.includes("ELEKTRIK") ||
    text.includes("BOBIN") ||
    text.includes("BUJI") ||
    text.includes("ALTERNATOR") ||
    text.includes("MARŞ") ||
    text.includes("MARS") ||
    text.includes("FAR") ||
    text.includes("SENSOR")
  ) {
    return "Elektrik";
  }

  // KAPORTA
  if (
    text.includes("KAPORTA") ||
    text.includes("TAMPON") ||
    text.includes("CAMURLUK") ||
    text.includes("KAPUT") ||
    text.includes("KAPI") ||
    text.includes("PANEL") ||
    text.includes("PANJUR") ||
    text.includes("CITA") ||
    text.includes("BRAKET")
  ) {
    return "Kaporta";
  }

  // SÜSPANSİYON
  if (
    text.includes("SUSPANSIYON") ||
    text.includes("AMORTISOR") ||
    text.includes("ROT BASI") ||
    text.includes("ROTIL") ||
    text.includes("Z ROT") ||
    text.includes("SALINCAK") ||
    text.includes("TRAVERS")
  ) {
    return "Süspansiyon";
  }

  // ŞANZIMAN
  if (
    text.includes("SANZIMAN") ||
    text.includes("SANZUMAN") ||
    text.includes("VITES") ||
    text.includes("DEBRIYAJ") ||
    text.includes("DIFERANSIYEL") ||
    text.includes("DISLI") ||
    text.includes("DCT")
  ) {
    return "Şanzıman";
  }

  // MOTOR
  if (
    text.includes("MOTOR") ||
    text.includes("EKSANTRIK") ||
    text.includes("TRIGER") ||
    text.includes("ZINCIR") ||
    text.includes("ENJEKTOR") ||
    text.includes("MANIFOLD") ||
    text.includes("SILINDIR") ||
    text.includes("SUBAP") ||
    text.includes("KULBUTOR") ||
    text.includes("CONTA")
  ) {
    return "Motor";
  }

  // Tanımlanamayanı şimdilik Motor'a atma.
  // Filtrede "Tümü" altında görünmeye devam eder.
  return "Diğer";
}

function toCardProduct(product: DatabaseProduct): CartProduct {
  const price = Number(product.sale_price || 0);
  const stock = Number(product.stock || 0);

  return {
    id: product.id,
    name: product.product_name || "İsimsiz Ürün",
    brand: "OPAR",
    category: detectCategory(product),
    price,
    oldPrice: price > 0 ? Math.round(price * 1.1) : 0,
    oem: product.product_code || "-",
    stock,
    vehicle: "Fiat",
    image: product.image_url || "/opar-filtre-banner.png",
    badge: stock > 0 ? "Stokta" : "Tükendi",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/products-list?page=1&pageSize=100",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

        if (!text.trim()) {
          throw new Error("Ürün servisi boş cevap verdi.");
        }

        const result = JSON.parse(text) as ProductsResponse;

        if (!response.ok) {
          throw new Error(result.error || "Ürünler getirilemedi.");
        }

        setProducts((result.products || []).map(toCardProduct));
      } catch (requestError) {
        setProducts([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Ürünler getirilemedi."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const item of CATEGORIES) {
      counts[item] = 0;
    }

    counts["Tümü"] = products.length;

    for (const product of products) {
      if (counts[product.category] !== undefined) {
        counts[product.category] += 1;
      }
    }

    return counts;
  }, [products]);

  const list = useMemo(() => {
    const search = query
      .trim()
      .toLocaleLowerCase("tr-TR");

    let output = products.filter((product) => {
      const categoryMatch =
        category === "Tümü" ||
        product.category === category;

      const searchMatch =
        !search ||
        product.name
          .toLocaleLowerCase("tr-TR")
          .includes(search) ||
        product.oem
          .toLocaleLowerCase("tr-TR")
          .includes(search);

      return categoryMatch && searchMatch;
    });

    if (sort === "asc") {
      output = [...output].sort(
        (a, b) => a.price - b.price
      );
    }

    if (sort === "desc") {
      output = [...output].sort(
        (a, b) => b.price - a.price
      );
    }

    return output;
  }, [products, query, category, sort]);

  return (
    <>
      <section className="pageTitle">
        <div className="container">
          <small>Ana Sayfa / Ürünler</small>
          <h1>Fiat Yedek Parçaları</h1>
        </div>
      </section>

      <main className="container listingLayout">
        <aside className="filterPanel">
          <h3>Kategoriler</h3>

          {CATEGORIES.map((item) => (
            <label key={item}>
              <input
                type="radio"
                name="category"
                checked={category === item}
                onChange={() => setCategory(item)}
              />

              <span>{item}</span>

              <small
                style={{
                  marginLeft: "auto",
                  color: "#64748b",
                }}
              >
                {categoryCounts[item] || 0}
              </small>
            </label>
          ))}
        </aside>

        <section>
          <div className="toolbar">
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Ürün adı veya OEM kodu ara..."
            />

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="featured">
                Önerilen
              </option>

              <option value="asc">
                Fiyat: Artan
              </option>

              <option value="desc">
                Fiyat: Azalan
              </option>
            </select>
          </div>

          <div
            style={{
              margin: "12px 0 18px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            <strong>{list.length}</strong> ürün bulundu
          </div>

          {error ? (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: "15px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
              }}
            >
              Ürünler yükleniyor...
            </div>
          ) : list.length ? (
            <div className="productGrid">
              {list.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              Bu kategoride ürün bulunamadı.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
