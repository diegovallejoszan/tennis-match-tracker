import { ImageResponse } from "next/og";

import { BrandIconMarkup } from "@/components/brand/icon-markup";

export const alt = "PrepCourt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#F4F7F2",
        padding: "80px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div
          style={{ width: 120, height: 120, display: "flex", borderRadius: 28, overflow: "hidden" }}
        >
          <BrandIconMarkup size={120} />
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#1B4332" }}>
          PrepCourt
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 36,
          fontSize: 36,
          color: "#2D6A4F"
        }}
      >
        Match journal, form, and preparation
      </div>
    </div>,
    size
  );
}
