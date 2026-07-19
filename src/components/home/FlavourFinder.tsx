"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { WeightGrams, formatINR, getProduct } from "@/lib/products";
import JarIllustration from "../JarIllustration";

const QUESTIONS = [
  {
    key: "food",
    prompt: "What are you eating?",
    options: ["Rice", "Roti", "Curd rice", "Dosa", "Straight from the jar"],
  },
  {
    key: "spice",
    prompt: "How spicy do you like it?",
    options: ["Medium", "Spicy", "Mamayya level"],
  },
  {
    key: "meat",
    prompt: "What meat do you prefer?",
    options: ["Chicken", "Mutton", "Fish", "Prawn"],
  },
] as const;

type AnswerKey = (typeof QUESTIONS)[number]["key"];

const MEAT_TO_SLUG: Record<string, string> = {
  Chicken: "chicken-pickle",
  Mutton: "mutton-pickle",
  Fish: "fish-pickle",
  Prawn: "shrimp-pickle",
};

function recommend(answers: Record<AnswerKey, string>) {
  const slug = MEAT_TO_SLUG[answers.meat] ?? "chicken-pickle";
  const product = getProduct(slug)!;
  // Daily-rice eaters and jar-grazers empty jars faster - size up.
  const heavyUse =
    answers.food === "Rice" ||
    answers.food === "Curd rice" ||
    answers.food === "Straight from the jar";
  const grams: WeightGrams = heavyUse ? 500 : 250;
  const weight = product.weights.find((w) => w.grams === grams)!;
  const spiceNote =
    answers.spice === "Mamayya level"
      ? product.spiceLevel === 3
        ? "Full heat. You two will get along."
        : "Warning: you might want two jars of this one."
      : answers.spice === "Medium" && product.spiceLevel === 3
        ? "Heads up - this one runs hot. Keep curd rice nearby."
        : "Solid match for your heat level.";
  return { product, weight, spiceNote };
}

export default function FlavourFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<AnswerKey, string>>>({});
  const { addProduct } = useCart();

  const done = step >= QUESTIONS.length;
  const result = done ? recommend(answers as Record<AnswerKey, string>) : null;

  const pick = (key: AnswerKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <section className="bg-leaf text-cream py-20 md:py-28" id="flavour-finder">
      <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gold">
          Three questions
        </p>
        <h2 className="mt-2 font-display font-extrabold text-3xl md:text-5xl">
          Find your Mamayya match
        </h2>

        <div className="mt-10 min-h-72">
          {!done ? (
            <div>
              {/* Progress */}
              <div className="flex justify-center gap-2 mb-8" aria-hidden>
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-10 rounded-full transition-colors ${
                      i < step ? "bg-gold" : i === step ? "bg-cream" : "bg-cream/25"
                    }`}
                  />
                ))}
              </div>

              <p className="font-display font-bold text-2xl md:text-3xl">
                {QUESTIONS[step].prompt}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {QUESTIONS[step].options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(QUESTIONS[step].key, opt)}
                    className="rounded-full border-2 border-cream/40 px-6 py-3 font-bold hover:bg-cream hover:text-leaf transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-6 text-sm text-cream/60 underline hover:text-cream"
                >
                  ← Back
                </button>
              )}
            </div>
          ) : (
            result && (
              <div className="rounded-3xl bg-cream text-charcoal p-8 md:p-10 shadow-jar">
                <p className="text-sm font-bold uppercase tracking-widest text-clay">
                  Your Mamayya match
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                  <JarIllustration
                    color={result.product.color}
                    className="w-24 shrink-0"
                    lidLifted
                    label={`${result.product.name} jar`}
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="font-display font-extrabold text-3xl">
                      {result.product.name}, {result.weight.label}
                    </h3>
                    <p className="mt-1 text-charcoal/70">{result.spiceNote}</p>
                    <p className="mt-2 font-display font-bold text-2xl">
                      {formatINR(result.weight.price)}
                      <span className="ml-2 text-sm font-sans font-normal text-charcoal/50">
                        {result.weight.servings}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => addProduct(result.product, result.weight.grams)}
                    className="rounded-full bg-red text-cream px-7 py-3 font-bold hover:bg-red-deep transition-colors"
                  >
                    Add to cart · {formatINR(result.weight.price)}
                  </button>
                  <Link
                    href={`/products/${result.product.slug}`}
                    className="rounded-full border-2 border-charcoal px-7 py-3 font-bold hover:bg-charcoal hover:text-cream transition-colors"
                  >
                    Read the story
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 text-sm text-charcoal/50 underline hover:text-charcoal"
                >
                  Start over
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
