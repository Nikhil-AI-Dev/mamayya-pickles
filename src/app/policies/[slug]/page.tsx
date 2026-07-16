import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, policies } from "@/lib/policies";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return { title: "Not found | Mamayya Pickles" };
  return {
    title: `${policy.title} | Mamayya Pickles`,
    description: policy.intro,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  const others = policies.filter((p) => p.slug !== policy.slug);

  return (
    <div className="bg-cream grain">
      <div className="mx-auto max-w-3xl px-4 md:px-6 pt-14 md:pt-20 pb-16">
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-red">
          Policies
        </p>
        <h1 className="mt-3 font-display font-extrabold text-4xl md:text-5xl leading-[1.05] text-charcoal">
          {policy.title}
        </h1>
        <p className="mt-4 text-charcoal/70 text-lg leading-relaxed">{policy.intro}</p>

        <div className="mt-10 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display font-extrabold text-xl text-charcoal">
                {section.heading}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {section.body.map((line) => (
                  <li
                    key={line}
                    className="text-charcoal/80 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-2 before:h-2 before:rounded-full before:bg-gold"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <nav aria-label="Other policies" className="mt-12 border-t border-charcoal/10 pt-6">
          <p className="font-bold text-sm text-charcoal/60">Other policies</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/policies/${p.slug}`}
                  className="font-bold text-red hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
