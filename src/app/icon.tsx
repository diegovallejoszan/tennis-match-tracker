import { ImageResponse } from "next/og";

import { BrandIconMarkup } from "@/components/brand/icon-markup";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconMarkup size={32} showArc={false} />, size);
}
