import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#090d14",
        color: "#ffffff",
        marginTop: "70px",
        borderTop: "1px solid #1f2937",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1.5fr) repeat(4, minmax(140px, 1fr))",
          gap: "42px",
          paddingTop: "52px",
          paddingBottom: "42px",
          alignItems: "start",
        }}
      >
        {/* LOGO / MARKA */}
        <div>
          <Link href="/" aria-label="Turan Oto Ana Sayfa">
            <img
              src="/turan-oto-logo-transparent.png"
              alt="Turan Oto Yedek Parça"
              style={{
                width: "220px",
                maxWidth: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
                marginBottom: "18px",
              }}
            />
          </Link>

          <p
            style={{
              color: "#aeb8c7",
              lineHeight: 1.7,
              maxWidth: "310px",
              margin: "0 0 22px",
              fontSize: "14px",
            }}
          >
            Fiat araçlar için orijinal ve kaliteli muadil yedek parçada
            güvenilir çözüm.
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
              color: "#d7dee8",
              fontSize: "14px",
            }}
          >
            <a
              href="tel:+908503026666"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              ☎ 0850 302 66 66
            </a>

            <a
              href="mailto:info@turanotoyedekparca.com"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              ✉ info@turanotoyedekparca.com
            </a>
          </div>
        </div>

        {/* KURUMSAL */}
        <div>
          <h4 style={headingStyle}>KURUMSAL</h4>

          <FooterLink href="/hakkimizda">Hakkımızda</FooterLink>
          <FooterLink href="/iletisim">İletişim</FooterLink>
        </div>

        {/* MÜŞTERİ */}
        <div>
          <h4 style={headingStyle}>MÜŞTERİ</h4>

          <FooterLink href="/siparis-takip">Sipariş Takip</FooterLink>
          <FooterLink href="/iade-degisim">İade & Değişim</FooterLink>
          <FooterLink href="/kargo">Kargo</FooterLink>
          <FooterLink href="/sss">Sık Sorulan Sorular</FooterLink>
        </div>

        {/* BİLGİ */}
        <div>
          <h4 style={headingStyle}>BİLGİ</h4>

          <FooterLink href="/kvkk">KVKK</FooterLink>
          <FooterLink href="/gizlilik">Gizlilik Politikası</FooterLink>
          <FooterLink href="/mesafeli-satis">
            Mesafeli Satış Sözleşmesi
          </FooterLink>
        </div>

        {/* ÖDEME */}
        <div>
          <h4 style={headingStyle}>ÖDEME</h4>

          <div
            style={{
              display: "grid",
              gap: "11px",
              color: "#aeb8c7",
              fontSize: "14px",
            }}
          >
            <span>💳 Kredi Kartı</span>
            <span>🏦 Havale / EFT</span>
            <span>🧾 B2B Cari Hesap</span>
          </div>

          <div
            style={{
              marginTop: "22px",
              padding: "12px",
              borderRadius: "9px",
              background: "#111827",
              border: "1px solid #202938",
              color: "#cbd5e1",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            🔒 256 Bit SSL ile güvenli alışveriş
          </div>
        </div>
      </div>

      {/* ALT BAR */}
      <div
        style={{
          borderTop: "1px solid #202938",
          background: "#070a0f",
        }}
      >
        <div
          className="container"
          style={{
            minHeight: "68px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            color: "#818b9a",
            fontSize: "13px",
          }}
        >
          <span>
            © 2026 Turan Oto Yedek Parça. Tüm hakları saklıdır.
          </span>

          <span>
            MİHRAS Bilişim
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        color: "#aeb8c7",
        textDecoration: "none",
        marginBottom: "12px",
        fontSize: "14px",
        lineHeight: 1.4,
      }}
    >
      {children}
    </Link>
  );
}

const headingStyle: React.CSSProperties = {
  margin: "4px 0 20px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "0.7px",
};
