import { CartLine } from "./cart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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
  deliveryWindow: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
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
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Non-JSON error body: keep the generic message.
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export function createOrder(
  details: OrderDetails,
  lines: CartLine[]
): Promise<OrderConfirmation> {
  return request<OrderConfirmation>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ ...details, lines }),
  });
}

export function getOrder(orderId: string, phone: string): Promise<TrackedOrder> {
  return request<TrackedOrder>(
    `/api/orders/${encodeURIComponent(orderId.trim())}?phone=${encodeURIComponent(phone.trim())}`
  );
}

export function verifyPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ orderId: string; paymentStatus: string }> {
  return request(`/api/orders/${encodeURIComponent(orderId)}/verify-payment`, {
    method: "POST",
    body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  });
}
