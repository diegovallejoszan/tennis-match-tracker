import { eq } from "drizzle-orm";

import { db, userPreferences } from "@/db";
import type { AppLocale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";

/**
 * Loads the user's preferred locale. On DB errors, falls back to English so a
 * transient DB/credential issue cannot take down every page for signed-in users.
 */
export async function getUserLocale(userId: string): Promise<AppLocale> {
  try {
    const [row] = await db
      .select({ locale: userPreferences.locale })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return resolveLocale(row?.locale ?? null);
  } catch {
    return resolveLocale(null);
  }
}

export async function ensureUserLocale(
  userId: string,
  acceptLanguage?: string | null,
): Promise<void> {
  try {
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
  } catch {
    // Sign-in should still succeed if preferences cannot be written yet.
  }
}
