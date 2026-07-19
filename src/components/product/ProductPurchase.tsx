"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import {
  FREE_SHIPPING_THRESHOLD,
  Product,
  WeightGrams,
  deliveryWindow,
  formatINR,
} from "@/lib/products";

export default function ProductPurchase({ product }: { product: Product }) {
  const { addProduct } = useCart();
  const [grams, setGrams] = useState<WeightGrams>(500);
  const [quantity, setQuantity] = useState(1);
  const weight = product.weights.find((w) => w.grams === grams)!;
  const lineTotal = weight.price * quantity;

  return (
    <div className="rounded-3xl bg-white/80 border border-charcoal/10 shadow-card p-6">
      <fieldset>
        <legend className="text-xs font-extrabold uppercase tracking-[0.2em] text-charcoal/60">
          Pick a size
        </legend>
        <div className="mt-3 grid gap-2">
          {product.weights.map((w) => (
            <button
              key={w.grams}
              type="button"
              onClick={() => setGrams(w.grams)}
              aria-pressed={w.grams === grams}
              className={`flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                w.grams === grams
                  ? "border-red bg-red/5"
                  : "border-charcoal/10 hover:border-charcoal/30"
              }`}
            >
              <span>
                <span className="font-bold text-charcoal">{w.label}</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-wide text-clay">
                  {w.note}
                </span>
                <span className="block text-xs text-charcoal/60 mt-0.5">
                  {w.servings} · {w.packaging}
                </span>
              </span>
              <span className="font-display font-extrabold text-lg text-charcoal shrink-0">
                {formatINR(w.price)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center rounded-full border-2 border-charcoal/15">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 grid place-items-center font-bold text-lg hover:text-red transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="w-10 h-10 grid place-items-center font-bold text-lg hover:text-red transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => addProduct(product, grams, quantity)}
          className="flex-1 min-w-44 rounded-full bg-red text-cream px-6 py-3.5 font-bold hover:bg-red-deep active:scale-[0.98] transition-all"
        >
          Add to cart · {formatINR(lineTotal)}
        </button>
      </div>

      <ul className="mt-5 space-y-1.5 text-xs text-charcoal/70">
        <li>Estimated delivery: <strong>{deliveryWindow()}</strong> (fresh preparation + shipping)</li>
        <li>Free shipping above {formatINR(FREE_SHIPPING_THRESHOLD)} · online payment only</li>
      </ul>
    </div>
  );
}
