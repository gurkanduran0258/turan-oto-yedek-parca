"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

type Product = {
  id: number; name: string; brand: string; category: string;
  price: number; oldPrice: number; oem: string; stock: number;
  vehicle: string; image: string; badge: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <article className="productCard">
      <span className="badge">{product.badge}</span>
      <Link href={`/urun/${product.id}`}>
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
      </Link>
      <small>{product.brand}</small>
      <p className="oem">OEM: {product.oem}</p>
      <div className="priceRow">
        <strong>{product.price.toLocaleString("tr-TR")} TL</strong>
        <del>{product.oldPrice.toLocaleString("tr-TR")} TL</del>
      </div>
      <span className="stock">Stokta {product.stock} adet</span>
      <button onClick={() => add(product.id)}>Sepete Ekle</button>
    </article>
  );
}
