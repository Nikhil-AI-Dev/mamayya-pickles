"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { lineTitle, lineUnitPrice, useCart } from "@/lib/cart";
import { deliveryWindow, formatINR, getBox, getProduct } from "@/lib/products";
import { FSSAI_SHORT } from "@/lib/business";
import {
  ApiError,
  OrderConfirmation,
  OrderDetails,
  createOrder,
  slowTimer,
  verifyPayment,
  warmApi,
} from "@/lib/api";
import { cartKey, detailsKey, useCheckoutSession } from "./checkoutSession";
import { useRazorpayPayment } from "./useRazorpayPayment";
import { usePincodeLookup } from "./usePincodeLookup";

const FIELDS = [
  { id: "name", label: "Full name", type: "text", autoComplete: "name", span: false },
  { id: "phone", label: "Phone (for the courier)", type: "tel", autoComplete: "tel", span: false },
  { id: "email", label: "Email (order updates go here)", type: "email", autoComplete: "email", span: true },
  { id: "house", label: "House / Flat / Building", type: "text", autoComplete: "address-line1", span: false },
  { id: "street", label: "Street / Area", type: "text", autoComplete: "address-line2", span: false },
  { id: "landmark", label: "Near / Opposite (landmark) - optional", type: "text", autoComplete: "off", span: true, optional: true },
  { id: "pincode", label: "Pincode", type: "text", autoComplete: "postal-code", span: false },
  { id: "city", label: "City", type: "text", autoComplete: "address-level2", span: false },
];

const PAID_UNCONFIRMED_MESSAGE =
  "Your payment went through, but we could not confirm it with our kitchen server yet. Do not pay again - press the button once more to retry the confirmation, or write to us quoting your order number.";
const PAID_NEEDS_HELP_MESSAGE =
  "Your payment went through, but we could not match it to this order automatically. Do not pay again - write to contact@mamayyapickles.com quoting your order number and we will sort it out right away.";

// A verify failure is worth retrying when it is a network drop, timeout, rate
// limit, or server error. A 400/404/409 will never succeed on retry, so the
// shopper is pointed at support instead of looping on the button.
function isTransientVerifyFailure(err: unknown): boolean {
  if (!(err instanceof ApiError)) return true;
  return err.status === 0 || err.status === 429 || err.status >= 500;
}

export default function CheckoutClient() {
  const { lines, subtotal, shipping, total, updateQuantity, removeLine, clearCart } =
    useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [slowHint, setSlowHint] = useState(false);
  const [recap, setRecap] = useState<Record<string, string>>({});
  const [session, updateSession, clearSession] = useCheckoutSession();
  const cityRef = useRef<HTMLInputElement>(null);
  const { pinHint, onPincodeChange } = usePincodeLookup(cityRef);
  const openPayment = useRazorpayPayment();

  // Wake the free-tier API while the shopper fills the form.
  useEffect(() => {
    warmApi();
  }, []);

  // A saved order is only reused while the cart it was priced for is unchanged.
  const currentCartKey = cartKey(lines);
  const pendingOrder =
    session.pendingOrder && session.pendingOrder.cartKey === currentCartKey
      ? session.pendingOrder
      : null;
  const pendingVerify = session.pendingVerify;

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
              <dd className="font-bold">{deliveryWindow()}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-cream/60">{confirmation.paymentNote}</p>
          <p className="mt-2 text-[11px] tracking-wide text-cream/50">{FSSAI_SHORT}</p>
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

  if (lines.length === 0 && !pendingVerify) {
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

  const finish = (confirmed: OrderConfirmation) => {
    clearSession();
    clearCart();
    setConfirmation(confirmed);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setSlowHint(false);
    const slow = slowTimer(() => setSlowHint(true));
    const data = new FormData(e.currentTarget);
    const v = (id: string) => String(data.get(id) ?? "").trim();
    const landmark = v("landmark");
    const details: OrderDetails = {
      name: v("name"),
      phone: v("phone"),
      email: v("email"),
      address: `${v("house")}, ${v("street")}${landmark ? `, Near ${landmark}` : ""}`,
      city: v("city"),
      pincode: v("pincode"),
    };
    let order: OrderConfirmation | null = null;
    try {
      // Razorpay already took the money for this order: only the relay to our
      // API is outstanding. Retry that; never open the payment window again.
      if (pendingVerify) {
        const paid = pendingOrder?.order ?? null;
        try {
          await verifyPayment(
            pendingVerify.orderId,
            pendingVerify.razorpayOrderId,
            pendingVerify.razorpayPaymentId,
            pendingVerify.razorpaySignature
          );
        } catch (err) {
          if (isTransientVerifyFailure(err)) {
            setError(`${PAID_UNCONFIRMED_MESSAGE} Order ${pendingVerify.orderId}.`);
          } else {
            updateSession({ pendingVerify: null });
            setError(`${PAID_NEEDS_HELP_MESSAGE} Order ${pendingVerify.orderId}.`);
          }
          return;
        }
        finish({
          orderId: pendingVerify.orderId,
          subtotal: paid?.subtotal ?? subtotal,
          shipping: paid?.shipping ?? shipping,
          total: paid?.total ?? total,
          status: "received",
          paymentStatus: "paid",
          paymentNote: "Payment received. Fresh preparation starts now.",
        });
        return;
      }

      const key = detailsKey(details);
      // Reuse the same idempotency key for this cart + details, so a retry
      // after a lost createOrder response returns the first order rather than
      // creating a second one.
      const attemptKey =
        session.attempt &&
        session.attempt.cartKey === currentCartKey &&
        session.attempt.detailsKey === key
          ? session.attempt.key
          : crypto.randomUUID();
      updateSession({ attempt: { key: attemptKey, cartKey: currentCartKey, detailsKey: key } });

      order = pendingOrder && pendingOrder.detailsKey === key ? pendingOrder.order : null;
      if (!order) {
        order = await createOrder(details, lines, attemptKey);
        if (order.razorpayOrderId) {
          updateSession({ pendingOrder: { order, cartKey: currentCartKey, detailsKey: key } });
        }
      }
      if (!order.razorpayOrderId) {
        finish(order);
        return;
      }

      const result = await openPayment(order, details);
      // From here on the shopper has paid. Remember the signed result before
      // relaying it, so a lost relay can be retried without a second charge.
      updateSession({ pendingVerify: result });
      try {
        await verifyPayment(
          result.orderId,
          result.razorpayOrderId,
          result.razorpayPaymentId,
          result.razorpaySignature
        );
      } catch (err) {
        if (isTransientVerifyFailure(err)) {
          setError(`${PAID_UNCONFIRMED_MESSAGE} Order ${order.orderId}.`);
        } else {
          updateSession({ pendingVerify: null });
          setError(`${PAID_NEEDS_HELP_MESSAGE} Order ${order.orderId}.`);
        }
        return;
      }
      finish({
        ...order,
        paymentStatus: "paid",
        paymentNote: "Payment received. Fresh preparation starts now.",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(
        order?.razorpayOrderId
          ? `${message} Your order ${order.orderId} is saved - press the button again to retry its payment.`
          : message
      );
    } finally {
      slow.clear();
      setSlowHint(false);
      setSubmitting(false);
    }
  };

  const buttonLabel = submitting
    ? "Placing order..."
    : pendingVerify
      ? `Confirm payment for ${pendingVerify.orderId}`
      : pendingOrder
        ? `Retry payment for ${pendingOrder.order.orderId} · ${formatINR(pendingOrder.order.total)}`
        : `Place order · ${formatINR(total)}`;

  return (
    <form
      className="mx-auto max-w-6xl px-4 md:px-6 pb-20 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-start"
      onSubmit={handleSubmit}
      onInput={(e) => {
        const data = new FormData(e.currentTarget);
        setRecap(
          Object.fromEntries(
            ["house", "street", "landmark", "city", "pincode", "phone"].map((k) => [
              k,
              String(data.get(k) ?? "").trim(),
            ])
          )
        );
      }}
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
                ref={f.id === "city" ? cityRef : undefined}
                autoComplete={f.autoComplete}
                required={!("optional" in f && f.optional)}
                minLength={f.id === "pincode" ? 6 : f.id === "phone" ? 10 : undefined}
                maxLength={f.id === "pincode" ? 6 : f.id === "phone" ? 20 : undefined}
                pattern={
                  f.id === "pincode"
                    ? "\\d{6}"
                    : f.id === "phone"
                      ? "([^0-9]*[0-9]){10}[^0-9]*"
                      : undefined
                }
                title={
                  f.id === "pincode"
                    ? "6-digit pincode"
                    : f.id === "phone"
                      ? "10-digit mobile number"
                      : undefined
                }
                inputMode={f.id === "pincode" ? "numeric" : f.id === "phone" ? "tel" : undefined}
                onChange={f.id === "pincode" ? onPincodeChange : undefined}
                className="mt-1.5 w-full rounded-xl border-2 border-charcoal/15 bg-cream/50 px-4 py-2.5 font-semibold focus:border-red focus:outline-none"
              />
              {f.id === "pincode" && pinHint && (
                <p className="mt-1 text-xs font-semibold text-leaf" role="status">
                  ✓ {pinHint}
                </p>
              )}
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
        {pendingVerify && (
          <p className="mt-3 rounded-2xl bg-gold/15 border border-gold/40 p-3 text-xs text-cream/90">
            Payment for <strong>{pendingVerify.orderId}</strong> has been received.
            Press the button below once to finish confirming it.
          </p>
        )}
        <ul className="mt-4 divide-y divide-cream/10">
          {lines.map((line) => (
            <li key={line.id} className="py-3 flex items-center justify-between gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  line.kind === "product"
                    ? getProduct(line.productSlug)?.image ?? "/logo.webp"
                    : getBox(line.boxSlug)?.image ?? "/logo.webp"
                }
                alt=""
                width={640}
                height={1180}
                className="w-8 h-auto shrink-0 drop-shadow"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{lineTitle(line)}</p>
                {!pendingVerify && (
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
                )}
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

        {recap.house && recap.street && recap.pincode?.length === 6 && (
          <div className="mt-4 rounded-2xl bg-cream/10 border border-cream/15 p-4 text-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gold">
              Delivering to
            </p>
            <p className="mt-1.5 leading-relaxed text-cream/90">
              {recap.house}, {recap.street}
              {recap.landmark ? `, Near ${recap.landmark}` : ""}
              {recap.city ? `, ${recap.city}` : ""} - {recap.pincode}
            </p>
            {recap.phone && (
              <p className="mt-1 text-cream/60 text-xs">Courier calls: {recap.phone}</p>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-cream/60">
          Estimated delivery: <strong className="text-cream/90">{deliveryWindow()}</strong>
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-gold text-charcoal px-6 py-3.5 font-extrabold hover:bg-cream active:scale-[0.99] transition-all disabled:opacity-60"
        >
          {buttonLabel}
        </button>
        {submitting && slowHint && (
          <p className="mt-3 text-xs text-cream/70" role="status">
            Taking longer than usual - slow network or our kitchen server is
            waking up. Hang on, don&apos;t refresh.
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border-2 border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed"
          >
            <p className="font-bold">
              {pendingVerify ? "Payment received, confirmation pending." : "Order didn't go through."}
            </p>
            <p className="mt-1 text-cream/80">{error}</p>
          </div>
        )}
      </aside>
    </form>
  );
}
