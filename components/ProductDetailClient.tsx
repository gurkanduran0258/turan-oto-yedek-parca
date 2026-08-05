"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useCart,
  type CartProduct,
} from "@/components/CartProvider";

type ProductDetailClientProps = {
  product: CartProduct;
};

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasStock = Number(product.stock || 0) > 0;

  function handleQuantityChange(value: number) {
    if (!Number.isFinite(value)) {
      setQuantity(1);
      return;
    }

    const maximum = Math.max(1, product.stock);
    const nextQuantity = Math.min(
      maximum,
      Math.max(1, Math.floor(value))
    );

    setQuantity(nextQuantity);
  }

  function handleAddToCart() {
    if (!hasStock) {
      return;
    }

    add(product, quantity);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="number"
          min={1}
          max={Math.max(1, product.stock)}
          value={quantity}
          disabled={!hasStock}
          onChange={(event) =>
            handleQuantityChange(Number(event.target.value))
          }
          style={{
            width: "80px",
            height: "48px",
            padding: "0 12px",
            border: "1px solid #94a3b8",
            borderRadius: "6px",
            fontSize: "16px",
          }}
        />

        <button
          type="button"
          disabled={!hasStock}
          onClick={handleAddToCart}
          style={{
            minHeight: "48px",
            padding: "12px 22px",
            border: "none",
            borderRadius: "7px",
            background: !hasStock
              ? "#94a3b8"
              : added
                ? "#047857"
                : "#dc0023",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "16px",
            cursor: hasStock ? "pointer" : "not-allowed",
          }}
        >
          {!hasStock
            ? "STOKTA YOK"
            : added
              ? "SEPETE EKLENDİ"
              : "SEPETE EKLE"}
        </button>
      </div>

      <div style={{ marginTop: "14px" }}>
        <Link
          href="/sepet"
          style={{
            color: "#0f172a",
            fontWeight: 700,
          }}
        >
          Sepete Git →
        </Link>
      </div>
    </div>
  );
}
