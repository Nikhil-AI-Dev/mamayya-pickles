import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "Mamayya Pickles - Big pieces. Bold spice. Proper non-veg pickle.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const logo = readFileSync(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
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
          <div style={{ fontSize: 28, fontWeight: 700, color: "#e6a62f", letterSpacing: 5 }}>
            MAMAYYA PICKLES · TASTE OF RAYALASEEMA
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
            Big pieces. Bold spice.
          </div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#f9e9d2", opacity: 0.85 }}>
            Proper non-veg pickle, made fresh per order. Delivered across India.
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={340}
          height={340}
          style={{ borderRadius: "50%" }}
          alt=""
        />
      </div>
    ),
    size
  );
}
