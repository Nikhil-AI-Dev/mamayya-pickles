"use client";

import JarIllustration from "@/components/JarIllustration";

// Route-level error boundary: a render error on one page (for example a cart
// saved by an older version of the site) shows this instead of a blank screen.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const clearCartAndRetry = () => {
    try {
      localStorage.removeItem("mamayya-cart-v1");
      sessionStorage.removeItem("mamayya-checkout-v1");
    } catch {
      // Storage unavailable: nothing to clear.
    }
    reset();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-24 text-center">
      <div className="w-24 mx-auto opacity-80">
        <JarIllustration color="#c65b32" fill={0.18} lidLifted label="Spilled pickle jar" />
      </div>
      <h1 className="mt-4 font-display font-extrabold text-2xl text-charcoal">
        Something went wrong on this page.
      </h1>
      <p className="mt-2 text-charcoal/70">
        Try again, or clear the saved cart on this device if the problem repeats.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-red text-cream px-7 py-3 font-bold hover:bg-red-deep transition-colors"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={clearCartAndRetry}
          className="rounded-full border-2 border-charcoal/30 px-7 py-3 font-bold text-charcoal hover:border-charcoal transition-colors"
        >
          Clear saved cart and retry
        </button>
      </div>
    </div>
  );
}
