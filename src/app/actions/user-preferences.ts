"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db, userPreferences } from "@/db";
import { SUPPORTED_LOCALES } from "@/db/schema/user-preferences";
import { auth } from "@/lib/auth";

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

  revalidatePath("/account");
  revalidatePath("/matches");
  return { ok: true };
}
