import Link from "next/link";

/**
 * Full-bleed brand frame: the jar on the spice table. Sits between the
 * journey (charcoal) and trust (cream) sections, fading into both.
 */
export default function TableScene() {
  return (
    <section className="relative h-[60vh] md:h-[75vh] overflow-hidden" aria-label="Mamayya's kitchen table">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/table-scene.webp"
        alt="Mamayya Pickles jar on a wooden table surrounded by brass pots, dried chillies, garlic and curry leaves"
        className="absolute inset-0 w-full h-full object-cover object-[65%_center]"
      />
      {/* Blend into the charcoal section above and the copy corner */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #241713 0%, rgba(36,23,19,0) 18%), linear-gradient(0deg, rgba(28,16,12,0.75) 0%, rgba(28,16,12,0) 45%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-6xl px-4 md:px-6 pb-10 md:pb-14">
          <p className="font-display font-extrabold text-2xl md:text-4xl text-cream max-w-xl leading-tight">
            One table in Rayalaseema. Every jar starts here.
          </p>
          <Link
            href="/our-story"
            className="mt-4 inline-block font-bold text-gold hover:text-cream transition-colors"
          >
            Read the story →
          </Link>
        </div>
      </div>
    </section>
  );
}
