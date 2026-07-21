export type PolicySection = { heading: string; body: string[] };

export type Policy = {
  slug: string;
  title: string;
  intro: string;
  sections: PolicySection[];
};

export const policies: Policy[] = [
  {
    slug: "shipping",
    title: "Shipping Policy",
    intro:
      "Every jar is prepared fresh after you order, then shipped across India through courier partners. Here is exactly how that works.",
    sections: [
      {
        heading: "Timelines",
        body: [
          "Preparation takes 2-3 days because every batch is made after orders come in - nothing sits in a warehouse.",
          "Shipping takes 4-6 days depending on your pincode. In total, plan for approximately 7 days from order to doorstep.",
          "Your order confirmation shows an estimated arrival window before you pay.",
        ],
      },
      {
        heading: "Packaging",
        body: [
          "Jars are double-sealed, shrink-wrapped and cushioned inside a rigid carton.",
          "Orders of 1 kg and above ship as multiple sealed 500 g jars - smaller jars travel safer and stay fresher after opening.",
          "The gingelly oil layer on top naturally preserves the pieces during transit.",
        ],
      },
      {
        heading: "Coverage and charges",
        body: [
          "We ship to most serviceable pincodes across India.",
          "Shipping is ₹99 per order, free above ₹1,200.",
          "Once your order ships you receive the courier name and tracking (AWB) number by email.",
        ],
      },
    ],
  },
  {
    slug: "cancellation",
    title: "Cancellation & Replacement",
    intro:
      "Because every order is prepared fresh, cancellation windows are short - but damaged jars are always replaced.",
    sections: [
      {
        heading: "Cancelling an order",
        body: [
          "You can cancel within 12 hours of ordering, before preparation begins, for a full refund to the original payment method.",
          "Once a batch enters preparation we cannot cancel it - the jars are already being made for you.",
        ],
      },
      {
        heading: "Damaged or wrong items",
        body: [
          "If a jar arrives damaged, leaking or incorrect, send a photo of the jar and the packaging within 48 hours of delivery.",
          "We replace it free of charge - no return shipping, no forms, no argument.",
        ],
      },
      {
        heading: "Refund timelines",
        body: [
          "Approved refunds are processed within 5-7 business days to the original payment method.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    intro:
      "We collect only what an order needs, and we never sell it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Name, delivery address, phone number and email - used to prepare, ship and update you about your order.",
          "Payment is processed by our payment gateway; we never see or store your card or UPI credentials.",
        ],
      },
      {
        heading: "What we do with it",
        body: [
          "Order details go to our courier partner to deliver your parcel.",
          "We may email you about your order status. Marketing email is opt-in and every message has an unsubscribe link.",
          "We never sell or rent your personal information to anyone.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "Write to us any time to see, correct or delete the information we hold about you.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    intro:
      "The short, honest version of the rules that apply when you order from Mamayya Pickles.",
    sections: [
      {
        heading: "Orders and payment",
        body: [
          "All orders are prepaid - UPI, credit card, debit card or net banking. Cash on delivery is not available.",
          "Prices include the jar, packing and taxes. Shipping is shown separately at checkout.",
          "An order is confirmed only after successful payment.",
        ],
      },
      {
        heading: "Food product disclaimer",
        body: [
          "Our pickles are handmade food products. Minor variation in colour, oil level and spice intensity between batches is natural and not a defect.",
          "Check the allergen list on each product page before ordering. All varieties contain gingelly (sesame) oil and mustard.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Follow the storage instructions on the jar - refrigerate after opening, use a clean dry spoon, keep the oil layer above the pieces.",
          "We are not responsible for spoilage caused by storage outside these instructions after delivery.",
        ],
      },
      {
        heading: "Grievance officer",
        body: [
          "Per the Consumer Protection (E-Commerce) Rules, 2020, complaints and escalations go to our grievance officer:",
          "Subbarayudu Singanamalla · contact@mamayyapickles.com · +91 90358 43899",
          "Complaints are acknowledged within 48 hours and resolved within 30 days.",
        ],
      },
    ],
  },
  {
    slug: "food-safety",
    title: "Food Safety & Licence",
    intro:
      "Handmade does not mean casual. Every batch follows the same hygiene rules a licensed kitchen must.",
    sections: [
      {
        heading: "FSSAI registration",
        body: [
          "Mamayya Pickles operates under FSSAI Lic. No. XXXXXXXXXXXXXX (placeholder - the actual licence number appears here and on every jar label before launch).",
        ],
      },
      {
        heading: "Kitchen practice",
        body: [
          "Meat and seafood are sourced fresh per batch from inspected suppliers - never frozen stock.",
          "Jars are sterilised before filling, sealed hot and batch-coded with the preparation date.",
          "Every jar label carries ingredients, allergens, net weight, preparation date and use-by date.",
        ],
      },
      {
        heading: "Storage guidance",
        body: [
          "Unopened jars keep about 3 months refrigerated. After opening, 30-45 days depending on the variety.",
          "Always use a clean, dry spoon and keep the oil layer above the pieces.",
        ],
      },
    ],
  },
];

export function getPolicy(slug: string): Policy | undefined {
  return policies.find((p) => p.slug === slug);
}
