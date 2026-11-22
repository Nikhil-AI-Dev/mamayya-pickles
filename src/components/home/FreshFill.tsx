"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import JarIllustration from "@/components/JarIllustration";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  { t: "You order", d: "Nothing is sitting on a shelf. The jar is empty until you place it." },
  { t: "Mamayya cooks", d: "Big pieces, bold spice, slow-cooked in small batches - 2 to 3 days in the kadai." },
  { t: "Sealed & sent", d: "Filled to the brim, double-sealed, cushioned, and couriered across India." },
];

/** Signature scroll moment: the jar fills with pickle as you scroll, while the
 *  three steps light up in turn. Reduced motion shows a full jar, all steps on. */
export default function FreshFill() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".jar-contents", { scaleY: 0, transformOrigin: "50% 100%" });
        gsap.set(".fill-step", { opacity: 0.35 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: "top 70%",
            end: "bottom 80%",
            scrub: 0.7,
          },
        });
        tl.to(".jar-contents", { scaleY: 1, ease: "none" }, 0);
        STEPS.forEach((_, i) => {
          tl.to(`.fill-step-${i}`, { opacity: 1, duration: 0.2 }, i / STEPS.length);
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".jar-contents", { scaleY: 1 });
        gsap.set(".fill-step", { opacity: 1 });
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="bg-charcoal text-cream grain overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-center">
        {/* The filling jar */}
        <div className="relative mx-auto w-52 md:w-64">
          <div
            aria-hidden
            className="absolute inset-x-[-25%] top-[8%] bottom-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 60%, rgba(230,166,47,0.28), rgba(230,166,47,0) 70%)",
            }}
          />
          <JarIllustration
            color="#a92a1d"
            fill={1}
            className="relative w-full h-auto drop-shadow-2xl"
            label="A jar of Mamayya pickle filling up"
          />
        </div>

        {/* The three steps */}
        <div>
          <p className="font-telugu text-gold text-lg">Order chesaka, kadai meedha pani start.</p>
          <h2 className="mt-2 font-display font-extrabold text-3xl md:text-5xl leading-[1.05]">
            Cooked fresh after you order
          </h2>
          <p className="mt-4 text-cream/75 max-w-md">
            Watch the jar fill. That is the whole idea - no stock sitting around, every
            jar made for the order it belongs to.
          </p>

          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.t} className={`fill-step fill-step-${i} flex gap-4`}>
                <span className="mt-0.5 grid place-items-center w-8 h-8 shrink-0 rounded-full bg-gold text-charcoal font-display font-extrabold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display font-extrabold text-lg">{s.t}</h3>
                  <p className="mt-1 text-sm text-cream/70 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/shop"
            className="tap mt-9 inline-block rounded-full bg-red px-8 py-3.5 font-bold text-cream hover:bg-red-deep shadow-jar"
          >
            Start a fresh jar
          </Link>
        </div>
      </div>
    </section>
  );
}
