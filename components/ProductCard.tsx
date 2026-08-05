"use client";

import Link from "next/link";
import {
  useCart,
  type CartProduct,
} from "@/components/CartProvider";

type ProductCardProps = {
  product: CartProduct;
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { add } = useCart();

  const hasStock = Number(product.stock || 0) > 0;

  return (
    <article className="productCard">
      <span className="badge">
        {product.badge ||
          (hasStock ? "Stokta" : "Tükendi")}
      </span>

      <Link href={`/urun/${product.id}`}>
        <img
          src={
            product.image ||
            "/opar-filtre-banner.png"
          }
          alt={product.name}
        />

        <h3>{product.name}</h3>
      </Link>

      <small>{product.brand || "OPAR"}</small>

      <p className="oem">
        OEM: {product.oem}
      </p>

      <div className="priceRow">
        <strong>
          {Number(product.price || 0).toLocaleString(
            "tr-TR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}{" "}
          TL
        </strong>

        {Number(product.oldPrice || 0) >
        Number(product.price || 0) ? (
          <del>
            {Number(
              product.oldPrice || 0
            ).toLocaleString("tr-TR", {
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
        {hasStock
          ? "Sepete Ekle"
          : "Stokta Yok"}
      </button>
    </article>
  );
}
