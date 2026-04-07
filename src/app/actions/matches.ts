"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db, matchPlayers, matches, players } from "@/db";
import { auth } from "@/lib/auth";
import { parseMatchForm, toDbMatchValues } from "@/lib/matches-validation";

export type MatchActionError = { error: string };
export type MatchActionOk = { ok: true };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getValidPlayerIds(
  userId: string,
  playerIds: string[],
): Promise<Set<string>> {
  if (playerIds.length === 0) return new Set<string>();

  const rows = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.userId, userId), inArray(players.id, playerIds)));

  return new Set(rows.map((row) => row.id));
}

function hasInvalidPlayers(
  playerIds: string[],
  validPlayerIds: Set<string>,
): boolean {
  return playerIds.some((id) => !validPlayerIds.has(id));
}

function playerIdsForValidation(data: {
  matchType: string;
  opponentIds: string[];
  partnerId: string;
}): string[] {
  const opponentIds = [...new Set(data.opponentIds)];
  if (data.matchType === "doubles" && data.partnerId !== "") {
    return [...new Set([...opponentIds, data.partnerId])];
  }
  return opponentIds;
}

function buildMatchPlayerRows(
  matchId: string,
  data: {
    matchType: string;
    opponentIds: string[];
    partnerId: string;
  },
): Array<{ matchId: string; playerId: string; role: string }> {
  const opponentIds = [...new Set(data.opponentIds)];
  const rows = opponentIds.map((playerId) => ({
    matchId,
    playerId,
    role: "opponent",
  }));

  if (data.matchType === "doubles" && data.partnerId !== "") {
    rows.push({
      matchId,
      playerId: data.partnerId,
      role: "teammate",
    });
  }

  return rows;
}

export async function createMatchAction(
  input: unknown,
): Promise<MatchActionError | MatchActionOk> {
  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  const parsed = parseMatchForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const idsToVerify = playerIdsForValidation(parsed.data);
  const validPlayerIds = await getValidPlayerIds(userId, idsToVerify);
  if (hasInvalidPlayers(idsToVerify, validPlayerIds)) {
    return { error: "One or more selected players are invalid." };
  }

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(matches)
      .values(toDbMatchValues(parsed.data, userId))
      .returning({ id: matches.id });

    const matchId = inserted[0]?.id;
    if (!matchId) {
      throw new Error("Failed to create match");
    }

    const rows = buildMatchPlayerRows(matchId, parsed.data);
    if (rows.length > 0) {
      await tx.insert(matchPlayers).values(rows);
    }
  });

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateMatchAction(
  matchId: string,
  input: unknown,
): Promise<MatchActionError | MatchActionOk> {
  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  const parsed = parseMatchForm(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }

  const idsToVerify = playerIdsForValidation(parsed.data);
  const validPlayerIds = await getValidPlayerIds(userId, idsToVerify);
  if (hasInvalidPlayers(idsToVerify, validPlayerIds)) {
    return { error: "One or more selected players are invalid." };
  }

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(matches)
        .set(toDbMatchValues(parsed.data, userId))
        .where(and(eq(matches.id, matchId), eq(matches.userId, userId)))
        .returning({ id: matches.id });

      if (updated.length === 0) {
        throw new Error("MATCH_NOT_FOUND");
      }

      await tx.delete(matchPlayers).where(eq(matchPlayers.matchId, matchId));

      const rows = buildMatchPlayerRows(matchId, parsed.data);
      if (rows.length > 0) {
        await tx.insert(matchPlayers).values(rows);
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MATCH_NOT_FOUND") {
      return { error: "Match not found or you do not have access." };
    }
    throw error;
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMatchAction(matchId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  await db
    .delete(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));

  revalidatePath("/dashboard");
  redirect("/matches");
}
