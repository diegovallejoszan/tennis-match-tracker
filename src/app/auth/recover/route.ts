import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth-cookies";

/**
 * One-click recovery when a stale/invalid session cookie takes down the app
 * (e.g. after AUTH_SECRET rotation). Users hit this instead of clearing cookies manually.
 */
export function GET(request: Request) {
  const url = new URL("/login", request.url);
  url.searchParams.set("recovered", "1");
  const response = NextResponse.redirect(url);
  clearAuthCookies(response);
  return response;
}
