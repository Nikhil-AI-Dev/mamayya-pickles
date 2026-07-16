import { Faq } from "@/lib/faqs";

export default function FaqAccordion({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-white/70 shadow-card">
      {items.map((faq) => (
        <details key={faq.q} className="group px-6 py-4">
          <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold list-none [&::-webkit-details-marker]:hidden">
            {faq.q}
            <span
              aria-hidden
              className="shrink-0 text-red transition-transform duration-300 group-open:rotate-45 text-xl leading-none"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
