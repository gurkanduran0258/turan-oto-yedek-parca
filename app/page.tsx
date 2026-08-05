import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

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

export default function Home() {
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
          <Link href="/urunler" key={name}>
            <span>{icon}</span>
            <b>{name}</b>
          </Link>
        ))}
      </section>

      <div className="sectionHead">
        <h2>ÖNE ÇIKAN ÜRÜNLER</h2>
        <Link href="/urunler">Tümünü Gör ›</Link>
      </div>

      <section className="productsLayout">
        <aside className="sideCats">
          <h3>KATEGORİLER</h3>

          {cats.map(([, name]) => (
            <Link href="/urunler" key={name}>
              {name}
              <span>›</span>
            </Link>
          ))}
        </aside>

        <div className="productGrid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
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
