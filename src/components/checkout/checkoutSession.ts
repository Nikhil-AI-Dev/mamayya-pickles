"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CartLine } from "@/lib/cart";
import type { OrderConfirmation, OrderDetails } from "@/lib/api";

/** An order created on the server whose payment has not completed. Reused on
 *  resubmit so the shopper is not charged for a second order, but only while
 *  the cart and delivery details it was created for are unchanged. */
export type PendingOrder = {
  order: OrderConfirmation;
  cartKey: string;
  detailsKey: string;
};

/** Razorpay has taken the payment; the result still has to be relayed to the
 *  order API. While this exists the checkout must never be opened again. */
export type PendingVerify = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

/** An idempotency key generated before createOrder is called, so a retry after
 *  a lost response reuses the same key and the server returns the first order
 *  instead of creating a second one. Scoped to the cart + details it is for. */
export type OrderAttempt = {
  key: string;
  cartKey: string;
  detailsKey: string;
};

export type CheckoutSession = {
  attempt: OrderAttempt | null;
  pendingOrder: PendingOrder | null;
  pendingVerify: PendingVerify | null;
};

const STORAGE_KEY = "mamayya-checkout-v1";
const EMPTY_SESSION: CheckoutSession = {
  attempt: null,
  pendingOrder: null,
  pendingVerify: null,
};

export function cartKey(lines: CartLine[]): string {
  return lines.map((l) => `${l.id}x${l.quantity}`).join("|");
}

/** Short non-reversible fingerprint so delivery details never sit in storage. */
export function detailsKey(details: OrderDetails): string {
  const text = JSON.stringify(details);
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPendingOrder(value: unknown): value is PendingOrder {
  return (
    isRecord(value) &&
    typeof value.cartKey === "string" &&
    typeof value.detailsKey === "string" &&
    isRecord(value.order) &&
    typeof value.order.orderId === "string" &&
    typeof value.order.total === "number"
  );
}

function isPendingVerify(value: unknown): value is PendingVerify {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.razorpayOrderId === "string" &&
    typeof value.razorpayPaymentId === "string" &&
    typeof value.razorpaySignature === "string"
  );
}

function isAttempt(value: unknown): value is OrderAttempt {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.cartKey === "string" &&
    typeof value.detailsKey === "string"
  );
}

function parseSession(raw: string | null): CheckoutSession {
  if (!raw) return EMPTY_SESSION;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_SESSION;
    const attempt = isAttempt(parsed.attempt) ? parsed.attempt : null;
    const pendingOrder = isPendingOrder(parsed.pendingOrder) ? parsed.pendingOrder : null;
    const pendingVerify = isPendingVerify(parsed.pendingVerify) ? parsed.pendingVerify : null;
    return attempt || pendingOrder || pendingVerify
      ? { attempt, pendingOrder, pendingVerify }
      : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

// sessionStorage: survives a reload of this tab (the case that used to create
// a second order) and is gone when the tab closes.
let cached: CheckoutSession | null = null;
const listeners = new Set<() => void>();

function readSession(): CheckoutSession {
  if (cached === null) {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: in-memory only.
    }
    cached = parseSession(raw);
  }
  return cached;
}

function writeSession(next: CheckoutSession): void {
  cached = next;
  try {
    if (next.attempt || next.pendingOrder || next.pendingVerify) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable: in-memory only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getServerSnapshot = () => EMPTY_SESSION;

export function useCheckoutSession(): [
  CheckoutSession,
  (patch: Partial<CheckoutSession>) => void,
  () => void,
] {
  const session = useSyncExternalStore(subscribe, readSession, getServerSnapshot);
  const update = useCallback(
    (patch: Partial<CheckoutSession>) => writeSession({ ...readSession(), ...patch }),
    []
  );
  const clear = useCallback(() => writeSession(EMPTY_SESSION), []);
  return [session, update, clear];
}
