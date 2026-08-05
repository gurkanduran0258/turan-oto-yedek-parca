"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, Phone } from "lucide-react";
import { useCart } from "./CartProvider";

export default function Header() {
  const { count } = useCart();
  return (
    <>
      <div className="topbar">
        <div className="container topbarInner">
          <span>🚚 Aynı Gün Kargo &nbsp; • &nbsp; %100 Orijinal Parça &nbsp; • &nbsp; Turan Oto Güvencesi</span>
          <span>Bayi / Kurumsal Giriş &nbsp; Sipariş Takip &nbsp; Yardım</span>
        </div>
      </div>
      <header className="header">
        <div className="container headerInner">
          <Link href="/" className="logo"><img src="/logo.svg" alt="Turan Oto Yedek Parça" /></Link>
          <form className="search" action="/urunler">
            <input name="q" placeholder="OEM No, ürün adı veya şasi numarası ile arayın..." />
            <button aria-label="Ara"><Search size={22} /></button>
          </form>
          <nav className="headerActions">
            <a href="tel:08503026666"><Phone size={18} /> 0850 302 66 66</a>
            <Link href="/giris"><User size={18} /> Giriş</Link>
            <Link href="/sepet"><ShoppingCart size={18} /> Sepet <b>{count}</b></Link>
          </nav>
        </div>
      </header>
      <nav className="mainNav">
        <div className="container navInner">
          <Link href="/urunler">☰ TÜM KATEGORİLER</Link>
          <Link href="/urunler?category=Filtre">FİLTRELER</Link>
          <Link href="/urunler?category=Fren">FREN SİSTEMİ</Link>
          <Link href="/urunler?category=Elektrik">ELEKTRİK</Link>
          <Link href="/urunler?category=Kaporta">KAPORTA</Link>
          <Link href="/urunler?category=Süspansiyon">SÜSPANSİYON</Link>
          <Link href="/sasi-sorgula">ŞASİ SORGULA</Link>
        </div>
      </nav>
    </>
  );
}
