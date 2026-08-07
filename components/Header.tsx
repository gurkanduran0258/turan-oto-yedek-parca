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
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  User as SupabaseUser,
} from "@supabase/supabase-js";

import { useCart } from "./CartProvider";
import { supabase } from "@/lib/supabase-client";

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

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * KULLANICI OTURUMU
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
    } =
      supabase.auth.onAuthStateChange(
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
   * MENÜ DIŞINA TIKLANDIĞINDA KAPAT
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
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
   * ÜST ARAMA
   */
  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query =
      searchQuery.trim();

    if (!query) {
      window.location.href =
        "/urunler";

      return;
    }

    window.location.href =
      `/urunler?q=${encodeURIComponent(
        query
      )}`;
  }

  /*
   * ÇIKIŞ
   */
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
      {/* ÜST BAR */}
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
            &nbsp;
            Sipariş Takip
            &nbsp;
            Yardım
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="container headerInner">

          {/* LOGO */}
          <Link
            href="/"
            className="logo"
          >
            <img
              src="/turan-oto-logo-transparent.png"
              alt="Turan Oto Yedek Parça"
            />
          </Link>

          {/* ARAMA */}
          <form
            className="search"
            onSubmit={handleSearch}
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
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

          {/* SAĞ MENÜ */}
          <nav className="headerActions">

            <a href="tel:02122271217">
              <Phone size={18} />
              0212 227 12 17
            </a>

            {/* KULLANICI */}
            {loadingUser ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: 0.6,
                }}
              >
                <User size={18} />
                ...
              </span>
            ) : user ? (
              <div
                ref={menuRef}
                style={{
                  position: "relative",
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    padding: 0,
                  }}
                >
                  <User size={18} />

                  {firstName}

                  <ChevronDown
                    size={14}
                    style={{
                      transform:
                        menuOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition:
                        "transform 0.2s",
                    }}
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
                        "220px",
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "10px",
                      boxShadow:
                        "0 12px 35px rgba(0,0,0,0.14)",
                      zIndex: 9999,
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
                      <strong
                        style={{
                          display:
                            "block",
                          color:
                            "#0f172a",
                          fontSize:
                            "14px",
                        }}
                      >
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
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                      style={
                        menuItemStyle
                      }
                    >
                      <User
                        size={16}
                      />
                      Profilim
                    </Link>

                    <Link
                      href="/hesabim/siparisler"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
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
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
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
                        width: "100%",
                        border: "none",
                        background:
                          "#ffffff",
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

            {/* SEPET */}
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

      {/* KIRMIZI MENÜ */}
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
