import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import BoxBuilder from "@/components/box/BoxBuilder";

export const metadata: Metadata = {
  title: "Build a Box | Mamayya Pickles",
  description:
    "Mix chicken, mutton, fish and prawn pickle jars into your own box. Watch the carton fill as you pick.",
};

export default function BuildABoxPage() {
  return (
    <div className="bg-cream grain">
      <PageHeader
        eyebrow="Build a box"
        title="Pack your own carton."
        teluguLine="Mee ishtam. Mee box."
        lede="Pick 250 g and 500 g jars in any mix. The carton on the right fills up as you go."
      />
      <BoxBuilder />
    </div>
  );
}
