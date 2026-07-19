"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/lib/cart";
import { formatINR, products } from "@/lib/products";
import JarIllustration from "../JarIllustration";
import SpiceMeter from "../SpiceMeter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Per-scene backdrop: each flavour owns its atmosphere. */
const SCENE_BG: Record<string, string> = {
  "chicken-pickle": "linear-gradient(160deg, #8a2015 0%, #5c150d 100%)",
  "mutton-pickle": "linear-gradient(160deg, #451018 0%, #241713 100%)",
  "fish-pickle": "linear-gradient(160deg, #1f5f63 0%, #123a3d 100%)",
  "shrimp-pickle": "linear-gradient(160deg, #c65b32 0%, #97361a 100%)",
};

export default function ProductStories() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { addProduct } = useCart();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".story-scene").forEach((scene) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: scene,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          });
          tl.from(scene.querySelectorAll(".story-ingredient"), {
            y: -60,
            x: (i) => (i % 2 ? 50 : -50),
            opacity: 0,
            rotation: (i) => (i % 2 ? 25 : -25),
            stagger: 0.08,
            duration: 0.7,
            ease: "power2.out",
          })
            .from(
              scene.querySelector(".story-jar"),
              { y: 60, opacity: 0, duration: 0.6, ease: "back.out(1.3)" },
              "<0.1"
            )
            .from(
              scene.querySelectorAll(".story-copy > *"),
              { y: 24, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" },
              "<0.15"
            );
        });
      });
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} id="stories">
      {products.map((p, idx) => (
        <section
          key={p.slug}
          className="story-scene relative min-h-[90vh] flex items-center text-cream overflow-hidden"
          style={{ background: SCENE_BG[p.slug] }}
        >
          {/* Fish gets a subtle wave line; others get spice dust */}
          {p.slug === "fish-pickle" ? (
            <svg
              aria-hidden
              className="absolute bottom-0 inset-x-0 w-full opacity-20"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              style={{ height: 90 }}
            >
              <path
                d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
                fill="#fff4e4"
              />
            </svg>
          ) : (
            <div aria-hidden className="absolute inset-0 opacity-[0.12]">
              {[...Array(10)].map((_, i) => (
                <span
                  key={i}
                  className="story-ingredient absolute rounded-full"
                  style={{
                    width: 4 + (i % 4) * 3,
                    height: 4 + (i % 4) * 3,
                    left: `${(i * 37) % 100}%`,
                    top: `${(i * 53) % 100}%`,
                    background: "#fff4e4",
                  }}
                />
              ))}
            </div>
          )}

          <div
            className={`relative mx-auto max-w-6xl px-4 md:px-6 py-20 grid md:grid-cols-2 gap-10 items-center ${
              idx % 2 ? "md:[direction:rtl]" : ""
            }`}
          >
            <div className="[direction:ltr] relative grid place-items-center">
              {p.slug === "chicken-pickle" ? (
                <div className="relative w-56 md:w-72 pb-8">
                  {/* Warm backlight */}
                  <div
                    aria-hidden
                    className="absolute inset-x-[-30%] top-[10%] bottom-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(230,166,47,0.28), rgba(230,166,47,0) 70%)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[130%] h-8 rounded-[50%] bg-black/35 blur-lg"
                  />
                  {/* eslint-disable @next/next/no-img-element */}
                  <img src="/ing-chicken.webp" alt="Fresh chicken pieces" width={470} height={341}
                       loading="lazy" decoding="async"
                       className="story-ingredient absolute bottom-10 -left-14 md:-left-20 w-32 md:w-44 z-0" />
                  <img src="/ing-chilli.webp" alt="Dried red chillies" width={416} height={416}
                       loading="lazy" decoding="async"
                       className="story-ingredient absolute bottom-12 -right-12 md:-right-16 w-28 md:w-40 rotate-[6deg] z-0" />
                  <div className="story-jar relative z-10 animate-float">
                    <img src="/jar-chicken.webp" alt="Mamayya Chicken Pickle jar" width={640} height={1153}
                         loading="lazy" decoding="async"
                         className="w-full h-auto drop-shadow-2xl" />
                  </div>
                  <img src="/ing-garlic.webp" alt="Garlic" width={394} height={322}
                       loading="lazy" decoding="async"
                       className="story-ingredient absolute -bottom-1 -left-7 md:-left-10 w-22 md:w-28 rotate-[-5deg] z-20 drop-shadow-lg" />
                  <img src="/ing-curry.webp" alt="Curry leaves" width={417} height={341}
                       loading="lazy" decoding="async"
                       className="story-ingredient absolute -bottom-2 -right-5 md:-right-8 w-22 md:w-28 rotate-[10deg] z-20 drop-shadow-lg" />
                  {/* eslint-enable @next/next/no-img-element */}
                </div>
              ) : (
                <>
                  {/* Floating ingredient chips */}
                  <span className="story-ingredient absolute -top-4 left-8 text-3xl" aria-hidden>🌶️</span>
                  <span className="story-ingredient absolute top-10 right-6 text-2xl" aria-hidden>🍃</span>
                  <span className="story-ingredient absolute bottom-8 left-4 text-2xl" aria-hidden>🧄</span>
                  <span className="story-ingredient absolute -bottom-2 right-12 text-3xl" aria-hidden>
                    {p.emoji}
                  </span>
                  <div className="story-jar relative w-44 md:w-56 animate-float">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={`${p.name} jar`} width={640} height={1180}
                         loading="lazy" decoding="async"
                         className="w-full h-auto drop-shadow-2xl" />
                    <div aria-hidden
                         className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-5 rounded-[50%] bg-black/35 blur-md" />
                  </div>
                </>
              )}
            </div>

            <div className="story-copy [direction:ltr]">
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-gold">
                {p.mood}
              </p>
              <h2 className="mt-3 font-display font-extrabold text-4xl md:text-5xl leading-tight">
                {p.tagline}
              </h2>
              <p className="mt-4 text-cream/80 max-w-md text-lg">{p.story}</p>
              <p className="mt-3 font-telugu text-gold/90">{p.teluguLine}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <SpiceMeter level={p.spiceLevel} label={p.spiceLabel} />
                <span>
                  <span className="text-cream/50">Texture:</span>{" "}
                  <strong>{p.texture}</strong>
                </span>
                <span>
                  <span className="text-cream/50">Best with:</span>{" "}
                  <strong>{p.pairings.join(", ")}</strong>
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => addProduct(p, 250)}
                  className="rounded-full bg-cream text-charcoal px-6 py-3 font-bold hover:bg-gold transition-colors"
                >
                  Add 250 g · {formatINR(p.weights[0].price)}
                </button>
                <Link
                  href={`/products/${p.slug}`}
                  className="rounded-full border-2 border-cream/50 px-6 py-3 font-bold hover:border-cream hover:bg-cream/10 transition-colors"
                >
                  View {p.shortName} →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
