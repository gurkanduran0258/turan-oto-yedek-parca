"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

type Product = {
  id: number; name: string; brand: string; category: string;
  price: number; oldPrice: number; oem: string; stock: number;
  vehicle: string; image: string; badge: string;
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const [qty,setQty] = useState(1);
  const { add } = useCart();
  return (
    <main className="container detail">
      <div className="detailImage"><img src={product.image} alt={product.name} /></div>
      <div>
        <span className="badge staticBadge">{product.badge}</span>
        <h1>{product.name}</h1>
        <p>{product.brand} • {product.category}</p>
        <p>OEM: <b>{product.oem}</b></p>
        <div className="priceRow large"><strong>{product.price.toLocaleString("tr-TR")} TL</strong><del>{product.oldPrice.toLocaleString("tr-TR")} TL</del></div>
        <p className="stock">Stokta {product.stock} adet</p>
        <div className="infoBox"><b>Uyumlu Araçlar</b><p>{product.vehicle}</p></div>
        <div className="qtyRow"><input type="number" min={1} value={qty} onChange={e=>setQty(Number(e.target.value))} /><button className="primary" onClick={()=>add(product.id,qty)}>SEPETE EKLE</button></div>
      </div>
    </main>
  );
}
