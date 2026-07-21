import Hero from "@/components/Hero";
import ProductStories from "@/components/home/ProductStories";
import FlavourFinder from "@/components/home/FlavourFinder";
import WeightVisualizer from "@/components/home/WeightVisualizer";
import MoodGrid from "@/components/home/MoodGrid";
import Journey from "@/components/home/Journey";
import TrustSection from "@/components/home/TrustSection";
// import ReactionWall from "@/components/home/ReactionWall"; // re-enable with real reviews
import FinalCta from "@/components/home/FinalCta";

export default function Home() {
  return (
    <>
      <Hero />
      <ProductStories />
      <FlavourFinder />
      <WeightVisualizer />
      <MoodGrid />
      <Journey />
      <TrustSection />
      {/* ReactionWall hidden until real customer reviews exist - the sample
          quotes must not show to real customers. Re-enable by restoring the
          line below once genuine quotes replace REACTIONS in ReactionWall.tsx. */}
      {/* <ReactionWall /> */}
      <FinalCta />
    </>
  );
}
