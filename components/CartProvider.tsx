"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  add: (id: number, qty?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("turan-cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("turan-cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (id, qty = 1) => setItems(prev => {
      const found = prev.find(x => x.id === id);
      return found
        ? prev.map(x => x.id === id ? { ...x, qty: x.qty + qty } : x)
        : [...prev, { id, qty }];
    }),
    remove: id => setItems(prev => prev.filter(x => x.id !== id)),
    setQty: (id, qty) => setItems(prev => qty <= 0 ? prev.filter(x => x.id !== id) : prev.map(x => x.id === id ? { ...x, qty } : x)),
    clear: () => setItems([]),
    count: items.reduce((sum, x) => sum + x.qty, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
