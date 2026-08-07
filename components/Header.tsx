"use client";

import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Phone,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  User as SupabaseUser,
} from "@supabase/supabase-js";

import { useCart } from "./CartProvider";
import { supabase } from "@/lib/supabase-client";

type SearchProduct = {
  id: number;
  product_code: string;
  product_name: string;
  sale_price: number | string | null;
  stock: number | null;
  image_url: string | null;
};

export default function Header() {
  const { count } = useCart();

  const [user, setUser] =
    useState<SupabaseUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [products, setProducts] =
    useState<SearchProduct[]>([]);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const searchRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * KULLANICI
   */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
        setLoadingUser(false);
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(
          session?.user ?? null
        );

        setLoadingUser(false);

        if (!session?.user) {
          setMenuOpen(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * ARAMA İÇİN ÜRÜNLERİ ÇEK
   */
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/products-list?page=1&pageSize=200",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const result =
          await response.json();

        if (
          Array.isArray(
            result.products
          )
        ) {
          setProducts(
            result.products
          );
        }
      } catch (error) {
        console.error(
          "Header ürün arama:",
          error
        );
      }
    }

    void loadProducts();
  }, []);

  /*
   * DIŞARI TIKLAYINCA MENÜLERİ KAPAT
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(
          target
        )
      ) {
        setMenuOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(
          target
        )
      ) {
        setSearchOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * CANLI ARAMA SONUÇLARI
   */
  const searchResults =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!query) {
        return [];
      }

      return products
        .filter((product) => {
          const code =
            String(
              product.product_code ||
                ""
            ).toLocaleLowerCase(
              "tr-TR"
            );

          const name =
            String(
              product.product_name ||
                ""
            ).toLocaleLowerCase(
              "tr-TR"
            );

          return (
            code.includes(query) ||
            name.includes(query)
          );
        })
        .slice(0, 6);
    }, [
      products,
      searchQuery,
    ]);

  function handleSearchSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const query =
      searchQuery.trim();

    if (!query) {
      return;
    }

    /*
     * TEK ÜRÜN BULUNDUYSA
     * DİREKT ÜRÜNE GİT
     */
    if (
      searchResults.length === 1
    ) {
      window.location.href =
        `/urun/${searchResults[0].id}`;

      return;
    }

    /*
     * BİRDEN FAZLA SONUÇ VARSA
     * ÜRÜNLER SAYFASINDA GÖSTER
     */
    window.location.href =
      `/urunler?q=${encodeURIComponent(
        query
      )}`;
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setMenuOpen(false);

    window.location.href = "/";
  }

  const fullName =
    user?.user_metadata?.full_name ||
    [
      user?.user_metadata?.first_name,
      user?.user_metadata?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "";

  const firstName =
    user?.user_metadata?.first_name ||
    fullName.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Hesabım";

  return (
    <>
      <div className="topbar">
        <div className="container topbarInner">
          <span>
            🚚 Aynı Gün Kargo
            &nbsp; • &nbsp;
            %100 Orijinal Parça
            &nbsp; • &nbsp;
            Turan Oto Güvencesi
          </span>

          <span>
            Bayi / Kurumsal Giriş
            &nbsp; Sipariş Takip
            &nbsp; Yardım
          </span>
        </div>
      </div>

      <header className="header">
        <div className="container headerInner">

          <Link
            href="/"
            className="logo"
          >
            <img
              src="/turan-oto-logo-transparent.png"
              alt="Turan Oto Yedek Parça"
            />
          </Link>

          {/* SADECE BU ARAMA GELİŞTİRİLDİ */}
          <div
            ref={searchRef}
            style={{
              position: "relative",
              flex: 1,
            }}
          >
            <form
              className="search"
              onSubmit={
                handleSearchSubmit
              }
            >
              <input
                type="text"
                value={searchQuery}
                onFocus={() =>
                  setSearchOpen(true)
                }
                onChange={(event) => {
                  setSearchQuery(
                    event.target.value
                  );

                  setSearchOpen(
                    true
                  );
                }}
                placeholder="OEM No, ürün adı veya şasi numarası ile arayın..."
                autoComplete="off"
              />

              <button
                type="submit"
                aria-label="Ara"
              >
                <Search size={22} />
              </button>
            </form>

            {/* CANLI ÜRÜN SONUÇLARI */}
            {searchOpen &&
            searchQuery.trim() ? (
              <div
                style={{
                  position:
                    "absolute",
                  top: "calc(100% + 5px)",
                  left: 0,
                  right: 0,
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "8px",
                  boxShadow:
                    "0 12px 30px rgba(0,0,0,.14)",
                  zIndex: 99999,
                  overflow:
                    "hidden",
                  maxHeight:
                    "420px",
                  overflowY:
                    "auto",
                }}
              >
                {searchResults.length >
                0 ? (
                  searchResults.map(
                    (product) => {
                      const price =
                        Number(
                          product.sale_price ||
                            0
                        );

                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      return (
                        <Link
                          key={
                            product.id
                          }
                          href={`/urun/${product.id}`}
                          onClick={() =>
                            setSearchOpen(
                              false
                            )
                          }
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "60px minmax(0,1fr) auto",
                            gap:
                              "12px",
                            alignItems:
                              "center",
                            padding:
                              "10px 12px",
                            textDecoration:
                              "none",
                            color:
                              "#0f172a",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <img
                            src={
                              product.image_url ||
                              "/opar-filtre-banner.png"
                            }
                            alt={
                              product.product_name
                            }
                            style={{
                              width:
                                "55px",
                              height:
                                "55px",
                              objectFit:
                                "contain",
                            }}
                          />

                          <div>
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "14px",
                              }}
                            >
                              {
                                product.product_name
                              }
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "4px",
                                color:
                                  "#64748b",
                              }}
                            >
                              OEM:{" "}
                              {
                                product.product_code
                              }
                            </small>

                            <small
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "3px",
                                color:
                                  stock >
                                  0
                                    ? "#15803d"
                                    : "#b91c1c",
                              }}
                            >
                              {stock >
                              0
                                ? `Stokta ${stock} adet`
                                : "Stokta Yok"}
                            </small>
                          </div>

                          <strong
                            style={{
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {price.toLocaleString(
                              "tr-TR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            TL
                          </strong>
                        </Link>
                      );
                    }
                  )
                ) : (
                  <div
                    style={{
                      padding:
                        "18px",
                      color:
                        "#64748b",
                      textAlign:
                        "center",
                    }}
                  >
                    Ürün bulunamadı.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <nav className="headerActions">
            <a href="tel:02122271217">
              <Phone size={18} />
              0212 227 12 17
            </a>

            {loadingUser ? (
              <span>
                <User size={18} />
                ...
              </span>
            ) : user ? (
              <div
                ref={menuRef}
                style={{
                  position:
                    "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    border:
                      "none",
                    background:
                      "transparent",
                    cursor:
                      "pointer",
                    font:
                      "inherit",
                    color:
                      "inherit",
                    padding: 0,
                  }}
                >
                  <User size={18} />

                  {firstName}

                  <ChevronDown
                    size={14}
                  />
                </button>

                {menuOpen ? (
                  <div
                    style={{
                      position:
                        "absolute",
                      top: "34px",
                      right: 0,
                      minWidth:
                        "210px",
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "10px",
                      boxShadow:
                        "0 12px 35px rgba(0,0,0,.14)",
                      zIndex:
                        99999,
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding:
                          "13px 14px",
                        borderBottom:
                          "1px solid #eef2f7",
                      }}
                    >
                      <strong>
                        {fullName ||
                          firstName}
                      </strong>

                      <small
                        style={{
                          display:
                            "block",
                          marginTop:
                            "3px",
                          color:
                            "#64748b",
                        }}
                      >
                        {user.email}
                      </small>
                    </div>

                    <Link
                      href="/hesabim"
                      style={
                        menuItemStyle
                      }
                    >
                      <User
                        size={16}
                      />
                      Hesabım
                    </Link>

                    <Link
                      href="/hesabim/siparisler"
                      style={
                        menuItemStyle
                      }
                    >
                      <Package
                        size={16}
                      />
                      Siparişlerim
                    </Link>

                    <Link
                      href="/hesabim/adresler"
                      style={
                        menuItemStyle
                      }
                    >
                      <MapPin
                        size={16}
                      />
                      Adreslerim
                    </Link>

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      style={{
                        ...menuItemStyle,
                        width:
                          "100%",
                        border:
                          "none",
                        background:
                          "#fff",
                        cursor:
                          "pointer",
                        color:
                          "#b91c1c",
                      }}
                    >
                      <LogOut
                        size={16}
                      />
                      Çıkış Yap
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/giris">
                <User size={18} />
                Giriş
              </Link>
            )}

            <Link href="/sepet">
              <ShoppingCart
                size={18}
              />
              Sepet
              <b>{count}</b>
            </Link>
          </nav>
        </div>
      </header>

      {/* ESKİ KIRMIZI MENÜ AYNI */}
      <nav className="mainNav">
        <div className="container navInner">
          <Link href="/urunler">
            ☰ TÜM KATEGORİLER
          </Link>

          <Link href="/urunler?category=Filtre">
            FİLTRELER
          </Link>

          <Link href="/urunler?category=Fren">
            FREN SİSTEMİ
          </Link>

          <Link href="/urunler?category=Elektrik">
            ELEKTRİK
          </Link>

          <Link href="/urunler?category=Kaporta">
            KAPORTA
          </Link>

          <Link href="/urunler?category=Süspansiyon">
            SÜSPANSİYON
          </Link>

          <Link href="/sasi-sorgula">
            ŞASİ SORGULA
          </Link>
        </div>
      </nav>
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "11px 14px",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: "14px",
  textAlign: "left",
};
