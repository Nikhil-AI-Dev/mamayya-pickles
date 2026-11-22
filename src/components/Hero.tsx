"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DELIVERY_NOTE, products } from "@/lib/products";

gsap.registerPlugin(useGSAP);

// The two Tenglish lines the hero rotates between.
const TAGLINES = [
  { en: "Not just pickle.", te: "Idi full meal ki main character." },
  { en: "Mamayya jar open ayithe…", te: "meal simple ga undadu." },
];

const TRUST = [
  "FSSAI registered",
  "Cooked fresh after you order",
  "Delivered across India",
  "Secure online payment",
];

// Warm flecks drifting up over the dark side. Fixed values so SSR and client
// render the same markup (no hydration mismatch).
const FLECKS = [
  { left: 6, bottom: 12, size: 5, d: 11, delay: 0, x: 14, o: 0.5 },
  { left: 14, bottom: 4, size: 3, d: 9, delay: 2.4, x: -10, o: 0.4 },
  { left: 22, bottom: 20, size: 4, d: 13, delay: 1.2, x: 8, o: 0.35 },
  { left: 30, bottom: 8, size: 6, d: 10, delay: 3.1, x: 18, o: 0.45 },
  { left: 9, bottom: 28, size: 3, d: 12, delay: 4.2, x: -6, o: 0.3 },
  { left: 38, bottom: 16, size: 4, d: 14, delay: 0.8, x: 12, o: 0.4 },
  { left: 18, bottom: 2, size: 5, d: 8.5, delay: 5.0, x: -14, o: 0.45 },
  { left: 44, bottom: 24, size: 3, d: 11.5, delay: 2.0, x: 10, o: 0.3 },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const jarsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entrance: copy lines and jars ease up on load.
        gsap.from(".hero-rise", {
          y: 24,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
        gsap.from(".hero-jar", {
          y: 36,
          opacity: 0,
          rotate: -5,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.35,
          ease: "back.out(1.5)",
          clearProps: "transform,opacity",
        });

        // The headline crossfades between the two taglines. Both sit in the
        // same grid cell, so only opacity and a small rise move.
        const lines = gsap.utils.toArray<HTMLElement>(".hero-tag");
        if (lines.length > 1) {
          gsap.set(lines.slice(1), { opacity: 0, yPercent: 18 });
          const tl = gsap.timeline({ repeat: -1, delay: 3.4 });
          lines.forEach((_, i) => {
            const curr = lines[i];
            const next = lines[(i + 1) % lines.length];
            tl.to(curr, { opacity: 0, yPercent: -18, duration: 0.6, ease: "power2.in" })
              // immediateRender off: otherwise the last iteration pre-hides
              // line 0 at build time and the headline loads blank.
              .fromTo(
                next,
                { opacity: 0, yPercent: 18 },
                { opacity: 1, yPercent: 0, duration: 0.7, ease: "power3.out", immediateRender: false },
                "<"
              )
              .to({}, { duration: 3.4 });
          });
        }
      });

      // Desktop pointer parallax: the jar row leans toward the cursor.
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const section = sectionRef.current;
        const jars = jarsRef.current;
        if (!section || !jars) return;
        const xTo = gsap.quickTo(jars, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(jars, "y", { duration: 0.6, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const r = section.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          xTo(dx * 26);
          yTo(dy * 14);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        section.addEventListener("pointermove", onMove);
        section.addEventListener("pointerleave", onLeave);
        return () => {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-dvh overflow-hidden bg-charcoal text-cream grain"
    >
      {/* Photographed jar on the spice table; copy space left. It breathes. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-jar.webp"
          alt=""
          fetchPriority="high"
          className="ken-burns absolute inset-0 w-full h-full object-cover object-[70%_center]"
        />
      </div>
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
        style={{ background: "linear-gradient(0deg, rgba(28,16,12,0.85), rgba(28,16,12,0))" }}
      />

      {/* Spice flecks */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {FLECKS.map((f, i) => (
          <span
            key={i}
            className="spice-fleck absolute rounded-full"
            style={
              {
                left: `${f.left}%`,
                bottom: `${f.bottom}%`,
                width: f.size,
                height: f.size,
                background: i % 2 === 0 ? "#e6a62f" : "#c65b32",
                "--d": `${f.d}s`,
                "--delay": `${f.delay}s`,
                "--x": `${f.x}px`,
                "--o": `${f.o}`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6 min-h-dvh flex items-center py-24">
        <div className="relative z-10 max-w-xl">
          {/* Rotating headline. Both lines are in the DOM for screen readers;
              sight sees them crossfade. */}
          <div className="hero-rise relative grid min-h-[132px] sm:min-h-[150px] lg:min-h-[180px]">
            {TAGLINES.map((t, i) => (
              <h1
                key={i}
                className={`hero-tag col-start-1 row-start-1 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] ${
                  i > 0 ? "opacity-0" : ""
                }`}
                aria-hidden={i > 0 ? true : undefined}
              >
                {t.en}
                <span className="block mt-2 text-gold font-telugu text-3xl sm:text-4xl lg:text-5xl">
                  {t.te}
                </span>
              </h1>
            ))}
          </div>

          <p className="hero-rise mt-6 text-cream/80 max-w-md text-base sm:text-lg">
            Handmade non-veg pickles packed with bold spices and delivered across India.
          </p>

          <div className="hero-rise mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="tap rounded-full bg-red px-7 py-3.5 font-bold text-cream hover:bg-red-deep shadow-jar"
            >
              Taste Mamayya&apos;s Pickles
            </Link>
            <Link
              href="/build-a-box"
              className="tap rounded-full border-2 border-gold px-7 py-3.5 font-bold text-gold hover:bg-gold hover:text-charcoal"
            >
              Build Your Pickle Box
            </Link>
          </div>

          {/* Trust microline: reassure before they scroll */}
          <ul className="hero-rise mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-cream/75">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-gold" />
                {t}
              </li>
            ))}
          </ul>

          <p className="hero-rise mt-5 text-xs sm:text-sm text-cream/60">{DELIVERY_NOTE}</p>

          {/* The four jars: each links to its pickle, and the row leans toward
              the cursor on desktop. Fastest path from the hero to a product. */}
          <div ref={jarsRef} className="mt-9 flex gap-4 sm:gap-6">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="hero-jar group w-16 sm:w-20"
                aria-label={`${p.name} - view and order`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={`${p.name} jar`}
                  width={640}
                  height={1180}
                  className="w-full h-auto drop-shadow-lg transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-3deg]"
                />
                <p className="text-center text-[10px] sm:text-xs font-bold text-cream/80 mt-1.5 group-hover:text-gold transition-colors">
                  {p.shortName}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <Link
        href="#stories"
        aria-label="See the four pickles"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1 text-cream/60 hover:text-gold transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Meet the four</span>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" className="animate-bob" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </Link>
    </section>
  );
}
