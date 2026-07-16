import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import TrackLookup from "@/components/track/TrackLookup";

export const metadata: Metadata = {
  title: "Track Order | Mamayya Pickles",
  description:
    "Follow your pickle order through all six stages - confirmed, preparing, packed, shipped, out for delivery, delivered.",
};

export default function TrackPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="Track order"
        title="Where's my jar?"
        teluguLine="Konchem opika. Ruchi vasthundi."
        lede="Every order moves through six stages. Fresh preparation takes 2-3 days, shipping takes 4-6 - about a week door to door."
      />
      <TrackLookup />
    </div>
  );
}
