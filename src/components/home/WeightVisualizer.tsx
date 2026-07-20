"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { WeightGrams, formatINR, products } from "@/lib/products";

/** Jar render width per weight - the size story told visually. */
const JAR_SCALE: Record<WeightGrams, number> = {
  250: 0.55,
  500: 0.7,
  1000: 0.85,
  2000: 1,
  5000: 1.2,
};

export default function WeightVisualizer() {
  const [productIdx, setProductIdx] = useState(0);
  const [grams, setGrams] = useState<WeightGrams>(500);
  const { addProduct } = useCart();

  const product = products[productIdx];
  const weight = product.weights.find((w) => w.grams === grams)!;

  return (
    <section className="bg-cream-deep grain py-20 md:py-28" id="sizes">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display font-extrabold text-3xl md:text-5xl">
          Pick your size. Watch it grow.
        </h2>

        {/* Product tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {products.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setProductIdx(i)}
              className={`flex items-center gap-2 rounded-full pl-2 pr-5 py-1.5 text-sm font-bold border-2 transition-all active:scale-95 ${
                i === productIdx
                  ? "text-cream border-transparent shadow-card scale-105"
                  : "border-charcoal/20 text-charcoal/70 hover:border-charcoal/50"
              }`}
              style={i === productIdx ? { background: p.color } : { background: p.colorSoft }}
              aria-pressed={i === productIdx}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                width={640}
                height={1180}
                className="w-5 h-auto drop-shadow"
              />
              {p.shortName}
            </button>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-10 items-center">
          {/* Jar that grows */}
          <div className="grid place-items-center min-h-72">
            <div
              className="transition-transform duration-500 ease-out w-40 md:w-44"
              style={{ transform: `scale(${JAR_SCALE[grams]})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={`${product.name} ${weight.label} jar`}
                width={640}
                height={1180}
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
            <p className="mt-2 text-sm text-charcoal/60">{weight.packaging}</p>
          </div>

          {/* Weight cards */}
          <div className="space-y-3">
            {product.weights.map((w) => (
              <button
                key={w.grams}
                type="button"
                onClick={() => setGrams(w.grams)}
                className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all active:scale-[0.99] flex items-center justify-between gap-4 ${
                  w.grams === grams
                    ? "border-red shadow-card scale-[1.02]"
                    : "border-charcoal/10 bg-cream/60 hover:border-charcoal/30 hover:bg-cream"
                }`}
                style={w.grams === grams ? { background: product.colorSoft } : undefined}
                aria-pressed={w.grams === grams}
              >
                <div>
                  <p className="font-display font-bold text-lg">
                    {w.label}
                    {w.grams === 500 && (
                      <span className="ml-2 rounded-full bg-gold/20 text-clay text-[11px] font-sans font-extrabold px-2 py-0.5 uppercase tracking-wide">
                        Most popular
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-charcoal/60">
                    {w.note} · {w.servings}
                  </p>
                </div>
                <p
                  className={`font-display font-bold text-xl shrink-0 ${
                    w.grams === grams ? "text-red" : ""
                  }`}
                >
                  {formatINR(w.price)}
                </p>
              </button>
            ))}

            <button
              type="button"
              onClick={() => addProduct(product, grams)}
              className="w-full rounded-full bg-red text-cream py-4 font-bold hover:bg-red-deep active:scale-[0.98] transition-all"
            >
              Add {product.shortName} {weight.label} · {formatINR(weight.price)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
