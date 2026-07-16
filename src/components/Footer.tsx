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
          <p className="font-display font-extrabold text-2xl text-gold">
            Mamayya Pickles
          </p>
          <p className="mt-2 text-cream/70 text-sm max-w-sm">
            Big pieces. Bold spice. Proper non-veg pickle. Handmade in small
            batches and shipped across India.
          </p>
          <p className="mt-4 text-cream/60 text-xs font-telugu">
            Intlo chesina ruchi. India motham delivery.
          </p>
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
