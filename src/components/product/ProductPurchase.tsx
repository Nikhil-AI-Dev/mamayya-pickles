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

      <a
        href={`https://wa.me/919035843899?text=${encodeURIComponent(
          `Namaste Mamayya Pickles! I'd like to order ${quantity} x ${product.name} (${weight.label}) - ${formatINR(lineTotal)}. Please share the payment link.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-full border-2 border-leaf/40 text-leaf px-6 py-3 font-bold hover:bg-leaf hover:text-cream active:scale-[0.98] transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Order on WhatsApp
      </a>

      <ul className="mt-5 space-y-1.5 text-xs text-charcoal/70">
        <li>Estimated delivery: <strong>{deliveryWindow()}</strong> (fresh preparation + shipping)</li>
        <li>Free shipping above {formatINR(FREE_SHIPPING_THRESHOLD)} · online payment only</li>
      </ul>
    </div>
  );
}
