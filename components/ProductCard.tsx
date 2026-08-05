"use client";

import Link from "next/link";
import { useCart, type CartProduct } from "./CartProvider";

type Product = CartProduct;

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { add } = useCart();

  const hasStock = product.stock > 0;

  return (
    <article className="productCard">
      <span className="badge">
        {product.badge || (hasStock ? "Stokta" : "Tükendi")}
      </span>

      <Link href={`/urun/${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
        />

        <h3>{product.name}</h3>
      </Link>

      <small>{product.brand}</small>

      <p className="oem">
        OEM: {product.oem}
      </p>

      <div className="priceRow">
        <strong>
          {Number(product.price).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          TL
        </strong>

        {product.oldPrice > product.price ? (
          <del>
            {Number(product.oldPrice).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            TL
          </del>
        ) : null}
      </div>

      <span className="stock">
        Stokta {product.stock} adet
      </span>

      <button
        type="button"
        disabled={!hasStock}
        onClick={() => add(product)}
      >
        {hasStock ? "Sepete Ekle" : "Stokta Yok"}
      </button>
    </article>
  );
}
