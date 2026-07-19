"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/build-a-box", label: "Build a Box" },
  { href: "/our-story", label: "Our Story" },
  { href: "/track", label: "Track Order" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-charcoal/10">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-192.png"
            alt="Mamayya Pickles - Taste of Rayalaseema"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-2xl text-red leading-none">
              Mamayya
            </span>
            <span className="font-display font-semibold text-sm text-charcoal tracking-wide uppercase">
              Pickles
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-charcoal/80 hover:text-red transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={openCart}
          className="relative flex items-center gap-2 rounded-full bg-charcoal text-cream px-4 py-2 text-sm font-bold hover:bg-red transition-colors"
          aria-label={`Open cart, ${itemCount} items`}
        >
          <span aria-hidden>Cart</span>
          <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gold text-charcoal text-xs font-extrabold">
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}
