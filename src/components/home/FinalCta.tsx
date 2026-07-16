import Link from "next/link";
import { DELIVERY_NOTE, deliveryWindow } from "@/lib/products";

export default function FinalCta() {
  return (
    <section className="relative bg-red text-cream py-24 md:py-32 overflow-hidden">
      {/* Marquee backdrop */}
      <div aria-hidden className="absolute inset-x-0 top-6 opacity-10 whitespace-nowrap overflow-hidden">
        <div className="animate-marquee inline-block font-display font-extrabold text-7xl">
          {Array(6)
            .fill("MAMAYYA · CHICKEN · MUTTON · FISH · SHRIMP · ")
            .join("")}
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-4 md:px-6 text-center">
        <h2 className="font-display font-extrabold text-4xl md:text-6xl leading-tight">
          Rice ready unda?
        </h2>
        <p className="mt-3 font-telugu text-2xl md:text-3xl text-gold">
          Mamayya is sending the pickle.
        </p>
        <p className="mt-6 text-cream/80 max-w-md mx-auto">
          Jar empty avvadaniki ekkuva time pattadu. The next one takes about a
          week to reach you, so order early.
        </p>

        <Link
          href="/shop"
          className="mt-9 inline-block rounded-full bg-cream text-red px-10 py-4 font-display font-extrabold text-lg hover:bg-gold hover:text-charcoal transition-colors shadow-jar"
        >
          Order Now
        </Link>

        <p className="mt-6 text-sm text-cream/70">
          Estimated delivery: {deliveryWindow()}
        </p>
        <p className="mt-1 text-xs text-cream/60">{DELIVERY_NOTE}</p>
      </div>
    </section>
  );
}
