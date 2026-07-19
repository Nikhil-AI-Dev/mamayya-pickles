import type { Metadata } from "next";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Hero Lab | Mamayya Pickles",
  description: "Internal comparison board for home hero variants.",
  robots: { index: false, follow: false },
};

/* Static mocks of four hero directions. Final states shown (no animation). */

function Copy({ light = true }: { light?: boolean }) {
  return (
    <div className="max-w-xl">
      <h1
        className={`font-display font-extrabold text-4xl lg:text-6xl leading-[1.05] ${light ? "text-cream" : "text-charcoal"}`}
      >
        Not just pickle.
        <span className="block mt-2 text-gold font-telugu text-3xl lg:text-5xl">
          Idi full meal ki main character.
        </span>
      </h1>
      <p className={`mt-6 max-w-md text-lg ${light ? "text-cream/80" : "text-charcoal/70"}`}>
        Handmade non-veg pickles packed with bold spices and delivered across India.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <span className="rounded-full bg-red px-7 py-3.5 font-bold text-cream shadow-jar">
          Taste Mamayya&apos;s Pickles
        </span>
        <span className="rounded-full border-2 border-gold px-7 py-3.5 font-bold text-gold">
          Build Your Pickle Box
        </span>
      </div>
    </div>
  );
}

function Minis({ over = false }: { over?: boolean }) {
  return (
    <div className={`flex gap-4 ${over ? "justify-center" : ""}`}>
      {products.map((p) => (
        <div key={p.slug} className="w-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" width={640} height={1180} className="w-full h-auto drop-shadow-lg" />
          <p className="text-center text-[10px] font-bold text-cream/80 mt-1">{p.shortName}</p>
        </div>
      ))}
    </div>
  );
}

function Label({ id, name }: { id: string; name: string }) {
  return (
    <div className="absolute top-4 left-4 z-30 rounded-full bg-gold text-charcoal font-extrabold px-4 py-1.5 text-sm">
      {id} · {name}
    </div>
  );
}

export default function HeroLab() {
  return (
    <div>
      <div className="bg-charcoal text-cream text-center py-6 px-4">
        <p className="font-display font-extrabold text-2xl">Hero Lab - pick one: A, B, C or D</p>
        <p className="text-cream/60 text-sm mt-1">Internal page. Scroll through all four before deciding.</p>
      </div>

      {/* A - Full-bleed cinema */}
      <section className="relative min-h-svh overflow-hidden">
        <Label id="A" name="Full-bleed cinema" />
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/hero-jar.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[70%_center]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(28,16,12,0.93) 0%, rgba(28,16,12,0.7) 40%, rgba(28,16,12,0.1) 70%, rgba(28,16,12,0) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 min-h-svh flex flex-col justify-center py-24">
          <Copy />
          <div className="mt-10"><Minis /></div>
        </div>
      </section>

      {/* B - Hard split */}
      <section className="relative min-h-svh overflow-hidden bg-charcoal grid md:grid-cols-2">
        <Label id="B" name="Hard split" />
        <div className="flex items-center px-6 md:px-12 py-24">
          <div>
            <Copy />
            <div className="mt-10"><Minis /></div>
          </div>
        </div>
        <div className="relative min-h-[50vh] md:min-h-svh">
          <img src="/hero-jar.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[62%_center]" />
          <div
            className="absolute inset-y-0 left-0 w-24"
            style={{ background: "linear-gradient(90deg, #241713, rgba(36,23,19,0))" }}
          />
        </div>
      </section>

      {/* C - Original animated jar (final frame) */}
      <section className="relative min-h-svh overflow-hidden bg-charcoal grain">
        <Label id="C" name="Original animated jar" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 62%, rgba(169,42,29,0.5), rgba(36,23,19,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 min-h-svh grid md:grid-cols-2 items-center gap-8 py-24 text-cream">
          <Copy />
          <div className="grid place-items-center">
            <div className="relative w-64 lg:w-80">
              <svg viewBox="0 0 160 200" className="w-full drop-shadow-2xl" aria-hidden>
                <g transform="translate(0,-40) rotate(-8 80 40)">
                  <rect x="42" y="30" width="76" height="18" rx="6" fill="#3a2a24" />
                  <rect x="52" y="24" width="56" height="10" rx="5" fill="#241713" />
                </g>
                <path d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z" fill="#fffdf8" fillOpacity="0.9" stroke="#fff4e4" strokeWidth="3" />
                <rect x="32" y="72" width="96" height="102" rx="8" fill="#a92a1d" />
                <circle cx="58" cy="102" r="12" fill="#241713" opacity="0.35" />
                <circle cx="94" cy="122" r="14" fill="#241713" opacity="0.3" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2"><Minis over /></div>
            </div>
          </div>
        </div>
      </section>

      {/* D - Photo atmosphere behind animated scene */}
      <section className="relative min-h-svh overflow-hidden bg-charcoal">
        <Label id="D" name="Photo atmosphere + animated jar" />
        <img src="/hero-jar.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-35" />
        <div className="absolute inset-0 bg-[rgba(28,16,12,0.55)]" />
        <div className="relative mx-auto max-w-6xl px-6 min-h-svh grid md:grid-cols-2 items-center gap-8 py-24 text-cream">
          <Copy />
          <div className="grid place-items-center">
            <div className="relative w-64 lg:w-80">
              <svg viewBox="0 0 160 200" className="w-full drop-shadow-2xl" aria-hidden>
                <g transform="translate(0,-40) rotate(-8 80 40)">
                  <rect x="42" y="30" width="76" height="18" rx="6" fill="#3a2a24" />
                  <rect x="52" y="24" width="56" height="10" rx="5" fill="#241713" />
                </g>
                <path d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z" fill="#fffdf8" fillOpacity="0.9" stroke="#fff4e4" strokeWidth="3" />
                <rect x="32" y="72" width="96" height="102" rx="8" fill="#a92a1d" />
                <circle cx="58" cy="102" r="12" fill="#241713" opacity="0.35" />
                <circle cx="94" cy="122" r="14" fill="#241713" opacity="0.3" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2"><Minis over /></div>
            </div>
          </div>
        </div>
        {/* eslint-enable @next/next/no-img-element */}
      </section>

      <div className="bg-charcoal text-cream text-center py-10 px-4">
        <p className="font-bold">Reply with A, B, C or D (or a mix, e.g. &quot;B but with C&apos;s animation&quot;).</p>
      </div>
    </div>
  );
}
