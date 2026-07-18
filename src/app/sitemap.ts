import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { products } from "@/lib/products";
import { policies } from "@/lib/policies";

const BASE = "https://mamayyapickles.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statics = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/build-a-box", priority: 0.8 },
    { path: "/our-story", priority: 0.6 },
    { path: "/faqs", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/track", priority: 0.4 },
  ];
  return [
    ...statics.map((s) => ({
      url: `${BASE}${s.path}`,
      lastModified: now,
      priority: s.priority,
    })),
    ...products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    ...policies.map((p) => ({
      url: `${BASE}/policies/${p.slug}`,
      lastModified: now,
      priority: 0.3,
    })),
  ];
}
