"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartProduct = {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  oem: string;
  stock: number;
  vehicle: string;
  image: string;
  badge: string;
};

export type CartItem = CartProduct & {
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (product: CartProduct, qty?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("turan-cart-v2");

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Sepet okunamadı:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      "turan-cart-v2",
      JSON.stringify(items)
    );
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,

      add: (product, qty = 1) => {
        setItems((previousItems) => {
          const existingItem = previousItems.find(
            (item) => item.id === product.id
          );

          if (existingItem) {
            return previousItems.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    ...product,
                    qty: item.qty + qty,
                  }
                : item
            );
          }

          return [
            ...previousItems,
            {
              ...product,
              qty,
            },
          ];
        });
      },

      remove: (id) => {
        setItems((previousItems) =>
          previousItems.filter((item) => item.id !== id)
        );
      },

      setQty: (id, qty) => {
        setItems((previousItems) => {
          if (qty <= 0) {
            return previousItems.filter(
              (item) => item.id !== id
            );
          }

          return previousItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  qty,
                }
              : item
          );
        });
      },

      clear: () => {
        setItems([]);
      },

      count: items.reduce(
        (totalCount, item) => totalCount + item.qty,
        0
      ),

      total: items.reduce(
        (totalPrice, item) =>
          totalPrice + Number(item.price || 0) * item.qty,
        0
      ),
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return value;
}
