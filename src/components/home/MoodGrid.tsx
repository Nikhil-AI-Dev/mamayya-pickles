"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatINR, products } from "@/lib/products";
import JarIllustration from "../JarIllustration";
import SpiceMeter from "../SpiceMeter";

export default function MoodGrid() {
  const { addProduct } = useCart();

  return (
    <section className="bg-cream grain py-20 md:py-28" id="moods">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display font-extrabold text-3xl md:text-5xl">
          Which Mamayya mood are you in?
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const startingPrice = p.weights[0].price;
            return (
              <div
                key={p.slug}
                className="group relative rounded-2xl border border-charcoal/10 bg-white/70 p-5 shadow-card transition-transform duration-300 hover:-translate-y-2 focus-within:-translate-y-2"
              >
                <p
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: p.color }}
                >
                  {p.mood}
                </p>
                <h3 className="mt-1 font-display font-bold text-2xl">{p.name}</h3>

                {/* Jar - lid tips open on hover */}
                <div className="relative mt-4 mx-auto w-28">
                  <div className="transition-transform duration-500 group-hover:scale-105">
                    <JarIllustration color={p.color} label={`${p.name} jar`} />
                  </div>
                </div>

                {/* Reveal panel */}
                <div className="mt-4 space-y-2 text-sm max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-56 group-hover:opacity-100 group-focus-within:max-h-56 group-focus-within:opacity-100">
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/60">Spice</span>
                    <SpiceMeter level={p.spiceLevel} label={p.spiceLabel} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/60">Texture</span>
                    <span className="font-semibold">{p.texture}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/60">Best with</span>
                    <span className="font-semibold">{p.pairings[0]}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm">
                    <span className="text-charcoal/50">from</span>{" "}
                    <span className="font-display font-bold text-lg">
                      {formatINR(startingPrice)}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => addProduct(p, 250)}
                    className="rounded-full bg-charcoal text-cream text-xs font-bold px-4 py-2 hover:bg-red transition-colors"
                  >
                    Quick add
                  </button>
                </div>

                <Link
                  href={`/products/${p.slug}`}
                  className="mt-3 block text-center text-xs font-bold uppercase tracking-wider hover:underline"
                  style={{ color: p.color }}
                >
                  Full story →
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center font-telugu text-charcoal/60">
          All four come with one warning: rice ekkuva cook chesukondi.
        </p>
      </div>
    </section>
  );
}
