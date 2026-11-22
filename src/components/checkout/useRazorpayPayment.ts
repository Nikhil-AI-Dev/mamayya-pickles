"use client";

import { useCallback } from "react";
import { ApiError, OrderConfirmation, OrderDetails } from "@/lib/api";
import type { PendingVerify } from "./checkoutSession";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new ApiError("Payment window failed to load.", 0));
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout for an order and resolves with the signed result
 *  once the shopper has paid. Relaying that result to the order API is the
 *  caller's job, so a failed relay can be retried without paying again. */
export function useRazorpayPayment() {
  return useCallback(
    async (order: OrderConfirmation, details: OrderDetails): Promise<PendingVerify> => {
      await loadRazorpayScript();
      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new ApiError("Payment window failed to load.", 0);
      return new Promise<PendingVerify>((resolve, reject) => {
        const rzp = new Razorpay({
          key: order.razorpayKeyId,
          order_id: order.razorpayOrderId,
          name: "Mamayya Pickles",
          description: `Order ${order.orderId}`,
          prefill: { name: details.name, email: details.email, contact: details.phone },
          theme: { color: "#a92a1d" },
          handler: (response: RazorpayHandlerResponse) =>
            resolve({
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          modal: {
            // The handleSubmit catch adds the "order saved, press again" note.
            ondismiss: () => reject(new ApiError("Payment window closed.", 0)),
          },
        });
        rzp.open();
      });
    },
    []
  );
}
