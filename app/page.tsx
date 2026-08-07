"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

type ApiProduct = {
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

function normalizeCategory(value: string | null | undefined) {
  const text = (value || "").trim().toLocaleLowerCase("tr-TR");

  if (!text) return "Diğer";

  if (
    text === "filtreler" ||
    text.includes("filtre")
  ) {
    return "Filtre";
  }

  if (
    text === "fren sistemi" ||
    text.includes("fren")
  ) {
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

  if (text === "yağ" || text === "yag") {
    return "Yağ";
  }

  if (
    text.includes("şanzıman") ||
    text.includes("sanziman")
  ) {
    return "Şanzıman";
  }

  return (
    value?.trim() ||
    "Diğer"
  );
}

function mapProduct(product: ApiProduct): Product {
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

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [query, setQuery] =
    useState("");

  const [category, setCategory] =
    useState("Tümü");

  const [sort, setSort] =
    useState("featured");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * URL'DEKİ:
   *
   * /urunler?q=71751128E
   * /urunler?category=Filtre
   *
   * DEĞERLERİNİ OKUR.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const urlQuery =
      params.get("q");

    const urlCategory =
      params.get("category");

    if (urlQuery) {
      setQuery(
        urlQuery.trim()
      );
    }

    if (urlCategory) {
      setCategory(
        normalizeCategory(
          urlCategory
        )
      );
    }
  }, []);

  /*
   * GERÇEK ÜRÜNLERİ API'DEN ÇEK
   */
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/products-list?page=1&pageSize=200",
            {
              cache: "no-store",
            }
          );

        const text =
          await response.text();

        if (!response.ok) {
          throw new Error(
            text ||
              `Ürünler alınamadı. HTTP ${response.status}`
          );
        }

        let result: {
          products?: ApiProduct[];
          error?: string;
        };

        try {
          result =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Sunucu geçersiz ürün verisi döndürdü."
          );
        }

        if (result.error) {
          throw new Error(
            result.error
          );
        }

        const apiProducts =
          Array.isArray(
            result.products
          )
            ? result.products
            : [];

        setProducts(
          apiProducts.map(
            mapProduct
          )
        );
      } catch (requestError) {
        console.error(
          requestError
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Ürünler yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  /*
   * ARAMA + KATEGORİ + SIRALAMA
   */
  const filteredProducts =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      let output =
        products.filter(
          (product) => {
            const productCategory =
              normalizeCategory(
                product.category
              );

            const categoryMatch =
              category === "Tümü" ||
              productCategory ===
                category;

            if (!categoryMatch) {
              return false;
            }

            if (!search) {
              return true;
            }

            const name =
              product.name
                .toLocaleLowerCase(
                  "tr-TR"
                );

            const oem =
              product.oem
                .toLocaleLowerCase(
                  "tr-TR"
                );

            const brand =
              product.brand
                .toLocaleLowerCase(
                  "tr-TR"
                );

            const group =
              productCategory
                .toLocaleLowerCase(
                  "tr-TR"
                );

            return (
              name.includes(
                search
              ) ||
              oem.includes(
                search
              ) ||
              brand.includes(
                search
              ) ||
              group.includes(
                search
              )
            );
          }
        );

      if (
        sort === "asc"
      ) {
        output = [
          ...output,
        ].sort(
          (a, b) =>
            a.price -
            b.price
        );
      }

      if (
        sort === "desc"
      ) {
        output = [
          ...output,
        ].sort(
          (a, b) =>
            b.price -
            a.price
        );
      }

      if (
        sort === "name"
      ) {
        output = [
          ...output,
        ].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "tr"
            )
        );
      }

      return output;
    }, [
      products,
      query,
      category,
      sort,
    ]);

  function selectCategory(
    value: string
  ) {
    setCategory(value);

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      value === "Tümü"
    ) {
      params.delete(
        "category"
      );
    } else {
      params.set(
        "category",
        value
      );
    }

    const nextUrl =
      params.toString()
        ? `/urunler?${params.toString()}`
        : "/urunler";

    window.history.replaceState(
      {},
      "",
      nextUrl
    );
  }

  function handleSearch(
    value: string
  ) {
    setQuery(value);

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      value.trim()
    ) {
      params.set(
        "q",
        value
      );
    } else {
      params.delete("q");
    }

    const nextUrl =
      params.toString()
        ? `/urunler?${params.toString()}`
        : "/urunler";

    window.history.replaceState(
      {},
      "",
      nextUrl
    );
  }

  return (
    <>
      <section className="pageTitle">
        <div className="container">
          <small>
            Ana Sayfa / Ürünler
          </small>

          <h1>
            Fiat Yedek Parçaları
          </h1>
        </div>
      </section>

      <main
        className="container listingLayout"
      >
        {/* SOL FİLTRE */}
        <aside className="filterPanel">
          <h3>
            Kategori
          </h3>

          {CATEGORIES.map(
            (item) => (
              <label
                key={item}
                style={{
                  cursor:
                    "pointer",
                }}
              >
                <input
                  type="radio"
                  name="category"
                  checked={
                    category ===
                    item
                  }
                  onChange={() =>
                    selectCategory(
                      item
                    )
                  }
                />

                {" "}
                {item}
              </label>
            )
          )}
        </aside>

        {/* ÜRÜNLER */}
        <section>
          <div className="toolbar">
            <input
              value={query}
              onChange={(
                event
              ) =>
                handleSearch(
                  event.target
                    .value
                )
              }
              placeholder="Ürün adı veya OEM kodu ara..."
            />

            <select
              value={sort}
              onChange={(
                event
              ) =>
                setSort(
                  event.target
                    .value
                )
              }
            >
              <option value="featured">
                Önerilen
              </option>

              <option value="asc">
                Fiyat Artan
              </option>

              <option value="desc">
                Fiyat Azalan
              </option>

              <option value="name">
                Ürün Adı A-Z
              </option>
            </select>
          </div>

          {/* SONUÇ BİLGİSİ */}
          {!loading &&
          !error ? (
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "10px",
                margin:
                  "14px 0",
                color:
                  "#64748b",
                fontSize:
                  "14px",
              }}
            >
              <span>
                {
                  filteredProducts.length
                }{" "}
                ürün bulundu
              </span>

              {query ? (
                <button
                  type="button"
                  onClick={() =>
                    handleSearch(
                      ""
                    )
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#c90020",
                    fontWeight:
                      700,
                    cursor:
                      "pointer",
                  }}
                >
                  Aramayı Temizle
                </button>
              ) : null}
            </div>
          ) : null}

          {/* HATA */}
          {error ? (
            <div
              style={{
                padding:
                  "14px",
                margin:
                  "15px 0",
                borderRadius:
                  "8px",
                background:
                  "#fee2e2",
                color:
                  "#991b1b",
                fontWeight:
                  700,
              }}
            >
              {error}
            </div>
          ) : null}

          {/* YÜKLENİYOR */}
          {loading ? (
            <div
              style={{
                padding:
                  "40px",
                textAlign:
                  "center",
                color:
                  "#64748b",
              }}
            >
              Ürünler
              yükleniyor...
            </div>
          ) : null}

          {/* ÜRÜN LİSTESİ */}
          {!loading &&
          !error &&
          filteredProducts.length >
            0 ? (
            <div className="productGrid">
              {filteredProducts.map(
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
              )}
            </div>
          ) : null}

          {/* SONUÇ YOK */}
          {!loading &&
          !error &&
          filteredProducts.length ===
            0 ? (
            <div
              style={{
                padding:
                  "50px 20px",
                marginTop:
                  "15px",
                textAlign:
                  "center",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "10px",
              }}
            >
              <h3>
                Ürün bulunamadı
              </h3>

              <p
                style={{
                  color:
                    "#64748b",
                }}
              >
                Aradığınız ürün adı
                veya OEM kodunu
                kontrol edin.
              </p>

              <button
                type="button"
                className="primary"
                onClick={() => {
                  setQuery("");
                  setCategory(
                    "Tümü"
                  );

                  window.history.replaceState(
                    {},
                    "",
                    "/urunler"
                  );
                }}
              >
                TÜM ÜRÜNLERİ GÖSTER
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
