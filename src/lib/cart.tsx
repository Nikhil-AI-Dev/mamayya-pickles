"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
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
/** Mirrors the order API's per-line maximum. */
export const MAX_LINE_QUANTITY = 50;
const EMPTY: CartLine[] = [];

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

/** localStorage is writable by anything on the origin and by older versions of
 *  this site; only lines that match the current catalogue are accepted. */
function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const quantity = v.quantity;
  if (
    typeof v.id !== "string" ||
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_LINE_QUANTITY
  ) {
    return false;
  }
  if (v.kind === "box") {
    return typeof v.boxSlug === "string" && getBox(v.boxSlug) !== undefined;
  }
  if (v.kind === "product") {
    if (typeof v.productSlug !== "string" || typeof v.grams !== "number") return false;
    const product = getProduct(v.productSlug);
    return product !== undefined && product.weights.some((w) => w.grams === v.grams);
  }
  return false;
}

export function parseCartLines(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(isCartLine);
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

// One module-level store, read through useSyncExternalStore: the server and
// the first client render see an empty cart, the saved cart appears right
// after hydration, and nothing is ever written back before it was read.
let cached: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readLines(): CartLine[] {
  if (cached === null) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode): start empty.
    }
    cached = parseCartLines(raw);
  }
  return cached;
}

function writeLines(next: CartLine[]): void {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: the cart stays in memory for this page.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cached = null; // another tab changed the cart; re-read on next snapshot
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => EMPTY;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, readLines, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addProduct = useCallback(
    (product: Product, grams: WeightGrams, quantity = 1) => {
      const id = `p:${product.slug}:${grams}`;
      const prev = readLines();
      const existing = prev.find((l) => l.id === id);
      writeLines(
        existing
          ? prev.map((l) =>
              l.id === id
                ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + quantity) }
                : l
            )
          : [...prev, { kind: "product", id, productSlug: product.slug, grams, quantity }]
      );
      setIsOpen(true);
    },
    []
  );

  const addBox = useCallback((box: Box, quantity = 1) => {
    const id = `b:${box.slug}`;
    const prev = readLines();
    const existing = prev.find((l) => l.id === id);
    writeLines(
      existing
        ? prev.map((l) =>
            l.id === id
              ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + quantity) }
              : l
          )
        : [...prev, { kind: "box", id, boxSlug: box.slug, quantity }]
    );
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const prev = readLines();
    writeLines(
      quantity <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) =>
            l.id === id ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l
          )
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    writeLines(readLines().filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => writeLines(EMPTY), []);

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
