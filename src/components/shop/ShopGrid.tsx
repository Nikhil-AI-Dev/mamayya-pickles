"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/lib/cart";
import {
  Box,
  Product,
  WeightGrams,
  boxes,
  formatINR,
  getProduct,
  products,
} from "@/lib/products";
import SpiceMeter from "../SpiceMeter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function ProductCard({ product }: { product: Product }) {
  const { addProduct } = useCart();
  const [grams, setGrams] = useState<WeightGrams>(500);
  const weight = product.weights.find((w) => w.grams === grams)!;

  return (
    <article className="shop-card flex flex-col rounded-3xl bg-white/70 border border-charcoal/10 shadow-card overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        className="relative grid place-items-center pt-10 pb-6 group"
        style={{ background: product.colorSoft }}
      >
        <span className="absolute top-4 left-4 text-2xl" aria-hidden>
          {product.emoji}
        </span>
        <span
          className="absolute top-4 right-3 text-[10px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg text-cream rotate-[3deg] shadow-[2px_2px_0_rgba(36,23,19,0.35)]"
          style={{ background: product.color }}
        >
          {product.mood}
        </span>
        <div className="w-24 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-2deg]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={`${product.name} jar`}
            width={640}
            height={1180}
            loading="lazy"
            decoding="async"
            className="w-full h-auto drop-shadow-lg"
          />
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-xl text-charcoal">
              <Link href={`/products/${product.slug}`} className="hover:text-red transition-colors">
                {product.name}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-charcoal/70">{product.tagline}</p>
          </div>
        </div>

        <div className="mt-3">
          <SpiceMeter level={product.spiceLevel} label={product.spiceLabel} />
        </div>

        <fieldset className="mt-4">
          <legend className="sr-only">Choose weight for {product.name}</legend>
          <div className="flex flex-wrap gap-1.5">
            {product.weights.map((w) => (
              <button
                key={w.grams}
                type="button"
                onClick={() => setGrams(w.grams)}
                aria-pressed={w.grams === grams}
                className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
                  w.grams === grams
                    ? "bg-charcoal text-cream border-charcoal"
                    : "border-charcoal/20 text-charcoal/70 hover:border-charcoal/50"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs text-charcoal/60">
          {weight.note} · {weight.servings}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <p className="font-display font-extrabold text-2xl text-charcoal">
            {formatINR(weight.price)}
          </p>
          <button
            type="button"
            onClick={() => addProduct(product, grams)}
            className="rounded-full bg-red text-cream px-5 py-2.5 text-sm font-bold hover:bg-red-deep transition-colors"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

function BoxTicket({ box }: { box: Box }) {
  const { addBox } = useCart();
  const savings = box.compareAt - box.price;

  return (
    <article className="relative rounded-2xl border-2 border-dashed border-charcoal/25 bg-cream-deep/60 p-5 flex flex-col">
      <span className="absolute -top-3 left-5 rounded-full bg-gold text-charcoal text-[11px] font-extrabold uppercase tracking-wider px-3 py-1">
        Save {formatINR(savings)}
      </span>
      <h3 className="mt-1 font-display font-extrabold text-lg text-charcoal">{box.name}</h3>
      <p className="mt-1 text-sm text-charcoal/70">{box.description}</p>

      <ul className="mt-3 space-y-1 text-sm text-charcoal/80">
        {box.contents.map((c) => {
          const p = getProduct(c.productSlug)!;
          return (
            <li key={`${c.productSlug}-${c.grams}`} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: p.color }}
              />
              {c.count} × {p.shortName} · {c.grams >= 1000 ? `${c.grams / 1000} kg` : `${c.grams} g`}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <p>
          <span className="font-display font-extrabold text-xl text-charcoal">
            {formatINR(box.price)}
          </span>{" "}
          <s className="text-sm text-charcoal/50">{formatINR(box.compareAt)}</s>
        </p>
        <button
          type="button"
          onClick={() => addBox(box)}
          className="rounded-full bg-charcoal text-cream px-4 py-2 text-sm font-bold hover:bg-red transition-colors"
        >
          Add box
        </button>
      </div>
    </article>
  );
}

export default function ShopGrid() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".shop-card", {
          y: 28,
          opacity: 0,
          stagger: 0.08,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top 80%",
            once: true,
          },
        });
      });
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} className="mx-auto max-w-6xl px-4 md:px-6 pb-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>

      <section aria-labelledby="boxes-heading" className="mt-16">
        <h2
          id="boxes-heading"
          className="font-display font-extrabold text-3xl text-charcoal"
        >
          Ready-made boxes, priced kinder.
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {boxes.map((b) => (
            <BoxTicket key={b.slug} box={b} />
          ))}
        </div>
        <p className="mt-6 text-sm text-charcoal/60">
          Want a different mix?{" "}
          <Link href="/build-a-box" className="font-bold text-red hover:underline">
            Build your own box
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
