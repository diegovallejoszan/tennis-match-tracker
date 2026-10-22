/** Public origin for metadata. Railway injects RAILWAY_PUBLIC_DOMAIN; no custom domain required. */
export function getSiteUrl(): URL {
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (railwayDomain ? `https://${railwayDomain}` : "") ||
    "http://localhost:3000";

  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}
