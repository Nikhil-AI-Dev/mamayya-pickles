import type { Product } from "@/lib/products";

type JarSceneProps = {
  product: Pick<Product, "slug" | "name" | "image">;
  /** Adds the GSAP story classes + lazy loading for the home scroll scenes. */
  story?: boolean;
  /** Wider sizing for the product page hero. */
  wide?: boolean;
};

/**
 * Grounded still-life: the real jar with recipe ingredients seated around
 * its base. Chilli, garlic and curry leaves are in every recipe; each
 * flavour's photographed meat plate sits back-left.
 */
export default function JarScene({ product, story = false, wide = false }: JarSceneProps) {
  const ing = story ? "story-ingredient " : "";
  const lazy = story ? { loading: "lazy" as const, decoding: "async" as const } : {};
  const MEAT_PLATES: Record<string, { src: string; alt: string }> = {
    "chicken-pickle": { src: "/ing-chicken.webp", alt: "Fresh chicken pieces" },
    "mutton-pickle": { src: "/ing-mutton.webp", alt: "Fresh mutton pieces" },
    "fish-pickle": { src: "/ing-fish.webp", alt: "Fresh fish pieces" },
    "shrimp-pickle": { src: "/ing-prawn.webp", alt: "Fresh prawns" },
  };
  const plate = MEAT_PLATES[product.slug];

  return (
    <div className={`relative ${wide ? "w-64 md:w-80" : "w-56 md:w-72"} pb-8`}>
      {/* Warm backlight */}
      <div
        aria-hidden
        className="absolute inset-x-[-30%] top-[10%] bottom-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(230,166,47,0.28), rgba(230,166,47,0) 70%)",
        }}
      />
      {/* One shared table shadow under the whole arrangement */}
      <div
        aria-hidden
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[130%] h-8 rounded-[50%] bg-black/35 blur-lg"
      />
      {/* eslint-disable @next/next/no-img-element */}
      {/* Back row */}
      {plate ? (
        <img src={plate.src} alt={plate.alt} width={470} height={341}
             {...lazy}
             className={`${ing}absolute bottom-10 -left-12 md:-left-20 w-32 md:w-44 z-0`} />
      ) : (
        <img src="/ing-garlic.webp" alt="Garlic" width={394} height={322}
             {...lazy}
             className={`${ing}absolute bottom-10 -left-10 md:-left-16 w-24 md:w-32 rotate-[-5deg] z-0`} />
      )}
      <img src="/ing-chilli.webp" alt="Dried red chillies" width={416} height={416}
           {...lazy}
           className={`${ing}absolute bottom-12 -right-12 md:-right-16 w-28 md:w-40 rotate-[6deg] z-0`} />
      {/* The jar owns the frame */}
      <div className={`${story ? "story-jar " : ""}relative z-10 animate-float`}>
        <img src={product.image} alt={`${product.name} jar`} width={640} height={1180}
             {...lazy}
             className="w-full h-auto drop-shadow-2xl" />
      </div>
      {/* Front row, leaning against the jar's base */}
      {plate && (
        <img src="/ing-garlic.webp" alt="Garlic" width={394} height={322}
             {...lazy}
             className={`${ing}absolute -bottom-1 -left-7 md:-left-10 w-22 md:w-28 rotate-[-5deg] z-20 drop-shadow-lg`} />
      )}
      <img src="/ing-curry.webp" alt="Curry leaves" width={417} height={341}
           {...lazy}
           className={`${ing}absolute -bottom-2 -right-5 md:-right-8 w-22 md:w-28 rotate-[10deg] z-20 drop-shadow-lg`} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
