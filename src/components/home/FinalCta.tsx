import Link from "next/link";
import { DELIVERY_NOTE, deliveryWindow } from "@/lib/products";

export default function FinalCta() {
  return (
    <section className="relative bg-red text-cream py-24 md:py-32 overflow-hidden">
      {/* Flavour roll-call backdrop, sized to always fit the viewport */}
      <div aria-hidden className="absolute inset-x-0 top-8 overflow-hidden">
        <p className="text-center font-display font-extrabold whitespace-nowrap opacity-10 text-[3.4vw] leading-none tracking-wide">
          MAMAYYA · CHICKEN · MUTTON · FISH · PRAWN
        </p>
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
          className="mt-9 inline-block rounded-full bg-cream text-red px-10 py-4 font-display font-extrabold text-lg hover:bg-gold hover:text-charcoal active:scale-[0.97] transition-all shadow-jar"
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
