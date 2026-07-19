"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DELIVERY_NOTE, products } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pinned scroll scene is desktop-only: on touch screens pinning fights
      // native scrolling (feels stuck) and URL-bar resizes cause jumps.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=120%",
            scrub: 0.6,
            pin: true,
          },
        });

        // Headline swap
        tl.to(".hero-headline-1", { yPercent: -30, opacity: 0, ease: "power1.in" }, 0.35)
          .fromTo(
            ".hero-headline-2",
            { yPercent: 30, opacity: 0 },
            { yPercent: 0, opacity: 1, ease: "power1.out" },
            0.45
          )
          // 4. Four flavour jars fly in from different directions
          .fromTo(
            ".hero-flavour-0",
            { x: -180, y: 60, opacity: 0, rotation: -18 },
            { x: 0, y: 0, opacity: 1, rotation: -6, ease: "back.out(1.4)" },
            0.55
          )
          .fromTo(
            ".hero-flavour-1",
            { x: 180, y: 60, opacity: 0, rotation: 18 },
            { x: 0, y: 0, opacity: 1, rotation: 6, ease: "back.out(1.4)" },
            0.6
          )
          .fromTo(
            ".hero-flavour-2",
            { x: -140, y: -60, opacity: 0, rotation: -14 },
            { x: 0, y: 0, opacity: 1, rotation: -3, ease: "back.out(1.4)" },
            0.65
          )
          .fromTo(
            ".hero-flavour-3",
            { x: 140, y: -60, opacity: 0, rotation: 14 },
            { x: 0, y: 0, opacity: 1, rotation: 3, ease: "back.out(1.4)" },
            0.7
          );
      });

      // Mobile and reduced motion: everything visible, no pin, no scrub.
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [".hero-headline-2", ".hero-flavour-0", ".hero-flavour-1", ".hero-flavour-2", ".hero-flavour-3"],
          { opacity: 1, x: 0, y: 0 }
        );
        gsap.set(".hero-headline-1", { opacity: 0 });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-dvh overflow-hidden bg-charcoal text-cream grain"
    >
      {/* Hero photography: jar on the spice table, copy space left */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-jar.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
      />
      {/* Extra darkening on small screens where copy overlaps the jar */}
      <div aria-hidden className="absolute inset-0 bg-[rgba(28,16,12,0.45)] md:hidden" />
      {/* Legibility gradient over the copy side */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(28,16,12,0.92) 0%, rgba(28,16,12,0.72) 38%, rgba(28,16,12,0.15) 68%, rgba(28,16,12,0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background: "linear-gradient(0deg, rgba(28,16,12,0.85), rgba(28,16,12,0))",
        }}
      />


      <div className="relative mx-auto max-w-6xl px-4 md:px-6 min-h-dvh flex items-center py-24">
        {/* Copy */}
        <div className="relative z-10 max-w-xl">
          <div className="relative grid">
            <h1 className="hero-headline-1 col-start-1 row-start-1 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              Not just pickle.
              <span className="block mt-2 text-gold font-telugu text-3xl sm:text-4xl lg:text-5xl">
                Idi full meal ki main character.
              </span>
            </h1>
            <h1
              className="hero-headline-2 col-start-1 row-start-1 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] opacity-0"
              aria-hidden
            >
              Mamayya jar open ayithe…
              <span className="block mt-2 text-gold font-telugu text-3xl sm:text-4xl lg:text-5xl">
                meal simple ga undadu.
              </span>
            </h1>
          </div>

          <p className="mt-6 text-cream/80 max-w-md text-base sm:text-lg">
            Handmade non-veg pickles packed with bold spices and delivered
            across India.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-red px-7 py-3.5 font-bold text-cream hover:bg-red-deep active:scale-[0.97] transition-all shadow-jar"
            >
              Taste Mamayya&apos;s Pickles
            </Link>
            <Link
              href="/build-a-box"
              className="rounded-full border-2 border-gold px-7 py-3.5 font-bold text-gold hover:bg-gold hover:text-charcoal active:scale-[0.97] transition-all"
            >
              Build Your Pickle Box
            </Link>
          </div>

          <p className="mt-8 text-xs sm:text-sm text-cream/70">{DELIVERY_NOTE}</p>

          {/* The four jars, standing under the promise */}
          <div className="mt-10 flex gap-4 sm:gap-6">
            {products.map((p, i) => (
              <div key={p.slug} className={`hero-flavour-${i} opacity-0 w-14 sm:w-16`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={`${p.name} jar`} width={640} height={1180}
                     className="w-full h-auto drop-shadow-lg" />
                <p className="text-center text-[10px] sm:text-xs font-bold text-cream/80 mt-1.5">
                  {p.shortName}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </section>
  );
}
