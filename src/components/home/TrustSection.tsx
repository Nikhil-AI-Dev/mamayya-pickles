const TRUST_CARDS = [
  {
    icon: "🍳",
    title: "Freshly prepared in controlled batches",
    detail:
      "Every order is cooked to order in small batches - nothing sits on a shelf waiting.",
  },
  {
    icon: "🫙",
    title: "Secure, leak-resistant packaging",
    detail:
      "Double-sealed jars, shrink-wrapped lids and cushioned cartons built for courier handling.",
  },
  {
    icon: "📋",
    title: "Ingredients & allergens listed clearly",
    detail:
      "Full ingredient list on every product page and label. Fish and shellfish allergens flagged prominently.",
  },
  {
    icon: "✅",
    title: "FSSAI registered",
    detail:
      "Licence number displayed in the footer, on product pages and on every label.",
  },
  {
    icon: "💳",
    title: "Online payments only",
    detail:
      "Prepaid orders via UPI, cards and net banking. No cash on delivery - stated upfront, not at checkout.",
  },
  {
    icon: "🚚",
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
              <span className="text-3xl" aria-hidden>
                {card.icon}
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
