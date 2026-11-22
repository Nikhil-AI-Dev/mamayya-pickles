import { CartLine } from "./cart";

// The API host is fixed at build time. A production build without it would
// ship a storefront that posts orders to localhost, so fail the build instead.
const configuredBase = process.env.NEXT_PUBLIC_API_URL;
if (!configuredBase && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL must be set for a production build");
}
export const API_BASE = configuredBase || "http://localhost:8001";

/** Long enough for the free-tier API to wake from sleep, short enough that a
 *  hung connection cannot pin the submit button. */
const REQUEST_TIMEOUT_MS = 45_000;

export type OrderDetails = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
};

export type OrderConfirmation = {
  orderId: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: "test" | "pending" | "paid";
  paymentNote: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
};

export type OrderStage = {
  name: string;
  reached: boolean;
  expected: string;
};

export type TrackedOrder = {
  orderId: string;
  placedOn: string;
  name: string;
  total: number;
  deliveryWindow: string;
  paymentStatus: "test" | "pending" | "paid";
  confirmed: boolean;
  currentStage: string;
  currentStageIndex: number;
  stages: OrderStage[];
};

export type PaymentResult = { orderId: string; paymentStatus: string };

/** Fire-and-forget wake-up for the free-tier API (cold starts take ~30s). */
export function warmApi(): void {
  fetch(`${API_BASE}/health`).catch(() => {});
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Fires cb if a request is still in flight after ms - drive "slow network" hints. */
export function slowTimer(cb: () => void, ms = 8000): { clear: () => void } {
  const id = setTimeout(cb, ms);
  return { clear: () => clearTimeout(id) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOrderConfirmation(value: unknown): value is OrderConfirmation {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.total === "number" &&
    typeof value.paymentStatus === "string" &&
    typeof value.paymentNote === "string"
  );
}

function isTrackedOrder(value: unknown): value is TrackedOrder {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.total === "number" &&
    typeof value.confirmed === "boolean" &&
    typeof value.currentStage === "string" &&
    Array.isArray(value.stages)
  );
}

function isPaymentResult(value: unknown): value is PaymentResult {
  return (
    isRecord(value) &&
    typeof value.orderId === "string" &&
    typeof value.paymentStatus === "string"
  );
}

async function request<T>(
  path: string,
  parse: (value: unknown) => value is T,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...init,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(
        "The order service is taking too long to answer. Give it a moment and try again - your cart is safe.",
        0
      );
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new ApiError(
        "You appear to be offline. Check your internet connection and try again - your cart is saved on this device.",
        0
      );
    }
    throw new ApiError(
      "Can't reach the order service right now. Give it a few seconds and try again - your cart is safe.",
      0
    );
  }
  if (!res.ok) {
    let detail = "Something went wrong. Try again.";
    try {
      const body: unknown = await res.json();
      if (isRecord(body) && typeof body.detail === "string") detail = body.detail;
    } catch {
      // Non-JSON error body: keep the generic message.
    }
    throw new ApiError(detail, res.status);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Unexpected response from the order service. Try again.", res.status);
  }
  if (!parse(data)) {
    throw new ApiError("Unexpected response from the order service. Try again.", res.status);
  }
  return data;
}

export function createOrder(
  details: OrderDetails,
  lines: CartLine[]
): Promise<OrderConfirmation> {
  return request("/api/orders", isOrderConfirmation, {
    method: "POST",
    body: JSON.stringify({ ...details, lines }),
  });
}

export function getOrder(orderId: string, phone: string): Promise<TrackedOrder> {
  return request(
    `/api/orders/${encodeURIComponent(orderId.trim())}?phone=${encodeURIComponent(phone.trim())}`,
    isTrackedOrder
  );
}

export function verifyPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<PaymentResult> {
  return request(`/api/orders/${encodeURIComponent(orderId)}/verify-payment`, isPaymentResult, {
    method: "POST",
    body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  });
}
