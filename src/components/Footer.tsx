import Link from "next/link";
import { products } from "@/lib/products";

const POLICY_LINKS = [
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/policies/cancellation", label: "Cancellation & Replacement" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms & Conditions" },
  { href: "/policies/food-safety", label: "Food Safety & Licence" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream mt-0">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.webp"
              alt="Mamayya Pickles - Taste of Rayalaseema"
              width={104}
              height={104}
              loading="lazy"
              decoding="async"
              className="w-26 h-26 rounded-full"
            />
            <div>
              <p className="font-display font-extrabold text-2xl text-gold">
                Mamayya Pickles
              </p>
              <p className="text-cream/60 text-xs font-bold uppercase tracking-widest mt-1">
                Taste of Rayalaseema
              </p>
            </div>
          </div>
          <p className="mt-4 text-cream/70 text-sm max-w-sm">
            Big pieces. Bold spice. Proper non-veg pickle. Handmade in small
            batches and shipped across India.
          </p>
          <p className="mt-4 text-cream/60 text-xs font-telugu">
            Intlo chesina ruchi. India motham delivery.
          </p>
          <div className="mt-4 flex gap-3">
          <a
            href="https://www.instagram.com/mamayyapickle/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mamayya Pickles on Instagram"
            className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-cream/25 text-cream/80 hover:text-gold hover:border-gold transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a
            href="https://wa.me/919035843899"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mamayya Pickles on WhatsApp"
            className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-cream/25 text-cream/80 hover:text-gold hover:border-gold transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          </div>
          <div className="mt-6 rounded-lg border border-cream/20 px-4 py-3 text-xs text-cream/70 max-w-sm">
            <p className="font-bold text-cream">FSSAI Registration</p>
            <p className="mt-1">
              Lic. No. XXXXXXXXXXXXXX (placeholder - replace with the actual
              FSSAI licence/registration number before launch).
            </p>
          </div>
        </div>

        <div>
          <p className="font-bold text-sm uppercase tracking-wider text-cream/50">
            Pickles
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {products.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/products/${p.slug}`}
                  className="text-cream/80 hover:text-gold transition-colors"
                >
                  {p.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/build-a-box"
                className="text-cream/80 hover:text-gold transition-colors"
              >
                Build Your Pickle Box
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-sm uppercase tracking-wider text-cream/50">
            Help & Policies
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/track" className="text-cream/80 hover:text-gold transition-colors">
                Track Order
              </Link>
            </li>
            <li>
              <Link href="/faqs" className="text-cream/80 hover:text-gold transition-colors">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-cream/80 hover:text-gold transition-colors">
                Contact
              </Link>
            </li>
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream/80 hover:text-gold transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream/50">
          <p>
            © {new Date().getFullYear()} Mamayya Pickles. Prepaid online orders
            only - cash on delivery isn&apos;t available.
          </p>
          <p>Please allow approximately 7 days for preparation and delivery.</p>
        </div>
      </div>
    </footer>
  );
}
