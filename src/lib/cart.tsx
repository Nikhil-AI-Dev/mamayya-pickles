"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  FREE_SHIPPING_THRESHOLD,
  Product,
  SHIPPING_FEE,
  WeightGrams,
  getBox,
  getProduct,
} from "./products";

export type CartLine =
  | {
      kind: "product";
      id: string;
      productSlug: string;
      grams: WeightGrams;
      quantity: number;
    }
  | {
      kind: "box";
      id: string;
      boxSlug: string;
      quantity: number;
    };

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addProduct: (product: Product, grams: WeightGrams, quantity?: number) => void;
  addBox: (box: Box, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  amountToFreeShipping: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mamayya-cart-v1";

export function lineUnitPrice(line: CartLine): number {
  if (line.kind === "box") {
    return getBox(line.boxSlug)?.price ?? 0;
  }
  const product = getProduct(line.productSlug);
  return product?.weights.find((w) => w.grams === line.grams)?.price ?? 0;
}

export function lineTitle(line: CartLine): string {
  if (line.kind === "box") {
    return getBox(line.boxSlug)?.name ?? "Box";
  }
  const product = getProduct(line.productSlug);
  const weight = product?.weights.find((w) => w.grams === line.grams);
  return `${product?.name ?? "Pickle"} · ${weight?.label ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // Corrupt storage: start with an empty cart.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable (private mode); cart stays in-memory.
    }
  }, [lines]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addProduct = useCallback(
    (product: Product, grams: WeightGrams, quantity = 1) => {
      const id = `p:${product.slug}:${grams}`;
      setLines((prev) => {
        const existing = prev.find((l) => l.id === id);
        if (existing) {
          return prev.map((l) =>
            l.id === id ? { ...l, quantity: l.quantity + quantity } : l
          );
        }
        return [
          ...prev,
          { kind: "product", id, productSlug: product.slug, grams, quantity },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const addBox = useCallback((box: Box, quantity = 1) => {
    const id = `b:${box.slug}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) =>
          l.id === id ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { kind: "box", id, boxSlug: box.slug, quantity }];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, quantity } : l))
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce(
      (sum, l) => sum + lineUnitPrice(l) * l.quantity,
      0
    );
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    return {
      lines,
      isOpen,
      openCart,
      closeCart,
      addProduct,
      addBox,
      updateQuantity,
      removeLine,
      clearCart,
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
      amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    };
  }, [
    lines,
    isOpen,
    openCart,
    closeCart,
    addProduct,
    addBox,
    updateQuantity,
    removeLine,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
