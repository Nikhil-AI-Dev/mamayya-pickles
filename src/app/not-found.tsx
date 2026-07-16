import Link from "next/link";
import JarIllustration from "@/components/JarIllustration";

export default function NotFound() {
  return (
    <div className="bg-cream grain">
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-24 text-center">
        <div className="w-36 mx-auto opacity-70">
          <JarIllustration color="#c65b32" fill={0.15} lidLifted label="Nearly empty pickle jar" />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-red">
          404
        </p>
        <h1 className="mt-2 font-display font-extrabold text-4xl text-charcoal">
          This jar is empty.
        </h1>
        <p className="mt-3 text-charcoal/70">
          The page you&apos;re looking for doesn&apos;t exist - but the shelf is full.
        </p>
        <p className="mt-2 font-telugu text-clay">Ikkada emi ledhu. Shop lo antha undi.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-red text-cream px-7 py-3 font-bold hover:bg-red-deep transition-colors"
          >
            Go to the shop
          </Link>
          <Link
            href="/"
            className="rounded-full border-2 border-charcoal/20 px-7 py-3 font-bold text-charcoal hover:border-charcoal transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
