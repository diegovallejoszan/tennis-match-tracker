import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { auth } from "@/lib/auth";
import { resolveLocale } from "@/lib/locale";
import { LOCALE_COOKIE, isAppLocale } from "@/lib/locale-cookie";
import { getUserLocale } from "@/lib/user-locale-db";

async function localeFromBrowser(): Promise<"en" | "es"> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;
  return resolveLocale(null, (await headers()).get("accept-language"));
}

export default getRequestConfig(async () => {
  let locale: "en" | "es" = "en";

  try {
    const session = await auth();
    if (session?.user?.id) {
      locale = await getUserLocale(session.user.id);
    } else {
      locale = await localeFromBrowser();
    }
  } catch {
    // Invalid session cookies (e.g. after AUTH_SECRET rotation) must not 500 the app.
    try {
      locale = await localeFromBrowser();
    } catch {
      locale = "en";
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
