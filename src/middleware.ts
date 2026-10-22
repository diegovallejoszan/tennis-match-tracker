import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { clearAuthCookies } from "@/lib/auth-cookies";

const authMiddleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLanding = req.nextUrl.pathname === "/";
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthRecover = req.nextUrl.pathname.startsWith("/auth/recover");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

  const isMetadataRoute =
    req.nextUrl.pathname === "/robots.txt" ||
    req.nextUrl.pathname === "/sitemap.xml" ||
    req.nextUrl.pathname === "/icon" ||
    req.nextUrl.pathname.startsWith("/apple-icon") ||
    req.nextUrl.pathname.startsWith("/opengraph-image");

  if (isApiAuth || isAuthRecover || isMetadataRoute) return;
  if (isLanding || isLoginPage) return;
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
}) as unknown as NextMiddleware;

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  try {
    return await authMiddleware(request, event);
  } catch {
    // Stale session after secret rotation: clear cookies and send user to login.
    // Avoid redirect loops if /auth/recover or /login also hit decrypt errors.
    if (
      request.nextUrl.pathname.startsWith("/auth/recover") ||
      request.nextUrl.pathname === "/login"
    ) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("recovered", "1");
    const response = NextResponse.redirect(url);
    clearAuthCookies(response);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon|apple-icon|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
