"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { products } from "@/lib/products";

export default function CartPage() {
  const { items, remove, setQty } = useCart();
  const rows = items.map(i => ({ item:i, product: products.find(p=>p.id===i.id)! })).filter(x=>x.product);
  const subtotal = rows.reduce((s,x)=>s+x.product.price*x.item.qty,0);
  const shipping = subtotal === 0 || subtotal >= 1500 ? 0 : 99.9;
  return (
    <>
      <section className="pageTitle"><div className="container"><h1>Sepetim</h1></div></section>
      <main className="container cartLayout">
        <section className="cartTable">
          {rows.length ? rows.map(({item,product}) => (
            <div className="cartRow" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div><b>{product.name}</b><small>OEM: {product.oem}</small></div>
              <input type="number" min={1} value={item.qty} onChange={e=>setQty(product.id,Number(e.target.value))} />
              <strong>{(product.price*item.qty).toLocaleString("tr-TR")} TL</strong>
              <button onClick={()=>remove(product.id)}>Sil</button>
            </div>
          )) : <p className="empty">Sepetiniz boş.</p>}
        </section>
        <aside className="summary">
          <h3>Sipariş Özeti</h3>
          <p><span>Ara Toplam</span><b>{subtotal.toLocaleString("tr-TR")} TL</b></p>
          <p><span>Kargo</span><b>{shipping.toLocaleString("tr-TR")} TL</b></p>
          <p className="grand"><span>Toplam</span><b>{(subtotal+shipping).toLocaleString("tr-TR")} TL</b></p>
          {rows.length > 0 && <Link href="/giris" className="primary">ÖDEMEYE GEÇ</Link>}
        </aside>
      </main>
    </>
  );
}
