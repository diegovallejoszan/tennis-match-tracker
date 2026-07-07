"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { db, userPreferences } from "@/db";
import { SUPPORTED_LOCALES } from "@/db/schema/user-preferences";
import { auth } from "@/lib/auth";
import { LOCALE_COOKIE } from "@/lib/locale-cookie";

const localeSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
});

export type PreferenceActionResult =
  | { ok: true }
  | { error: string };

export async function updateLocaleAction(
  input: unknown,
): Promise<PreferenceActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "You must be signed in." };

  const parsed = localeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid language selection." };

  await db
    .insert(userPreferences)
    .values({ userId, locale: parsed.data.locale })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { locale: parsed.data.locale },
    });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  return { ok: true };
}
