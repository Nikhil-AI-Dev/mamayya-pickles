import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "Mamayya Pickles - Big pieces. Bold spice. Proper non-veg pickle.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(160deg, #8a2015 0%, #241713 100%)",
          color: "#fff4e4",
          padding: 80,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#e6a62f", letterSpacing: 6 }}>
            MAMAYYA PICKLES
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
            Big pieces. Bold spice.
          </div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#f9e9d2", opacity: 0.85 }}>
            Proper non-veg pickle, made fresh per order. Delivered across India.
          </div>
        </div>
        <svg width="280" height="350" viewBox="0 0 160 200">
          <rect x="42" y="30" width="76" height="18" rx="6" fill="#3a2a24" />
          <rect x="52" y="24" width="56" height="10" rx="5" fill="#241713" />
          <path
            d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z"
            fill="#fffdf8"
            fillOpacity="0.92"
          />
          <rect x="32" y="72" width="96" height="102" rx="8" fill="#c65b32" />
          <circle cx="58" cy="102" r="12" fill="#241713" opacity="0.35" />
          <circle cx="94" cy="122" r="14" fill="#241713" opacity="0.3" />
          <circle cx="68" cy="146" r="11" fill="#241713" opacity="0.32" />
        </svg>
      </div>
    ),
    size
  );
}
