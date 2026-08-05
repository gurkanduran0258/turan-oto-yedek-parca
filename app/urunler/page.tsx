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

function normalizeCategory(value: string | null): string {
  const text = (value || "Diğer").trim().toLocaleUpperCase("tr-TR");

  if (text.includes("FİLTRE") || text.includes("FILTRE")) {
    return "Filtre";
  }

  if (
    text.includes("FREN") ||
    text.includes("BALATA") ||
    text.includes("DİSK") ||
    text.includes("DISK")
  ) {
    return "Fren";
  }

  if (
    text.includes("ELEKTRİK") ||
    text.includes("ELEKTRIK") ||
    text.includes("BOBİN") ||
    text.includes("BOBIN") ||
    text.includes("BUJİ") ||
    text.includes("BUJI")
  ) {
    return "Elektrik";
  }

  if (
    text.includes("SÜSPANSİYON") ||
    text.includes("SUSPANSIYON") ||
    text.includes("AMORTİSÖR") ||
    text.includes("AMORTISOR") ||
    text.includes("ROT") ||
    text.includes("TAKOZ")
  ) {
    return "Süspansiyon";
  }

  if (
    text.includes("KAPORTA") ||
    text.includes("TAMPON") ||
    text.includes("ÇAMURLUK") ||
    text.includes("CAMURLUK") ||
    text.includes("KAPUT") ||
    text.includes("KAPI")
  ) {
    return "Kaporta";
  }

  if (
    text.includes("MOTOR") ||
    text.includes("EKSANTRİK") ||
    text.includes("EKSANTRIK") ||
    text.includes("ENJEKTÖR") ||
    text.includes("ENJEKTOR") ||
    text.includes("MANİFOLD") ||
    text.includes("MANIFOLD")
  ) {
    return "Motor";
  }

  return value?.trim() || "Diğer";
}

function toCardProduct(product: DatabaseProduct): CartProduct {
  const price = Number(product.sale_price || 0);
  const stock = Number(product.stock || 0);

  return {
    id: product.id,
    name: product.product_name || "İsimsiz Ürün",
    brand: "OPAR",
    category: normalizeCategory(product.product_group),
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

        const responseText = await response.text();

        if (!responseText.trim()) {
          throw new Error(
            `Ürün servisi boş cevap verdi. HTTP: ${response.status}`
          );
        }

        let result: ProductsResponse;

        try {
          result = JSON.parse(responseText) as ProductsResponse;
        } catch {
          throw new Error("Ürün servisinden geçersiz cevap geldi.");
        }

        if (!response.ok) {
          throw new Error(result.error || "Ürünler getirilemedi.");
        }

        const mappedProducts = (result.products || []).map(toCardProduct);

        setProducts(mappedProducts);
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

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(products.map((product) => product.category))
    ).sort((a, b) => a.localeCompare(b, "tr"));

    return ["Tümü", ...dynamicCategories];
  }, [products]);

  const list = useMemo(() => {
    let output = products.filter((product) => {
      const matchesCategory =
        category === "Tümü" || product.category === category;

      const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

      const matchesQuery =
        !normalizedQuery ||
        product.name
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery) ||
        product.oem
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    if (sort === "asc") {
      output = [...output].sort((a, b) => a.price - b.price);
    }

    if (sort === "desc") {
      output = [...output].sort((a, b) => b.price - a.price);
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
          <h3>Kategori</h3>

          {categories.map((item) => (
            <label key={item}>
              <input
                type="radio"
                name="category"
                checked={category === item}
                onChange={() => setCategory(item)}
              />{" "}
              {item}
            </label>
          ))}
        </aside>

        <section>
          <div className="toolbar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ürün veya OEM ara..."
            />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">Önerilen</option>
              <option value="asc">Fiyat artan</option>
              <option value="desc">Fiyat azalan</option>
            </select>
          </div>

          {error ? (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              Ürünler yükleniyor...
            </div>
          ) : list.length > 0 ? (
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
                padding: "40px",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              Bu filtreye uygun ürün bulunamadı.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
