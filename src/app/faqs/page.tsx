import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";
import PageHeader from "@/components/PageHeader";
import { faqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Delivery times, payment, shipping safety, shelf life, allergens and replacements - answered straight.",
};

export default function FaqsPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="FAQs"
        title="Asked often. Answered straight."
        teluguLine="Anumanam unte adagandi."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-16">
        <FaqAccordion items={faqs} />
        <p className="mt-8 text-sm text-charcoal/70">
          Didn&apos;t find your answer?{" "}
          <Link href="/contact" className="font-bold text-red hover:underline">
            Contact us
          </Link>{" "}
          - we reply within a few hours on working days.
        </p>
      </div>
    </div>
  );
}
