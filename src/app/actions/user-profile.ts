"use server";

import { auth } from "@/lib/auth";
import { db, users } from "@/db";
import {
  parseUserProfileForm,
  userProfileFormToDbColumns,
} from "@/lib/user-profile-validation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileActionError = { error: string };
export type ProfileActionOk = { ok: true };

export async function completeOnboardingAction(
  input: unknown,
): Promise<ProfileActionError | void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = parseUserProfileForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const profile = userProfileFormToDbColumns(parsed.data);

  await db
    .update(users)
    .set({
      onboardingCompletedAt: new Date(),
      ...profile,
    })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}

export async function updateUserProfileAction(
  input: unknown,
): Promise<ProfileActionError | ProfileActionOk> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = parseUserProfileForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const profile = userProfileFormToDbColumns(parsed.data);

  await db.update(users).set(profile).where(eq(users.id, session.user.id));

  revalidatePath("/account");
  return { ok: true };
}
