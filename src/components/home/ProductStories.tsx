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
              {/* Floating ingredient chips */}
              <span className="story-ingredient absolute -top-4 left-8 text-3xl" aria-hidden>🌶️</span>
              <span className="story-ingredient absolute top-10 right-6 text-2xl" aria-hidden>🍃</span>
              <span className="story-ingredient absolute bottom-8 left-4 text-2xl" aria-hidden>🧄</span>
              <span className="story-ingredient absolute -bottom-2 right-12 text-3xl" aria-hidden>
                {p.emoji}
              </span>
              <div className="story-jar w-48 md:w-60 animate-float">
                <JarIllustration color={p.color} label={`${p.name} jar`} />
              </div>
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
