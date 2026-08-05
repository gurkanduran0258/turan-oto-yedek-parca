export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div><img src="/logo.svg" className="footerLogo" alt="Turan Oto" /><p>Fiat araçlar için orijinal ve muadil yedek parça.</p></div>
        <div><h4>KURUMSAL</h4><a>Hakkımızda</a><a>İletişim</a><a>Kariyer</a><a>Bayilik</a></div>
        <div><h4>MÜŞTERİ</h4><a>Sipariş Takip</a><a>İade & Değişim</a><a>Kargo</a><a>SSS</a></div>
        <div><h4>BİLGİ</h4><a>KVKK</a><a>Gizlilik</a><a>Mesafeli Satış</a></div>
        <div><h4>ÖDEME</h4><p>Kredi Kartı</p><p>Havale / EFT</p><p>B2B Cari Hesap</p></div>
      </div>
      <div className="container copyright">© 2026 Turan Oto Yedek Parça</div>
    </footer>
  );
}
