"use server";

import { auth } from "@/lib/auth";
import { db, players } from "@/db";
import { parsePlayerForm, toDbPlayerValues } from "@/lib/players-validation";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PlayerActionError = { error: string };
export type PlayerActionOk = { ok: true };
export type PlayerCreateActionOk = {
  ok: true;
  player: { id: string; name: string };
};

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createPlayerAction(
  input: unknown,
): Promise<PlayerActionError | PlayerCreateActionOk> {
  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  const parsed = parsePlayerForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const inserted = await db
    .insert(players)
    .values(toDbPlayerValues(parsed.data, userId))
    .returning({ id: players.id, name: players.name });

  const player = inserted[0];
  if (!player) {
    return { error: "Failed to create player." };
  }

  revalidatePath("/players");
  revalidatePath("/matches/new");
  return { ok: true, player };
}

export async function updatePlayerAction(
  playerId: string,
  input: unknown,
): Promise<PlayerActionError | PlayerActionOk> {
  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  const parsed = parsePlayerForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const updated = await db
    .update(players)
    .set(toDbPlayerValues(parsed.data, userId))
    .where(and(eq(players.id, playerId), eq(players.userId, userId)))
    .returning({ id: players.id });

  if (updated.length === 0) {
    return { error: "Player not found or you do not have access." };
  }

  revalidatePath("/players");
  revalidatePath(`/players/${playerId}/edit`);
  return { ok: true };
}

export async function deletePlayerAction(playerId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  await db
    .delete(players)
    .where(and(eq(players.id, playerId), eq(players.userId, userId)));

  redirect("/players");
}
