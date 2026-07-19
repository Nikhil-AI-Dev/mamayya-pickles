import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Our Story | Mamayya Pickles",
  description:
    "How one uncle's jar of chicken pickle became Mamayya Pickles - small batches, gingelly oil, and no shortcuts, shipped across India.",
};

const PRINCIPLES = [
  {
    title: "Small batches only",
    body: "Every batch is cooked in one kitchen, in quantities one pair of hands can stir. When a batch sells out, you wait for the next one - we don't scale the pot.",
  },
  {
    title: "Gingelly oil, always",
    body: "Sesame oil is slower and costlier than refined oil, but it's what preserves the pieces naturally and carries the masala the way our family expects.",
  },
  {
    title: "Big pieces, no fillers",
    body: "You should hit meat in every spoon. No potato padding, no gravy tricks - the jar's weight is the pickle's weight.",
  },
];

export default function OurStoryPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="Our story"
        title="It started with one uncle's jar."
        teluguLine="Mamayya cheti ruchi. Ippudu mee intiki."
      />

      {/* The letter */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-16 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-start">
        <article className="relative rounded-2xl bg-cream-deep border border-charcoal/15 shadow-card p-7 md:p-10 leading-relaxed text-charcoal/90">
          <div className="space-y-4 text-[1.05rem]">
            <p>
              In our family, nobody called him by name. He was just Mamayya - uncle - and
              when you visited his house, you left with a jar. Chicken pickle, packed while
              you were still saying no-no-it&apos;s-too-much.
            </p>
            <p>
              His rule was simple: <strong>the piece matters more than the masala.</strong>{" "}
              Anyone can make oil taste spicy. The work is in the marination, the slow fry
              in gingelly oil, the patience to let a sealed jar sit until the spice has gone
              all the way in.
            </p>
            <p>
              Cousins carried his jars to hostels in Hyderabad, then to flats in Bangalore,
              then in checked luggage to places much further. The jars kept travelling and
              the requests kept coming back. At some point &quot;make extra for us&quot;
              became &quot;you should sell this&quot; - and here we are.
            </p>
            <p>
              We cook his recipes in small batches, after you order, exactly the way he
              refused to hurry them. If a jar reaches you and it doesn&apos;t taste like
              someone&apos;s uncle made it - tell us. That&apos;s the standard.
            </p>
          </div>
          <p className="mt-8 font-telugu text-xl text-red">- Mee Mamayya</p>
        </article>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="relative grid place-items-center rounded-3xl bg-charcoal py-10 shadow-jar overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mamayya Pickles stamp - Taste of Rayalaseema, with Mamayya's portrait"
              width={208}
              height={208}
              loading="lazy"
              decoding="async"
              className="w-52 h-52 rounded-full"
            />
            <p className="mt-5 text-cream/70 text-sm font-semibold">
              The man himself. Taste of Rayalaseema.
            </p>
          </div>
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl bg-white/70 border border-charcoal/10 p-5"
            >
              <h2 className="font-display font-extrabold text-charcoal">{p.title}</h2>
              <p className="mt-1.5 text-sm text-charcoal/70 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </aside>
      </section>

      {/* CTA */}
      <section className="bg-red text-cream">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl">
              Taste what the fuss is about.
            </h2>
            <p className="mt-2 text-cream/80 font-telugu">Okka jar order cheyandi. Ardham avutundi.</p>
          </div>
          <Link
            href="/shop"
            className="rounded-full bg-cream text-charcoal px-8 py-4 font-extrabold hover:bg-gold transition-colors shrink-0"
          >
            Shop the four jars
          </Link>
        </div>
      </section>
    </div>
  );
}
