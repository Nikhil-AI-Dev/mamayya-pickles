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
  currentStage: string;
  currentStageIndex: number;
  stages: OrderStage[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(
      "Can't reach the order service. Check that the backend is running on port 8001.",
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

export function getOrder(orderId: string): Promise<TrackedOrder> {
  return request<TrackedOrder>(`/api/orders/${encodeURIComponent(orderId.trim())}`);
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
