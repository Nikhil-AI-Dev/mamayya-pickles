"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ApiError, TrackedOrder, getOrder } from "@/lib/api";
import { formatINR } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STAGE_COPY: Record<string, { name: string; detail: string }> = {
  confirmed: {
    name: "Confirmed",
    detail: "Payment received. Your order number is in your email.",
  },
  preparing: {
    name: "Preparing",
    detail: "Your batch is being cooked fresh - this takes 2-3 days.",
  },
  packed: {
    name: "Packed",
    detail: "Jars sealed, shrink-wrapped and cushioned in a rigid carton.",
  },
  shipped: {
    name: "Shipped",
    detail: "Handed to the courier. You receive the AWB tracking number by email.",
  },
  out_for_delivery: {
    name: "Out for delivery",
    detail: "The courier is in your area. Keep your phone reachable.",
  },
  delivered: {
    name: "Delivered",
    detail: "Refrigerate after opening. Clean, dry spoon every time.",
  },
};

const STAGE_ORDER = Object.keys(STAGE_COPY);

export default function TrackLookup() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const stagesRef = useRef<HTMLElement>(null);

  // Deep link from the confirmation email: /track?order=MP-1234
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("order");
    if (fromLink) setOrderId(fromLink);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Stamps press in one after another: the reveal order mirrors the order journey.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".stage-stamp", {
          opacity: 0,
          scale: 0.6,
          rotation: -18,
          transformOrigin: "center center",
          stagger: 0.12,
          duration: 0.4,
          ease: "back.out(1.6)",
          scrollTrigger: {
            trigger: stagesRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      });
    },
    { scope: stagesRef }
  );

  const lookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await getOrder(orderId, phone));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const reachedByName = new Map(order?.stages.map((s) => [s.name, s]) ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20 grid gap-10 lg:grid-cols-[1fr_1.2fr] items-start">
      {/* Lookup */}
      <div className="lg:sticky lg:top-24">
        <form
          className="rounded-3xl bg-white/80 border border-charcoal/10 shadow-card p-6"
          onSubmit={lookup}
        >
          <label htmlFor="order-id" className="block font-bold text-charcoal">
            Order number
          </label>
          <input
            id="order-id"
            name="order-id"
            type="text"
            required
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setError(null);
            }}
            placeholder="e.g. MP-1001"
            className="mt-2 w-full rounded-xl border-2 border-charcoal/15 bg-cream/50 px-4 py-3 font-semibold placeholder:text-charcoal/55 focus:border-red focus:outline-none"
          />
          <p className="mt-2 text-xs text-charcoal/60">
            It&apos;s on your order confirmation screen and email, starting with MP-.
          </p>

          <label htmlFor="track-phone" className="mt-4 block font-bold text-charcoal">
            Phone number used on the order
          </label>
          <input
            id="track-phone"
            name="track-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            placeholder="10-digit number"
            className="mt-2 w-full rounded-xl border-2 border-charcoal/15 bg-cream/50 px-4 py-3 font-semibold placeholder:text-charcoal/55 focus:border-red focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-red text-cream px-6 py-3.5 font-bold hover:bg-red-deep transition-colors disabled:opacity-60"
          >
            {loading ? "Looking up..." : "Find my order"}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border-2 border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed"
            >
              <p className="font-bold text-charcoal">{error}</p>
              <p className="mt-1.5 text-charcoal/80">
                Double-check the number, or write to us and we&apos;ll find it:{" "}
                <a
                  href={`mailto:contact@mamayyapickles.com?subject=Where is my order ${encodeURIComponent(orderId)}`}
                  className="font-bold text-red hover:underline"
                >
                  contact@mamayyapickles.com
                </a>
              </p>
            </div>
          )}
        </form>

        {order && (
          <div className="mt-4 rounded-3xl bg-charcoal text-cream p-6 shadow-jar">
            <h2 className="font-display font-extrabold text-xl text-gold">
              {order.orderId}
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-cream/70">Placed on</dt>
                <dd className="font-bold">{order.placedOn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream/70">Total</dt>
                <dd className="font-bold">{formatINR(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream/70">Estimated delivery</dt>
                <dd className="font-bold">{order.deliveryWindow}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream/70">Payment</dt>
                <dd className="font-bold">
                  {order.paymentStatus === "paid"
                    ? "Paid"
                    : order.paymentStatus === "pending"
                      ? "Payment pending"
                      : "Test order"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream/70">Current stage</dt>
                <dd className="font-bold text-gold">
                  {order.confirmed
                    ? (STAGE_COPY[order.currentStage]?.name ?? order.currentStage)
                    : "Waiting for kitchen confirmation"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Stage stamps */}
      <section ref={stagesRef} aria-labelledby="stages-heading">
        <h2 id="stages-heading" className="font-display font-extrabold text-2xl text-charcoal">
          {order
            ? `Where ${order.orderId} is right now`
            : "The six stamps every order collects"}
        </h2>
        {order && !order.confirmed && (
          <p className="mt-4 rounded-2xl border-2 border-gold/60 bg-gold/10 p-4 text-sm leading-relaxed text-charcoal/80">
            <strong className="text-charcoal">The kitchen hasn&apos;t confirmed this order yet.</strong>{" "}
            You&apos;ll get an email the moment it does - then the one-week delivery
            clock starts and the stamps below begin filling in.
          </p>
        )}
        <ol className="mt-6 space-y-0">
          {STAGE_ORDER.map((key, i) => {
            const copy = STAGE_COPY[key];
            const stage = reachedByName.get(key);
            const reached = stage?.reached ?? false;
            const isCurrent = order?.currentStage === key;
            return (
              <li key={key} className="relative flex gap-5 pb-8 last:pb-0">
                {i < STAGE_ORDER.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-[22px] top-12 bottom-0 border-l-2 border-dashed ${
                      reached && !isCurrent ? "border-red/50" : "border-charcoal/20"
                    }`}
                  />
                )}
                <span
                  aria-hidden
                  className={`stage-stamp relative grid place-items-center w-11 h-11 shrink-0 rounded-full border-2 font-display font-extrabold rotate-[-6deg] transition-colors ${
                    order
                      ? reached
                        ? "border-red bg-red text-cream"
                        : "border-charcoal/25 bg-cream-deep/50 text-charcoal/40"
                      : "border-charcoal/70 bg-cream-deep text-charcoal"
                  }`}
                >
                  {reached ? "✓" : i + 1}
                </span>
                <div className="pt-1.5">
                  <h3
                    className={`font-display font-extrabold ${
                      order && !reached ? "text-charcoal/45" : "text-charcoal"
                    }`}
                  >
                    {copy.name}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-gold text-charcoal text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 align-middle">
                        Now
                      </span>
                    )}
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      order && !reached ? "text-charcoal/40" : "text-charcoal/70"
                    }`}
                  >
                    {order && stage && !reached
                      ? `Expected around ${stage.expected}. ${copy.detail}`
                      : copy.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
