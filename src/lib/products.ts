export type WeightGrams = 250 | 500 | 1000 | 2000 | 5000;

export type WeightOption = {
  grams: WeightGrams;
  label: string;
  price: number;
  note: string;
  servings: string;
  packaging: string;
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  mood: string;
  tagline: string;
  teluguLine: string;
  story: string;
  /** 1 = Medium, 2 = Spicy, 3 = Mamayya level */
  spiceLevel: 1 | 2 | 3;
  spiceLabel: string;
  texture: string;
  flavour: string;
  heat: string;
  pairings: string[];
  color: string;
  colorSoft: string;
  emoji: string;
  /** Background-keyed product photo (WebP with alpha). */
  image: string;
  weights: WeightOption[];
  ingredients: string[];
  allergens: string[];
  nutrition: { label: string; value: string }[];
  storage: string;
  shelfLife: string;
};

const WEIGHT_META: Record<WeightGrams, Omit<WeightOption, "price" | "grams">> = {
  250: {
    label: "250 g",
    note: "Trying for the first time",
    servings: "Approx. 8-10 servings",
    packaging: "One sealed glass jar",
  },
  500: {
    label: "500 g",
    note: "Most popular",
    servings: "Approx. 16-20 servings",
    packaging: "One sealed glass jar",
  },
  1000: {
    label: "1 kg",
    note: "Family pack",
    servings: "Approx. 32-40 servings",
    packaging: "Two sealed 500 g jars",
  },
  2000: {
    label: "2 kg",
    note: "Monthly stock-up",
    servings: "Approx. 65-80 servings",
    packaging: "Four sealed 500 g jars",
  },
  5000: {
    label: "5 kg",
    note: "Events, gifting or bulk orders",
    servings: "Approx. 160-200 servings",
    packaging: "Ten sealed 500 g jars, boxed",
  },
};

function weights(prices: Record<WeightGrams, number>): WeightOption[] {
  return (Object.keys(prices) as unknown as WeightGrams[]).map((g) => {
    const grams = Number(g) as WeightGrams;
    return { grams, price: prices[grams], ...WEIGHT_META[grams] };
  });
}

const SPICE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Medium",
  2: "Spicy",
  3: "Mamayya level",
};

export const products: Product[] = [
  {
    slug: "chicken-pickle",
    name: "Chicken Pickle",
    shortName: "Chicken",
    mood: "Classic Craving",
    tagline: "The crowd favourite.",
    teluguLine: "Rice ekkuva cook chesukondi.",
    story:
      "Juicy chicken pieces coated in Mamayya's signature masala. Slow-fried in gingelly oil with red chilli, garlic and curry leaves until every piece carries the full weight of the spice.",
    spiceLevel: 2,
    spiceLabel: SPICE_LABELS[2],
    texture: "Chunky",
    flavour: "Rich and spicy",
    heat: "Hot",
    pairings: ["Rice", "Dosa", "Roti", "Bread"],
    color: "#a92a1d",
    colorSoft: "#f3ded9",
    emoji: "🍗",
    image: "/jar-chicken.webp",
    weights: weights({ 250: 349, 500: 649, 1000: 1249, 2000: 2399, 5000: 5799 }),
    ingredients: [
      "Chicken (boneless)",
      "Gingelly (sesame) oil",
      "Red chilli powder",
      "Garlic",
      "Ginger",
      "Curry leaves",
      "Mustard",
      "Fenugreek",
      "Turmeric",
      "Salt",
      "Lemon juice",
    ],
    allergens: ["Sesame (gingelly oil)", "Mustard"],
    nutrition: [
      { label: "Energy", value: "310 kcal / 100 g" },
      { label: "Protein", value: "18 g / 100 g" },
      { label: "Fat", value: "24 g / 100 g" },
      { label: "Carbohydrates", value: "6 g / 100 g" },
    ],
    storage:
      "Refrigerate after opening. Always use a clean, dry spoon. Keep the oil layer above the pieces.",
    shelfLife: "3 months refrigerated (unopened), 45 days after opening.",
  },
  {
    slug: "mutton-pickle",
    name: "Mutton Pickle",
    shortName: "Mutton",
    mood: "Full Power Meal",
    tagline: "Slow cooked. Deeply spiced. Seriously addictive.",
    teluguLine: "Ghee rice tho kalipithe... maata raadu.",
    story:
      "Tender mutton slow-cooked until it gives in, then folded into a dark, deep masala. This one is heavier, richer and disappears faster than you expect.",
    spiceLevel: 3,
    spiceLabel: SPICE_LABELS[3],
    texture: "Firm",
    flavour: "Deep and savoury",
    heat: "Hot",
    pairings: ["Ghee rice", "Pulao", "Paratha"],
    color: "#5c1220",
    colorSoft: "#ecdadd",
    emoji: "🥩",
    image: "/jar-mutton.webp",
    weights: weights({ 250: 449, 500: 849, 1000: 1649, 2000: 3199, 5000: 7799 }),
    ingredients: [
      "Mutton (boneless)",
      "Gingelly (sesame) oil",
      "Red chilli powder",
      "Garlic",
      "Ginger",
      "Curry leaves",
      "Mustard",
      "Fenugreek",
      "Garam masala",
      "Turmeric",
      "Salt",
      "Lemon juice",
    ],
    allergens: ["Sesame (gingelly oil)", "Mustard"],
    nutrition: [
      { label: "Energy", value: "345 kcal / 100 g" },
      { label: "Protein", value: "20 g / 100 g" },
      { label: "Fat", value: "27 g / 100 g" },
      { label: "Carbohydrates", value: "5 g / 100 g" },
    ],
    storage:
      "Refrigerate after opening. Always use a clean, dry spoon. Keep the oil layer above the pieces.",
    shelfLife: "3 months refrigerated (unopened), 45 days after opening.",
  },
  {
    slug: "fish-pickle",
    name: "Fish Pickle",
    shortName: "Fish",
    mood: "Coastal Kick",
    tagline: "Coastal flavour with a proper spicy kick.",
    teluguLine: "Curd rice ki perfect partner.",
    story:
      "Firm fish fried golden, then soaked in a tangy, chilli-forward masala with a coastal edge. Softer texture, sharper tang, medium-hot finish.",
    spiceLevel: 1,
    spiceLabel: SPICE_LABELS[1],
    texture: "Soft",
    flavour: "Tangy and coastal",
    heat: "Medium-hot",
    pairings: ["Curd rice", "Rasam rice"],
    color: "#1f5f63",
    colorSoft: "#dcebe9",
    emoji: "🐟",
    image: "/jar-fish.webp",
    weights: weights({ 250: 399, 500: 749, 1000: 1449, 2000: 2799, 5000: 6799 }),
    ingredients: [
      "Fish (boneless fillets)",
      "Gingelly (sesame) oil",
      "Red chilli powder",
      "Tamarind",
      "Garlic",
      "Ginger",
      "Curry leaves",
      "Mustard",
      "Fenugreek",
      "Turmeric",
      "Salt",
      "Vinegar",
    ],
    allergens: ["Fish", "Sesame (gingelly oil)", "Mustard"],
    nutrition: [
      { label: "Energy", value: "290 kcal / 100 g" },
      { label: "Protein", value: "19 g / 100 g" },
      { label: "Fat", value: "22 g / 100 g" },
      { label: "Carbohydrates", value: "4 g / 100 g" },
    ],
    storage:
      "Refrigerate after opening. Always use a clean, dry spoon. Keep the oil layer above the pieces.",
    shelfLife: "3 months refrigerated (unopened), 30 days after opening.",
  },
  {
    slug: "shrimp-pickle",
    name: "Prawn Pickle",
    shortName: "Prawn",
    mood: "Spicy Surprise",
    tagline: "Small pieces. Massive flavour.",
    teluguLine: "Okka spoon saripodhu. Guaranteed.",
    story:
      "Small prawns, big attitude. Every bite is dense with spice and aroma - the jar people finish first and reorder fastest.",
    spiceLevel: 3,
    spiceLabel: SPICE_LABELS[3],
    texture: "Small bites",
    flavour: "Intense and aromatic",
    heat: "Hot",
    pairings: ["Dal rice", "Dosa", "Idli", "Curd rice"],
    color: "#e8603c",
    colorSoft: "#fbe3da",
    emoji: "🦐",
    image: "/jar-shrimp.webp",
    weights: weights({ 250: 449, 500: 849, 1000: 1649, 2000: 3199, 5000: 7799 }),
    ingredients: [
      "Prawns (cleaned, deveined)",
      "Gingelly (sesame) oil",
      "Red chilli powder",
      "Garlic",
      "Ginger",
      "Curry leaves",
      "Mustard",
      "Fenugreek",
      "Turmeric",
      "Salt",
      "Lemon juice",
    ],
    allergens: ["Crustacean shellfish (prawn)", "Sesame (gingelly oil)", "Mustard"],
    nutrition: [
      { label: "Energy", value: "300 kcal / 100 g" },
      { label: "Protein", value: "21 g / 100 g" },
      { label: "Fat", value: "23 g / 100 g" },
      { label: "Carbohydrates", value: "4 g / 100 g" },
    ],
    storage:
      "Refrigerate after opening. Always use a clean, dry spoon. Keep the oil layer above the pieces.",
    shelfLife: "3 months refrigerated (unopened), 30 days after opening.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export type Box = {
  slug: string;
  name: string;
  description: string;
  contents: { productSlug: string; grams: WeightGrams; count: number }[];
  price: number;
  compareAt: number;
};

export const boxes: Box[] = [
  {
    slug: "tasting-box",
    name: "Mamayya Tasting Box",
    description: "All four flavours, 250 g each. The right way to start.",
    contents: [
      { productSlug: "chicken-pickle", grams: 250, count: 1 },
      { productSlug: "mutton-pickle", grams: 250, count: 1 },
      { productSlug: "fish-pickle", grams: 250, count: 1 },
      { productSlug: "shrimp-pickle", grams: 250, count: 1 },
    ],
    price: 1499,
    compareAt: 1646,
  },
  {
    slug: "family-box",
    name: "Family Box",
    description: "Chicken and mutton, 500 g each. For houses where pickle finishes fast.",
    contents: [
      { productSlug: "chicken-pickle", grams: 500, count: 1 },
      { productSlug: "mutton-pickle", grams: 500, count: 1 },
    ],
    price: 1399,
    compareAt: 1498,
  },
  {
    slug: "coastal-box",
    name: "Coastal Box",
    description: "Fish and prawn, 500 g each. For the seafood loyalists.",
    contents: [
      { productSlug: "fish-pickle", grams: 500, count: 1 },
      { productSlug: "shrimp-pickle", grams: 500, count: 1 },
    ],
    price: 1499,
    compareAt: 1598,
  },
  {
    slug: "full-mamayya-box",
    name: "Full Mamayya Box",
    description: "All four flavours, 500 g each. Maximum commitment.",
    contents: [
      { productSlug: "chicken-pickle", grams: 500, count: 1 },
      { productSlug: "mutton-pickle", grams: 500, count: 1 },
      { productSlug: "fish-pickle", grams: 500, count: 1 },
      { productSlug: "shrimp-pickle", grams: 500, count: 1 },
    ],
    price: 2799,
    compareAt: 3096,
  },
];

export function getBox(slug: string): Box | undefined {
  return boxes.find((b) => b.slug === slug);
}

export const FREE_SHIPPING_THRESHOLD = 1200;
export const SHIPPING_FEE = 99;
export const DELIVERY_NOTE =
  "Freshly prepared • Online payment only • Delivered in approximately 7 days";

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

/** Preparation 2-3 days + shipping 4-6 days from today. */
export function deliveryWindow(from = new Date()): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  const start = new Date(from);
  start.setDate(start.getDate() + 6);
  const end = new Date(from);
  end.setDate(end.getDate() + 9);
  return `${fmt(start)} - ${fmt(end)}`;
}
