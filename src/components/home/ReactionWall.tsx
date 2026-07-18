"use client";

import { useState } from "react";
import { products } from "@/lib/products";

type Reaction = {
  quote: string;
  name: string;
  city: string;
  productSlug: string;
  pairing: string;
};

const REACTIONS: Reaction[] = [
  {
    quote: "Curd rice ki shrimp pickle add chesa. Entire plate finish.",
    name: "Pravallika",
    city: "Hyderabad",
    productSlug: "shrimp-pickle",
    pairing: "Curd rice",
  },
  {
    quote: "Ordered 250 g chicken to 'try'. Reordered 1 kg within the week.",
    name: "Arjun",
    city: "Bengaluru",
    productSlug: "chicken-pickle",
    pairing: "Ghee rice",
  },
  {
    quote: "Mutton pieces are actually big. Not the powder-with-two-pieces situation.",
    name: "Sneha",
    city: "Pune",
    productSlug: "mutton-pickle",
    pairing: "Paratha",
  },
  {
    quote: "Fish pickle tho rasam rice - hostel rooms are crying with jealousy.",
    name: "Vikram",
    city: "Chennai",
    productSlug: "fish-pickle",
    pairing: "Rasam rice",
  },
  {
    quote: "Packed like it was going to space. Not one drop of oil leaked.",
    name: "Divya",
    city: "Delhi",
    productSlug: "mutton-pickle",
    pairing: "Pulao",
  },
  {
    quote: "Midnight dosa + chicken pickle. New tradition in this house.",
    name: "Rahul",
    city: "Mumbai",
    productSlug: "chicken-pickle",
    pairing: "Dosa",
  },
  {
    quote: "Shrimp jar emptied in four days. Four. Days.",
    name: "Keerthi",
    city: "Visakhapatnam",
    productSlug: "shrimp-pickle",
    pairing: "Dal rice",
  },
  {
    quote: "Amma approved the fish pickle. That is the highest certification.",
    name: "Manoj",
    city: "Vijayawada",
    productSlug: "fish-pickle",
    pairing: "Curd rice",
  },
];

export default function ReactionWall() {
  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter
    ? REACTIONS.filter((r) => r.productSlug === filter)
    : REACTIONS;

  return (
    <section className="bg-cream-deep grain py-20 md:py-28" id="wall">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display font-extrabold text-3xl md:text-5xl">
          Plates that didn&apos;t survive
        </h2>

        {/* Filter chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={`rounded-full px-5 py-2 text-sm font-bold border-2 transition-colors ${
              filter === null
                ? "bg-charcoal text-cream border-charcoal"
                : "border-charcoal/20 text-charcoal/70 hover:border-charcoal/50"
            }`}
            aria-pressed={filter === null}
          >
            All
          </button>
          {products.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setFilter(p.slug)}
              className={`rounded-full px-5 py-2 text-sm font-bold border-2 transition-colors ${
                filter === p.slug
                  ? "text-cream border-transparent"
                  : "border-charcoal/20 text-charcoal/70 hover:border-charcoal/50"
              }`}
              style={filter === p.slug ? { background: p.color } : undefined}
              aria-pressed={filter === p.slug}
            >
              {p.shortName}
            </button>
          ))}
        </div>

        <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:break-inside-avoid">
          {visible.map((r) => {
            const product = products.find((p) => p.slug === r.productSlug)!;
            return (
              <figure
                key={r.quote}
                className="mb-5 rounded-2xl bg-white/80 border border-charcoal/10 p-6 shadow-card"
              >
                <div
                  className="h-1.5 w-12 rounded-full"
                  style={{ background: product.color }}
                  aria-hidden
                />
                <blockquote className="mt-4 font-display font-semibold text-lg leading-snug">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {r.name}
                    <span className="text-charcoal/50 font-normal"> · {r.city}</span>
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-cream"
                    style={{ background: product.color }}
                  >
                    {product.shortName} + {r.pairing}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-charcoal/50">
          Sample reactions shown for layout - replace with real customer photos,
          videos and verified reviews before launch.
        </p>
      </div>
    </section>
  );
}
