"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  FREE_SHIPPING_THRESHOLD,
  WeightGrams,
  boxes,
  formatINR,
  getProduct,
  products,
} from "@/lib/products";
import JarIllustration from "../JarIllustration";
import SpiceMeter from "../SpiceMeter";

type PickGrams = 250 | 500;
const PICK_SIZES: PickGrams[] = [250, 500];
const CARTON_SLOTS = 12;

type Counts = Record<string, number>;

const keyOf = (slug: string, grams: PickGrams) => `${slug}:${grams}`;

export default function BoxBuilder() {
  const { addProduct, addBox } = useCart();
  const [counts, setCounts] = useState<Counts>({});
  const [added, setAdded] = useState(false);

  const picks = useMemo(() => {
    return Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([key, n]) => {
        const [slug, g] = key.split(":");
        const product = getProduct(slug)!;
        const grams = Number(g) as PickGrams;
        const weight = product.weights.find((w) => w.grams === grams)!;
        return { product, grams, count: n, price: weight.price };
      });
  }, [counts]);

  const jarCount = picks.reduce((sum, p) => sum + p.count, 0);
  const subtotal = picks.reduce((sum, p) => sum + p.price * p.count, 0);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const bump = (slug: string, grams: PickGrams, delta: number) => {
    setAdded(false);
    setCounts((prev) => {
      const key = keyOf(slug, grams);
      const next = Math.max(0, Math.min(10, (prev[key] ?? 0) + delta));
      return { ...prev, [key]: next };
    });
  };

  const addAllToCart = () => {
    picks.forEach((p) =>
      addProduct(p.product, p.grams as WeightGrams, p.count)
    );
    setCounts({});
    setAdded(true);
  };

  // Carton visual: one mini jar per pick, capped at the visible slot count.
  const miniJars = picks.flatMap((p) =>
    Array.from({ length: p.count }, (_, i) => ({
      id: `${p.product.slug}-${p.grams}-${i}`,
      color: p.product.color,
      small: p.grams === 250,
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-start">
      {/* Jar pickers */}
      <div className="space-y-4">
        {products.map((p) => (
          <section
            key={p.slug}
            aria-label={`Add ${p.name}`}
            className="rounded-3xl bg-white/70 border border-charcoal/10 shadow-card p-5 flex gap-5 items-center"
          >
            <div className="w-16 shrink-0 hidden sm:block">
              <JarIllustration color={p.color} label={`${p.name} jar`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="font-display font-extrabold text-lg text-charcoal">
                  {p.shortName}
                </h2>
                <SpiceMeter level={p.spiceLevel} label={p.spiceLabel} />
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {PICK_SIZES.map((grams) => {
                  const weight = p.weights.find((w) => w.grams === grams)!;
                  const count = counts[keyOf(p.slug, grams)] ?? 0;
                  return (
                    <div
                      key={grams}
                      className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 transition-colors ${
                        count > 0 ? "border-red bg-red/5" : "border-charcoal/10"
                      }`}
                    >
                      <span className="text-sm">
                        <span className="font-bold">{weight.label}</span>{" "}
                        <span className="text-charcoal/60">{formatINR(weight.price)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => bump(p.slug, grams, -1)}
                          disabled={count === 0}
                          className="w-8 h-8 grid place-items-center rounded-full border border-charcoal/20 font-bold disabled:opacity-30 hover:border-red hover:text-red transition-colors"
                          aria-label={`Remove one ${weight.label} ${p.shortName}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-sm" aria-live="polite">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(p.slug, grams, 1)}
                          className="w-8 h-8 grid place-items-center rounded-full border border-charcoal/20 font-bold hover:border-red hover:text-red transition-colors"
                          aria-label={`Add one ${weight.label} ${p.shortName}`}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* The carton */}
      <aside className="lg:sticky lg:top-24 rounded-3xl bg-charcoal text-cream p-6 shadow-jar">
        <h2 className="font-display font-extrabold text-2xl">
          {jarCount === 0
            ? "Your carton. Empty, for now."
            : `Your carton: ${jarCount} jar${jarCount > 1 ? "s" : ""} packed`}
        </h2>

        <div
          aria-hidden
          className="mt-5 grid grid-cols-6 gap-2 rounded-2xl border-2 border-dashed border-cream/25 p-3 min-h-24"
        >
          {miniJars.slice(0, CARTON_SLOTS).map((jar) => (
            <span
              key={jar.id}
              className={`rounded-md ${jar.small ? "h-6 self-end" : "h-9"}`}
              style={{ background: jar.color }}
            />
          ))}
          {miniJars.length === 0 && (
            <span className="col-span-6 grid place-items-center text-cream/40 text-xs font-bold py-4">
              Jars appear here as you add them
            </span>
          )}
        </div>
        {miniJars.length > CARTON_SLOTS && (
          <p className="mt-2 text-xs text-cream/60">
            + {miniJars.length - CARTON_SLOTS} more jar
            {miniJars.length - CARTON_SLOTS > 1 ? "s" : ""} (we pack multiple cartons)
          </p>
        )}

        <ul className="mt-5 space-y-1.5 text-sm">
          {picks.map((p) => (
            <li key={`${p.product.slug}-${p.grams}`} className="flex justify-between gap-3">
              <span className="text-cream/80">
                {p.count} × {p.product.shortName} · {p.grams} g
              </span>
              <span className="font-bold">{formatINR(p.price * p.count)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-cream/15 pt-4 flex justify-between items-baseline">
          <span className="text-sm text-cream/70">Subtotal</span>
          <span className="font-display font-extrabold text-2xl">{formatINR(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-cream/60">
          {freeShipping
            ? "Ships free."
            : subtotal > 0
              ? `Add ${formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.`
              : `Free shipping above ${formatINR(FREE_SHIPPING_THRESHOLD)}.`}
        </p>

        <button
          type="button"
          onClick={addAllToCart}
          disabled={jarCount === 0}
          className="mt-5 w-full rounded-full bg-gold text-charcoal px-6 py-3.5 font-extrabold hover:bg-cream transition-colors disabled:opacity-40 disabled:hover:bg-gold"
        >
          Add carton to cart
        </button>
        {added && (
          <p className="mt-3 text-xs font-bold text-gold" role="status">
            Carton added to your cart.
          </p>
        )}
      </aside>

      {/* Ready-made shortcut */}
      <section className="lg:col-span-2 mt-6">
        <h2 className="font-display font-extrabold text-2xl text-charcoal">
          Or skip the thinking - ready-made boxes
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {boxes.map((b) => (
            <article
              key={b.slug}
              className="rounded-2xl border-2 border-dashed border-charcoal/25 bg-cream-deep/60 p-4 flex flex-col"
            >
              <h3 className="font-display font-extrabold text-charcoal">{b.name}</h3>
              <p className="mt-1 text-xs text-charcoal/70 flex-1">{b.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display font-extrabold text-lg">{formatINR(b.price)}</span>
                <button
                  type="button"
                  onClick={() => addBox(b)}
                  className="rounded-full bg-charcoal text-cream px-4 py-1.5 text-xs font-bold hover:bg-red transition-colors"
                >
                  Add box
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
