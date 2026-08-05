"use client";

import {
  useState,
} from "react";

import {
  useCart,
  type CartProduct,
} from "@/components/CartProvider";

type AddToCartButtonProps = {
  product: CartProduct;
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const hasStock = product.stock > 0;

  function handleAddToCart() {
    if (!hasStock) {
      return;
    }

    add(product);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      disabled={!hasStock}
      onClick={handleAddToCart}
      style={{
        padding: "14px 24px",
        border: "none",
        borderRadius: "8px",
        background: hasStock
          ? added
            ? "#047857"
            : "#dc0023"
          : "#94a3b8",
        color: "#ffffff",
        fontWeight: 800,
        fontSize: "16px",
        cursor: hasStock
          ? "pointer"
          : "not-allowed",
      }}
    >
      {!hasStock
        ? "STOKTA YOK"
        : added
          ? "SEPETE EKLENDİ"
          : "SEPETE EKLE"}
    </button>
  );
}
