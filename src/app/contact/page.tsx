import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Mamayya Pickles on WhatsApp or email for order help, bulk and gifting enquiries, or anything about your jar.",
};

const CHANNELS = [
  {
    title: "WhatsApp",
    detail: "Fastest for order issues. Send your order number and we reply within a few hours, 10am-7pm IST.",
    action: "Message on WhatsApp",
    href: "https://wa.me/919741982425",
    external: true,
  },
  {
    title: "Email",
    detail: "Best for bulk orders, gifting, replacements with photos, or anything longer than a text.",
    action: "contact@mamayyapickles.com",
    href: "mailto:contact@mamayyapickles.com",
    external: false,
  },
  {
    title: "Instagram",
    detail: "Kitchen photos, new batch announcements and behind-the-jar stories. DMs open.",
    action: "@mamayyapickle",
    href: "https://www.instagram.com/mamayyapickle/",
    external: true,
  },
];

const QUICK_HELP = [
  { label: "Where is my order?", href: "/track" },
  { label: "Delivery and payment questions", href: "/faqs" },
  { label: "Damaged jar? Replacement policy", href: "/policies/cancellation" },
];

export default function ContactPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="Contact"
        title="Talk to a human, not a bot."
        teluguLine="Cheppandi, vintam."
        lede="One kitchen, one small team. Include your order number and we can help faster."
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.9fr]">
        {CHANNELS.map((c) => (
          <article
            key={c.title}
            className="rounded-3xl bg-white/80 border border-charcoal/10 shadow-card p-6 flex flex-col"
          >
            <h2 className="font-display font-extrabold text-2xl text-charcoal">{c.title}</h2>
            <p className="mt-2 text-sm text-charcoal/70 leading-relaxed flex-1">{c.detail}</p>
            <a
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="mt-5 inline-block rounded-full bg-red text-cream text-center px-6 py-3 font-bold hover:bg-red-deep transition-colors"
            >
              {c.action}
            </a>
          </article>
        ))}

        <aside className="rounded-3xl bg-charcoal text-cream p-6">
          <h2 className="font-display font-extrabold text-xl text-gold">Quick answers</h2>
          <ul className="mt-4 space-y-3">
            {QUICK_HELP.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="text-sm font-bold text-cream/85 hover:text-gold transition-colors"
                >
                  {q.label} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
