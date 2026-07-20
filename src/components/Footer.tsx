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
          <a
            href="https://www.instagram.com/mamayyapickle/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mamayya Pickles on Instagram"
            className="mt-4 inline-flex w-10 h-10 items-center justify-center rounded-full border border-cream/25 text-cream/80 hover:text-gold hover:border-gold transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
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
