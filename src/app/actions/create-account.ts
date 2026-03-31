"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export async function createAccountAction() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}
