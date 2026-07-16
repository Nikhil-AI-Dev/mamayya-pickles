"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  { icon: "🍳", title: "Prepared fresh", detail: "Cooked in small controlled batches, 2-3 days" },
  { icon: "🌡️", title: "Cooled & packed", detail: "Rested so the oil settles over every piece" },
  { icon: "🫙", title: "Leak-proof sealed", detail: "Double-sealed jars, bubble-wrapped" },
  { icon: "📦", title: "Courier pickup", detail: "Tracked shipment, AWB shared with you" },
  { icon: "🏠", title: "Delivered across India", detail: "4-6 days in transit" },
];

export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".journey-step", {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
          x: 60,
          opacity: 0,
          stagger: 0.12,
          duration: 0.6,
          ease: "power2.out",
        });
        gsap.from(".journey-line", {
          scrollTrigger: {
            trigger: ref.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.2,
          ease: "power2.inOut",
        });
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="bg-charcoal text-cream py-20 md:py-28" id="journey">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-sm font-bold uppercase tracking-widest text-gold">
          Good pickle takes a little time
        </p>
        <h2 className="mt-2 font-display font-extrabold text-3xl md:text-5xl">
          From Mamayya&apos;s kitchen to your table
        </h2>

        <div className="relative mt-14">
          <div className="journey-line hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gold/40" aria-hidden />
          <ol className="grid gap-8 md:grid-cols-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="journey-step relative">
                <div className="relative z-10 w-16 h-16 rounded-full bg-cream text-3xl grid place-items-center shadow-jar">
                  <span aria-hidden>{step.icon}</span>
                </div>
                <p className="mt-4 font-display font-bold text-lg">
                  <span className="text-gold mr-1.5">{i + 1}.</span>
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-cream/70">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 rounded-2xl border border-gold/40 bg-gold/10 px-6 py-5 text-center">
          <p className="font-bold text-gold">
            Please allow at least 7 days for preparation and delivery.
          </p>
          <p className="mt-1 text-sm text-cream/70">
            We prepare, pack and dispatch every order carefully. Fresh batches
            beat fast batches.
          </p>
        </div>
      </div>
    </section>
  );
}
