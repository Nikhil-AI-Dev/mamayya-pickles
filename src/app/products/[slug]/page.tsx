import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JarIllustration from "@/components/JarIllustration";
import SpiceMeter from "@/components/SpiceMeter";
import ProductPurchase from "@/components/product/ProductPurchase";
import { getProduct, products } from "@/lib/products";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found | Mamayya Pickles" };
  return {
    title: `${product.name} | Mamayya Pickles`,
    description: `${product.tagline} ${product.story}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const others = products.filter((p) => p.slug !== product.slug);

  return (
    <div className="bg-cream">
      {/* Flavour scene */}
      <section
        className="text-cream"
        style={{
          background: `linear-gradient(160deg, ${product.color} 0%, #241713 130%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative grid place-items-center">
            <span className="absolute -top-2 left-8 text-3xl animate-float" aria-hidden>
              🌶️
            </span>
            <span className="absolute bottom-6 right-8 text-3xl" aria-hidden>
              {product.emoji}
            </span>
            <div className="w-52 md:w-64 animate-float">
              <JarIllustration color={product.color} label={`${product.name} jar`} />
            </div>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-gold">
              {product.mood}
            </p>
            <h1 className="mt-3 font-display font-extrabold text-4xl md:text-6xl leading-[1.05]">
              {product.name}
            </h1>
            <p className="mt-4 text-cream/85 text-lg max-w-md">{product.story}</p>
            <p className="mt-3 font-telugu text-gold/90">{product.teluguLine}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <SpiceMeter level={product.spiceLevel} label={product.spiceLabel} />
              <span>
                <span className="text-cream/50">Texture:</span>{" "}
                <strong>{product.texture}</strong>
              </span>
              <span>
                <span className="text-cream/50">Flavour:</span>{" "}
                <strong>{product.flavour}</strong>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.pairings.map((pair) => (
                <span
                  key={pair}
                  className="rounded-full border border-cream/30 px-3 py-1 text-xs font-bold"
                >
                  Eats well with {pair}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Purchase + back-of-jar label */}
      <section className="grain">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-14 grid gap-10 lg:grid-cols-[1fr_1.1fr] items-start">
          <ProductPurchase product={product} />

          {/* Signature: the back-of-the-jar label, reproduced honestly */}
          <article
            aria-labelledby="label-heading"
            className="rounded-2xl border-2 border-charcoal/70 bg-cream-deep p-6 md:p-8"
          >
            <h2
              id="label-heading"
              className="font-display font-extrabold text-2xl text-charcoal"
            >
              What&apos;s inside the jar
            </h2>

            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="font-extrabold uppercase tracking-wider text-xs text-charcoal/60">
                  Ingredients
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {product.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="rounded-full bg-white/70 border border-charcoal/10 px-3 py-1 text-xs font-semibold"
                    >
                      {ing}
                    </span>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="font-extrabold uppercase tracking-wider text-xs text-red">
                  Allergens
                </dt>
                <dd className="mt-1.5 font-bold text-charcoal">
                  {product.allergens.join(" · ")}
                </dd>
              </div>

              <div>
                <dt className="font-extrabold uppercase tracking-wider text-xs text-charcoal/60">
                  Nutrition (approx.)
                </dt>
                <dd className="mt-1.5">
                  <table className="w-full text-left">
                    <caption className="sr-only">
                      Nutrition values per 100 g of {product.name}
                    </caption>
                    <tbody className="divide-y divide-charcoal/10">
                      {product.nutrition.map((n) => (
                        <tr key={n.label}>
                          <th scope="row" className="py-1.5 font-semibold text-charcoal/80">
                            {n.label}
                          </th>
                          <td className="py-1.5 text-right font-bold">{n.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </dd>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <dt className="font-extrabold uppercase tracking-wider text-xs text-charcoal/60">
                    Storage
                  </dt>
                  <dd className="mt-1.5 text-charcoal/80 leading-relaxed">
                    {product.storage}
                  </dd>
                </div>
                <div>
                  <dt className="font-extrabold uppercase tracking-wider text-xs text-charcoal/60">
                    Shelf life
                  </dt>
                  <dd className="mt-1.5 text-charcoal/80 leading-relaxed">
                    {product.shelfLife}
                  </dd>
                </div>
              </div>
            </dl>
          </article>
        </div>
      </section>

      {/* Other flavours */}
      <section className="border-t border-charcoal/10">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-12">
          <h2 className="font-display font-extrabold text-2xl text-charcoal">
            The other three jars
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {others.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-charcoal/10 bg-white/70 p-4 hover:shadow-card transition-shadow"
              >
                <div className="w-14 shrink-0">
                  <JarIllustration color={p.color} label="" />
                </div>
                <span>
                  <span className="block font-display font-extrabold text-charcoal group-hover:text-red transition-colors">
                    {p.shortName}
                  </span>
                  <span className="block text-xs text-charcoal/60">{p.mood}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
