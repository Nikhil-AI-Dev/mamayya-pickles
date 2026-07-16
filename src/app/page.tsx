import Hero from "@/components/Hero";
import ProductStories from "@/components/home/ProductStories";
import FlavourFinder from "@/components/home/FlavourFinder";
import WeightVisualizer from "@/components/home/WeightVisualizer";
import MoodGrid from "@/components/home/MoodGrid";
import Journey from "@/components/home/Journey";
import TrustSection from "@/components/home/TrustSection";
import ReactionWall from "@/components/home/ReactionWall";
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
      <ReactionWall />
      <FinalCta />
    </>
  );
}
