"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lineTitle, lineUnitPrice, useCart } from "@/lib/cart";
import { deliveryWindow, formatINR, getProduct } from "@/lib/products";
import {
  ApiError,
  OrderConfirmation,
  OrderDetails,
  createOrder,
  verifyPayment,
  warmApi,
} from "@/lib/api";

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
    script.onerror = () => reject(new Error("Payment window failed to load."));
    document.body.appendChild(script);
  });
}

const FIELDS = [
  { id: "name", label: "Full name", type: "text", autoComplete: "name", span: false },
  { id: "phone", label: "Phone (for the courier)", type: "tel", autoComplete: "tel", span: false },
  { id: "email", label: "Email (order updates go here)", type: "email", autoComplete: "email", span: true },
  { id: "address", label: "Address", type: "text", autoComplete: "street-address", span: true },
  { id: "city", label: "City", type: "text", autoComplete: "address-level2", span: false },
  { id: "pincode", label: "Pincode", type: "text", autoComplete: "postal-code", span: false },
] as const;

export default function CheckoutClient() {
  const { lines, subtotal, shipping, total, updateQuantity, removeLine, clearCart } =
    useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  // Wake the free-tier API while the shopper fills the form.
  useEffect(() => {
    warmApi();
  }, []);

  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-24">
        <div className="rounded-3xl bg-charcoal text-cream p-8 shadow-jar text-center">
          <p className="text-5xl" aria-hidden>
            🫙
          </p>
          <h2 className="mt-4 font-display font-extrabold text-3xl">
            Order received.
          </h2>
          <p className="mt-3 text-cream/80">
            Your order number is{" "}
            <strong className="text-gold">{confirmation.orderId}</strong>. The kitchen
            confirms every order personally - your confirmation email arrives as soon
            as that happens, usually within a few hours.
          </p>
          <dl className="mt-6 mx-auto max-w-xs space-y-1.5 text-sm text-left">
            <div className="flex justify-between">
              <dt className="text-cream/70">Total</dt>
              <dd className="font-bold">{formatINR(confirmation.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream/70">Estimated delivery</dt>
              <dd className="font-bold">{confirmation.deliveryWindow}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-cream/60">{confirmation.paymentNote}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/track"
              className="rounded-full bg-gold text-charcoal px-7 py-3 font-extrabold hover:bg-cream transition-colors"
            >
              Track this order
            </Link>
            <Link
              href="/shop"
              className="rounded-full border-2 border-cream/40 px-7 py-3 font-bold hover:border-cream transition-colors"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-24 text-center">
        <p className="text-6xl" aria-hidden>🫙</p>
        <h2 className="mt-4 font-display font-extrabold text-2xl text-charcoal">
          Your cart is empty.
        </h2>
        <p className="mt-2 text-charcoal/70">
          A checkout with no jars is a sad page. Fix that.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-red text-cream px-8 py-3.5 font-bold hover:bg-red-deep transition-colors"
        >
          Browse the four jars
        </Link>
      </div>
    );
  }

  const openPayment = async (order: OrderConfirmation, details: OrderDetails) => {
    await loadRazorpayScript();
    return new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay!({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        name: "Mamayya Pickles",
        description: `Order ${order.orderId}`,
        prefill: { name: details.name, email: details.email, contact: details.phone },
        theme: { color: "#a92a1d" },
        handler: (response: RazorpayHandlerResponse) => {
          verifyPayment(
            order.orderId,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          )
            .then(() => resolve())
            .catch(reject);
        },
        modal: {
          ondismiss: () =>
            reject(
              new ApiError(
                `Payment window closed. Your order ${order.orderId} is saved - submit again to retry the payment.`,
                0
              )
            ),
        },
      });
      rzp.open();
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const details = Object.fromEntries(
      FIELDS.map((f) => [f.id, String(data.get(f.id) ?? "").trim()])
    ) as OrderDetails;
    try {
      const result = await createOrder(details, lines);
      if (result.razorpayOrderId) {
        await openPayment(result, details);
        result.paymentStatus = "paid";
        result.paymentNote = "Payment received. Fresh preparation starts now.";
      }
      clearCart();
      setConfirmation(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto max-w-6xl px-4 md:px-6 pb-20 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-start"
      onSubmit={handleSubmit}
    >
      {/* Delivery details */}
      <section aria-labelledby="delivery-heading" className="rounded-3xl bg-white/80 border border-charcoal/10 shadow-card p-6">
        <h2 id="delivery-heading" className="font-display font-extrabold text-2xl text-charcoal">
          Delivery details
        </h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.id} className={f.span ? "sm:col-span-2" : ""}>
              <label htmlFor={f.id} className="block text-sm font-bold text-charcoal">
                {f.label}
              </label>
              <input
                id={f.id}
                name={f.id}
                type={f.type}
                autoComplete={f.autoComplete}
                required
                minLength={f.id === "pincode" ? 6 : undefined}
                maxLength={f.id === "pincode" ? 6 : undefined}
                pattern={f.id === "pincode" ? "\\d{6}" : undefined}
                className="mt-1.5 w-full rounded-xl border-2 border-charcoal/15 bg-cream/50 px-4 py-2.5 font-semibold focus:border-red focus:outline-none"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-charcoal/60">
          Prepaid only - UPI, credit card, debit card or net banking. Cash on delivery
          isn&apos;t available.
        </p>
      </section>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-24 rounded-3xl bg-charcoal text-cream p-6 shadow-jar">
        <h2 className="font-display font-extrabold text-2xl">Your order</h2>
        <ul className="mt-4 divide-y divide-cream/10">
          {lines.map((line) => (
            <li key={line.id} className="py-3 flex items-center justify-between gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  line.kind === "product"
                    ? getProduct(line.productSlug)?.image ?? "/logo.webp"
                    : "/logo.webp"
                }
                alt=""
                width={640}
                height={1180}
                className="w-8 h-auto shrink-0 drop-shadow"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{lineTitle(line)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                    className="w-9 h-9 grid place-items-center rounded-full border border-cream/30 hover:border-gold hover:text-gold active:scale-90 transition-all"
                    aria-label={`Decrease quantity of ${lineTitle(line)}`}
                  >
                    −
                  </button>
                  <span className="font-bold">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                    className="w-9 h-9 grid place-items-center rounded-full border border-cream/30 hover:border-gold hover:text-gold active:scale-90 transition-all"
                    aria-label={`Increase quantity of ${lineTitle(line)}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="ml-2 text-cream/50 hover:text-red transition-colors font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-bold shrink-0">
                {formatINR(lineUnitPrice(line) * line.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 text-sm border-t border-cream/15 pt-4">
          <div className="flex justify-between">
            <dt className="text-cream/70">Subtotal</dt>
            <dd className="font-bold">{formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/70">Shipping</dt>
            <dd className="font-bold">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <dt className="font-bold">Total</dt>
            <dd className="font-display font-extrabold text-2xl">{formatINR(total)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-cream/60">
          Estimated delivery: <strong className="text-cream/90">{deliveryWindow()}</strong>
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-gold text-charcoal px-6 py-3.5 font-extrabold hover:bg-cream active:scale-[0.99] transition-all disabled:opacity-60"
        >
          {submitting ? "Placing order..." : `Place order · ${formatINR(total)}`}
        </button>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border-2 border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed"
          >
            <p className="font-bold">Order didn&apos;t go through.</p>
            <p className="mt-1 text-cream/80">{error}</p>
          </div>
        )}
      </aside>
    </form>
  );
}
