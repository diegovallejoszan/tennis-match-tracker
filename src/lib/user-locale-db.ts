import { eq } from "drizzle-orm";

import { db, userPreferences } from "@/db";
import type { AppLocale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";

export async function getUserLocale(userId: string): Promise<AppLocale> {
  const [row] = await db
    .select({ locale: userPreferences.locale })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return resolveLocale(row?.locale ?? null);
}

export async function ensureUserLocale(
  userId: string,
  acceptLanguage?: string | null,
): Promise<void> {
  const [existing] = await db
    .select({ userId: userPreferences.userId })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing) return;

  await db.insert(userPreferences).values({
    userId,
    locale: resolveLocale(null, acceptLanguage),
  });
}
