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
            end: "+=130%",
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
      {/* Warm glow behind the jar */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 62%, rgba(169,42,29,0.5), rgba(36,23,19,0) 70%)",
        }}
      />


      <div className="relative mx-auto max-w-6xl px-4 md:px-6 min-h-dvh grid md:grid-cols-2 items-center gap-8 py-20">
        {/* Copy */}
        <div className="relative z-10 order-2 md:order-1">
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

          <p className="mt-8 text-xs sm:text-sm text-cream/60">{DELIVERY_NOTE}</p>
        </div>

        {/* Jar scene */}
        <div className="relative order-1 md:order-2 grid place-items-center">
          <div className="relative w-64 sm:w-80 lg:w-[26rem]">
            {/* Gold offset ring around the arch */}
            <div
              aria-hidden
              className="absolute -inset-3 rounded-t-full rounded-b-[2.5rem] border-2 border-gold/40"
            />
            {/* Arch window onto the spice table */}
            <div className="overflow-hidden rounded-t-full rounded-b-[2rem] shadow-jar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-jar.webp"
                alt="Mamayya pickle jar on the spice table with brass pots and dried chillies"
                width={1672}
                height={941}
                className="w-full h-auto object-cover aspect-[3/4] object-[62%_center]"
              />
            </div>

            {/* Four flavour jars flying in */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3">
              {products.map((p, i) => (
                <div key={p.slug} className={`hero-flavour-${i} opacity-0 w-12 sm:w-16`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.name} jar`} width={640} height={1180}
                       className="w-full h-auto drop-shadow-lg" />
                  <p className="text-center text-[10px] sm:text-xs font-bold text-cream/80 mt-1">
                    {p.shortName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
