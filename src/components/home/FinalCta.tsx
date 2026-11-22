"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DELIVERY_NOTE, deliveryWindow } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ROLL = "MAMAYYA · CHICKEN · MUTTON · FISH · PRAWN · ";

export default function FinalCta() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".fcta-rise", {
          y: 26,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
          clearProps: "transform,opacity",
        });
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative bg-red text-cream py-24 md:py-32 overflow-hidden">
      {/* Flavour roll-call drifting across the back. Two identical copies in one
          animated track give a seamless loop (the track slides exactly one copy). */}
      <div aria-hidden className="absolute inset-x-0 top-8 overflow-hidden">
        <div className="animate-marquee flex w-max whitespace-nowrap opacity-10 font-display font-extrabold text-[3.4vw] leading-none tracking-wide">
          <span>{ROLL.repeat(4)}</span>
          <span>{ROLL.repeat(4)}</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-4 md:px-6 text-center">
        <h2 className="fcta-rise font-display font-extrabold text-4xl md:text-6xl leading-tight">
          Rice ready unda?
        </h2>
        <p className="fcta-rise mt-3 font-telugu text-2xl md:text-3xl text-gold">
          Mamayya is sending the pickle.
        </p>
        <p className="fcta-rise mt-6 text-cream/80 max-w-md mx-auto">
          Jar empty avvadaniki ekkuva time pattadu. The next one takes about a
          week to reach you, so order early.
        </p>

        <div className="fcta-rise">
          <Link
            href="/shop"
            className="tap mt-9 inline-block rounded-full bg-cream text-red px-10 py-4 font-display font-extrabold text-lg hover:bg-gold hover:text-charcoal shadow-jar"
          >
            Order now
          </Link>
        </div>

        <p className="fcta-rise mt-6 text-sm text-cream/70">
          Estimated delivery: {deliveryWindow()}
        </p>
        <p className="fcta-rise mt-1 text-xs text-cream/60">{DELIVERY_NOTE}</p>
      </div>
    </section>
  );
}
