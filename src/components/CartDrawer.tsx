"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart, lineTitle, lineUnitPrice } from "@/lib/cart";
import {
  DELIVERY_NOTE,
  FREE_SHIPPING_THRESHOLD,
  formatINR,
  deliveryWindow,
  getBox,
  getProduct,
  products,
} from "@/lib/products";
import JarIllustration from "./JarIllustration";

export default function CartDrawer() {
  const {
    lines,
    isOpen,
    closeCart,
    updateQuantity,
    removeLine,
    subtotal,
    shipping,
    total,
    amountToFreeShipping,
    addProduct,
  } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  const inCart = new Set(
    lines.filter((l) => l.kind === "product").map((l) => l.productSlug)
  );
  const suggestion = products.find((p) => !inCart.has(p.slug));

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className={`absolute inset-0 bg-charcoal/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        tabIndex={isOpen ? 0 : -1}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-cream shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/10">
          <h2 className="font-display font-bold text-xl">Your jar collection</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full w-9 h-9 grid place-items-center bg-charcoal/5 hover:bg-charcoal/10 text-lg"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6 text-center">
            <div>
              <JarIllustration color="#a92a1d" fill={0.2} className="w-24 mx-auto opacity-60" />
              <p className="mt-4 font-display font-bold text-lg">Cart is empty.</p>
              <p className="mt-1 text-sm text-charcoal/60">
                Rice is waiting. Add a jar.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-5 inline-block rounded-full bg-red text-cream px-6 py-3 text-sm font-bold hover:bg-red-deep transition-colors"
              >
                Browse pickles
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Free shipping progress */}
              <div className="rounded-xl bg-cream-deep px-4 py-3">
                {amountToFreeShipping > 0 ? (
                  <p className="text-xs font-semibold">
                    Add {formatINR(amountToFreeShipping)} more to unlock free
                    shipping.
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-leaf">
                    Free shipping unlocked ✓
                  </p>
                )}
                <div className="mt-2 h-1.5 rounded-full bg-charcoal/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {lines.map((line) => {
                const image =
                  line.kind === "product"
                    ? getProduct(line.productSlug)?.image ?? "/logo.webp"
                    : "/logo.webp";
                const sub =
                  line.kind === "box"
                    ? getBox(line.boxSlug)
                        ?.contents.map((c) => {
                          const p = getProduct(c.productSlug);
                          return `${c.grams} g ${p?.shortName}`;
                        })
                        .join(" · ")
                    : getProduct(line.productSlug)?.weights.find(
                        (w) => w.grams === line.grams
                      )?.packaging;
                return (
                  <div
                    key={line.id}
                    className="flex gap-3 rounded-xl border border-charcoal/10 bg-white/60 p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt=""
                      width={640}
                      height={1180}
                      className="w-10 h-auto self-center shrink-0 drop-shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight">
                        {lineTitle(line)}
                      </p>
                      {sub && (
                        <p className="mt-0.5 text-xs text-charcoal/60 truncate">
                          {sub}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-charcoal/15">
                          <button
                            type="button"
                            className="w-7 h-7 grid place-items-center font-bold hover:text-red"
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="w-7 h-7 grid place-items-center font-bold hover:text-red"
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-display font-bold">
                          {formatINR(lineUnitPrice(line) * line.quantity)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="self-start text-charcoal/40 hover:text-red text-sm"
                      aria-label={`Remove ${lineTitle(line)}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* Add-on suggestion */}
              {suggestion && (
                <div className="rounded-xl bg-cream-deep p-3 flex items-center gap-3">
                  <JarIllustration color={suggestion.color} className="w-10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">
                      Haven&apos;t tried {suggestion.shortName}?
                    </p>
                    <p className="text-xs text-charcoal/60">
                      250 g ·{" "}
                      {formatINR(
                        suggestion.weights.find((w) => w.grams === 250)?.price ?? 0
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProduct(suggestion, 250)}
                    className="rounded-full bg-charcoal text-cream text-xs font-bold px-3 py-1.5 hover:bg-red transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-charcoal/10 px-5 py-4 space-y-2 bg-white/50">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/70">Subtotal</span>
                <span className="font-bold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/70">Shipping estimate</span>
                <span className="font-bold">
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-base font-display font-bold pt-1 border-t border-charcoal/10">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
              <p className="text-xs text-charcoal/60">
                Estimated delivery: {deliveryWindow()}
              </p>
              <p className="text-xs text-charcoal/60">{DELIVERY_NOTE}</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block text-center rounded-full bg-red text-cream py-3.5 font-bold hover:bg-red-deep transition-colors"
              >
                Checkout · {formatINR(total)}
              </Link>
              <p className="text-center text-[11px] text-charcoal/50">
                Guest checkout available. No account needed.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
