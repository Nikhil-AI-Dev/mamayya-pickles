"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DELIVERY_NOTE, products } from "@/lib/products";
import JarIllustration from "./JarIllustration";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=180%",
            scrub: 0.6,
            pin: true,
          },
        });

        // 1. Lid lifts off
        tl.to(".hero-lid", { y: -90, rotation: -14, ease: "power2.out" }, 0)
          // Spice particles drift up as the jar opens
          .to(
            ".hero-particle",
            { y: -70, opacity: 0.9, stagger: 0.04, ease: "power1.out" },
            0.05
          )
          // 2. Spoon rises with a chunk
          .fromTo(
            ".hero-spoon",
            { y: 90, rotation: 6, opacity: 0 },
            { y: -30, rotation: -8, opacity: 1, ease: "power2.out" },
            0.15
          )
          // 3. Headline swap
          .to(".hero-headline-1", { yPercent: -30, opacity: 0, ease: "power1.in" }, 0.35)
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

      // Reduced motion: everything visible, no pin, no scrub.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [".hero-headline-2", ".hero-spoon", ".hero-flavour-0", ".hero-flavour-1", ".hero-flavour-2", ".hero-flavour-3"],
          { opacity: 1, x: 0, y: 0 }
        );
        gsap.set(".hero-headline-1", { opacity: 0 });
        gsap.set(".hero-lid", { y: -60, rotation: -10 });
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
              className="rounded-full bg-red px-7 py-3.5 font-bold text-cream hover:bg-red-deep transition-colors shadow-jar"
            >
              Taste Mamayya&apos;s Pickles
            </Link>
            <Link
              href="/build-a-box"
              className="rounded-full border-2 border-gold px-7 py-3.5 font-bold text-gold hover:bg-gold hover:text-charcoal transition-colors"
            >
              Build Your Pickle Box
            </Link>
          </div>

          <p className="mt-8 text-xs sm:text-sm text-cream/60">{DELIVERY_NOTE}</p>
        </div>

        {/* Jar scene */}
        <div className="relative order-1 md:order-2 grid place-items-center">
          <div className="relative w-56 sm:w-72 lg:w-80">
            {/* Spice particles */}
            {[...Array(7)].map((_, i) => (
              <span
                key={i}
                aria-hidden
                className="hero-particle absolute rounded-full opacity-0"
                style={{
                  width: 5 + (i % 3) * 3,
                  height: 5 + (i % 3) * 3,
                  left: `${18 + i * 10}%`,
                  top: `${8 + (i % 4) * 6}%`,
                  background: i % 2 ? "#e6a62f" : "#c65b32",
                }}
              />
            ))}

            {/* Main jar with animatable lid */}
            <svg viewBox="0 0 160 200" className="w-full drop-shadow-2xl" role="img" aria-label="Mamayya pickle jar opening">
              <defs>
                <linearGradient id="hero-oil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c65b32" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#a92a1d" />
                  <stop offset="100%" stopColor="#8a2015" />
                </linearGradient>
                <clipPath id="hero-jarclip">
                  <path d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z" />
                </clipPath>
              </defs>

              {/* Lid - GSAP target */}
              <g className="hero-lid">
                <rect x="42" y="30" width="76" height="18" rx="6" fill="#3a2a24" />
                <rect x="42" y="42" width="76" height="6" rx="3" fill="#241713" />
                <rect x="52" y="24" width="56" height="10" rx="5" fill="#241713" />
                <text x="80" y="41" textAnchor="middle" fontSize="9" fill="#e6a62f" fontWeight="bold">
                  MAMAYYA
                </text>
              </g>

              {/* Spoon rising with chunk - GSAP target */}
              <g className="hero-spoon" opacity="0">
                <rect x="76" y="-40" width="7" height="95" rx="3.5" fill="#e6a62f" transform="rotate(14 80 40)" />
                <ellipse cx="70" cy="58" rx="16" ry="11" fill="#e6a62f" transform="rotate(14 70 58)" />
                <circle cx="70" cy="54" r="9" fill="#8a2015" />
                <circle cx="77" cy="58" r="5" fill="#a92a1d" />
              </g>

              {/* Glass body */}
              <path
                d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z"
                fill="#fffdf8"
                fillOpacity="0.9"
                stroke="#fff4e4"
                strokeWidth="3"
              />

              <g clipPath="url(#hero-jarclip)">
                <rect className="animate-oil" x="28" y="72" width="104" height="110" fill="url(#hero-oil)" />
                <ellipse cx="80" cy="74" rx="50" ry="5" fill="#c65b32" opacity="0.7" />
                <circle cx="58" cy="102" r="12" fill="#241713" opacity="0.35" />
                <circle cx="94" cy="122" r="14" fill="#241713" opacity="0.3" />
                <circle cx="68" cy="146" r="11" fill="#241713" opacity="0.32" />
                <circle cx="106" cy="152" r="9" fill="#241713" opacity="0.28" />
                <ellipse cx="82" cy="92" rx="9" ry="3" fill="#31533b" opacity="0.6" transform="rotate(-18 82 92)" />
                <ellipse cx="52" cy="128" rx="8" ry="3" fill="#31533b" opacity="0.55" transform="rotate(28 52 128)" />
                <rect x="40" y="62" width="8" height="104" rx="4" fill="#ffffff" opacity="0.3" />
              </g>

              <rect x="36" y="52" width="88" height="8" rx="4" fill="#fff4e4" opacity="0.25" />
            </svg>

            {/* Four flavour jars flying in */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3">
              {products.map((p, i) => (
                <div key={p.slug} className={`hero-flavour-${i} opacity-0 w-12 sm:w-16`}>
                  <JarIllustration color={p.color} label={`${p.name} jar`} />
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
