import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ShopGrid from "@/components/shop/ShopGrid";
import { DELIVERY_NOTE } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Chicken, mutton, fish and prawn pickle in 250 g to 5 kg jars, plus ready-made boxes. Freshly prepared, shipped across India.",
};

export default function ShopPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="The shelf"
        title="Four jars. Nothing else on the shelf."
        teluguLine="Anni ruchulu. Okka chota."
        lede="Every jar is made after you order it - pick a flavour, pick a size, and we start cooking."
      />
      <p className="mx-auto max-w-6xl px-4 md:px-6 -mt-4 pb-8">
        <span className="inline-block rounded-full bg-charcoal text-cream text-xs font-bold px-4 py-2">
          {DELIVERY_NOTE}
        </span>
      </p>
      <ShopGrid />
    </div>
  );
}
