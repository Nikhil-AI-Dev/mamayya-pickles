import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Guest checkout - delivery details, order summary and prepaid payment.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="Checkout"
        title="Almost at your door."
        lede="Guest checkout - no account needed. Fresh preparation starts as soon as payment lands."
      />
      <CheckoutClient />
    </div>
  );
}
