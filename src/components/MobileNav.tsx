"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/shop", label: "Shop", icon: "🫙" },
  { href: "/build-a-box", label: "Build Box", icon: "📦" },
  { href: "/track", label: "Track", icon: "🚚" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-charcoal text-cream border-t border-cream/10 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile"
    >
      <div className="grid grid-cols-5 h-16">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                active ? "text-gold" : "text-cream/70"
              }`}
            >
              <span aria-hidden className="text-lg leading-none">
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-cream/70"
          aria-label={`Open cart, ${itemCount} items`}
        >
          <span aria-hidden className="text-lg leading-none">🛒</span>
          Cart
          {itemCount > 0 && (
            <span className="absolute top-1.5 right-1/2 translate-x-4 grid place-items-center min-w-4 h-4 px-0.5 rounded-full bg-red text-cream text-[10px] font-extrabold">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
