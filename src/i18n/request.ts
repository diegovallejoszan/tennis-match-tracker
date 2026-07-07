import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { auth } from "@/lib/auth";
import { resolveLocale } from "@/lib/locale";
import { LOCALE_COOKIE, isAppLocale } from "@/lib/locale-cookie";
import { getUserLocale } from "@/lib/user-locale-db";

export default getRequestConfig(async () => {
  const session = await auth();
  let locale = "en" as "en" | "es";

  if (session?.user?.id) {
    locale = (await getUserLocale(session.user.id)) as "en" | "es";
  } else {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isAppLocale(cookieLocale)) {
      locale = cookieLocale;
    } else {
      locale = resolveLocale(
        null,
        (await headers()).get("accept-language"),
      );
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
