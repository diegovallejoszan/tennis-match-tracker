/**
 * Satori-safe app icon: forest tile, optic-yellow tennis ball and
 * edge-to-edge white seams. Mirrors src/app/icon.svg using explicit arcs
 * (no clipPath / gradients) so the Open Graph renderer stays predictable.
 */

type BrandIconMarkupProps = {
  size: number;
};

export function BrandIconMarkup({ size }: BrandIconMarkupProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "flex" }}>
      <rect width="64" height="64" rx="14" fill="#1B4332" />
      <circle cx="32" cy="32" r="23" fill="#D9EC45" />
      <path d="M32 9A23 23 0 0 1 9 32" fill="none" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M32 55A23 23 0 0 1 55 32" fill="none" stroke="#FFFFFF" strokeWidth="4" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#1B4332" strokeWidth="1.5" />
    </svg>
  );
}
