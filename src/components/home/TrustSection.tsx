"use client";

import {
  CookingPot,
  ShieldCheck,
  ClipboardText,
  SealCheck,
  CreditCard,
  Truck,
} from "@phosphor-icons/react";

const TRUST_CARDS = [
  {
    Icon: CookingPot,
    title: "Freshly prepared in controlled batches",
    detail:
      "Every order is cooked to order in small batches - nothing sits on a shelf waiting.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure, leak-resistant packaging",
    detail:
      "Double-sealed jars, shrink-wrapped lids and cushioned cartons built for courier handling.",
  },
  {
    Icon: ClipboardText,
    title: "Ingredients & allergens listed clearly",
    detail:
      "Full ingredient list on every product page and label. Fish and shellfish allergens flagged prominently.",
  },
  {
    Icon: SealCheck,
    title: "FSSAI registered",
    detail:
      "Licence number displayed in the footer, on product pages and on every label.",
  },
  {
    Icon: CreditCard,
    title: "Online payments only",
    detail:
      "Prepaid orders via UPI, cards and net banking. No cash on delivery - stated upfront, not at checkout.",
  },
  {
    Icon: Truck,
    title: "Order tracking available",
    detail:
      "Tracking number shared as soon as your jars leave the kitchen. Follow every step.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-cream grain py-20 md:py-28" id="trust">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display font-extrabold text-3xl md:text-5xl max-w-2xl">
          Why people trust Mamayya with non-veg
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-charcoal/10 bg-white/70 p-6 shadow-card"
            >
              <span
                className="inline-grid place-items-center w-12 h-12 rounded-xl"
                style={{ background: "rgba(169,42,29,0.08)" }}
                aria-hidden
              >
                <card.Icon size={26} weight="duotone" color="#a92a1d" />
              </span>
              <h3 className="mt-3 font-display font-bold text-lg leading-snug">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-charcoal/70">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
