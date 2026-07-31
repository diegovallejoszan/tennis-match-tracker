"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db, matchPrepAdvices, players } from "@/db";
import type { MatchPrepContextSnapshot } from "@/db/schema/match-prep-advice";
import { auth } from "@/lib/auth";
import { isMatchPrepEnabled } from "@/lib/app-phase";
import { getMatchPrepAdviceById } from "@/lib/match-prep/advice-queries";
import { buildMatchPrepPromptContext } from "@/lib/match-prep/build-prep-prompt-context";
import {
  formatMatchPrepLlmError,
  generateMatchPrepAdviceFromLlm,
} from "@/lib/match-prep/generate-advice";
import { KNOWLEDGE_BASE_VERSION } from "@/lib/match-prep/knowledge-base";
import { parseMatchPrepAdviceRequest } from "@/lib/match-prep/validation";
import { getUserLocale } from "@/lib/user-locale-db";

export type MatchPrepActionError = { error: string };
export type MatchPrepActionOk = {
  ok: true;
  advice: {
    id: string;
    opponentId: string | null;
    opponentName?: string | null;
    plannedMatchDate: string;
    adviceMarkdown: string;
    knowledgeBaseVersion: string | null;
    modelId: string | null;
    createdAt: Date;
  };
};
export type MatchPrepDeleteOk = { ok: true };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function mapLlmFailure(err: unknown): MatchPrepActionError {
  if (
    err instanceof Error &&
    err.message === "OPENAI_API_KEY is not configured"
  ) {
    return {
      error:
        "AI advice is not configured. Ask an admin to set OPENAI_API_KEY.",
    };
  }
  return { error: formatMatchPrepLlmError(err) };
}

async function generateAndPersistAdvice(options: {
  userId: string;
  opponentId: string;
  plannedMatchDate: string;
  replaceAdviceId?: string;
}): Promise<MatchPrepActionError | MatchPrepActionOk> {
  const [opponent] = await db
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(
      and(
        eq(players.id, options.opponentId),
        eq(players.userId, options.userId),
      ),
    )
    .limit(1);

  if (!opponent) {
    return { error: "Opponent not found or you do not have access." };
  }

  const locale = await getUserLocale(options.userId);
  const context = await buildMatchPrepPromptContext({
    userId: options.userId,
    opponentId: options.opponentId,
    plannedMatchDate: options.plannedMatchDate,
  });

  let adviceMarkdown: string;
  let modelId: string;
  try {
    const result = await generateMatchPrepAdviceFromLlm({ context, locale });
    adviceMarkdown = result.adviceMarkdown;
    modelId = result.modelId;
  } catch (err) {
    return mapLlmFailure(err);
  }

  const contextSnapshot: MatchPrepContextSnapshot = {
    missingSections: context.missingSections,
    opponentId: options.opponentId,
    opponentName: context.opponent?.name ?? opponent.name,
    headToHeadCount: context.headToHeadMatches.length,
    recentMatchCount: context.recentUserMatches.length,
    hasUserProfile: !context.missingSections.includes("user_profile"),
  };

  const values = {
    adviceMarkdown,
    contextSnapshot,
    knowledgeBaseVersion: KNOWLEDGE_BASE_VERSION,
    modelId,
    createdAt: new Date(),
  };

  if (options.replaceAdviceId) {
    const [updated] = await db
      .update(matchPrepAdvices)
      .set({
        ...values,
        opponentId: options.opponentId,
        plannedMatchDate: options.plannedMatchDate,
      })
      .where(
        and(
          eq(matchPrepAdvices.id, options.replaceAdviceId),
          eq(matchPrepAdvices.userId, options.userId),
        ),
      )
      .returning({
        id: matchPrepAdvices.id,
        opponentId: matchPrepAdvices.opponentId,
        plannedMatchDate: matchPrepAdvices.plannedMatchDate,
        adviceMarkdown: matchPrepAdvices.adviceMarkdown,
        knowledgeBaseVersion: matchPrepAdvices.knowledgeBaseVersion,
        modelId: matchPrepAdvices.modelId,
        createdAt: matchPrepAdvices.createdAt,
      });

    if (!updated) {
      return { error: "Advice not found." };
    }

    revalidatePath("/prepare");
    return {
      ok: true,
      advice: { ...updated, opponentName: opponent.name },
    };
  }

  const [saved] = await db
    .insert(matchPrepAdvices)
    .values({
      userId: options.userId,
      opponentId: options.opponentId,
      plannedMatchDate: options.plannedMatchDate,
      ...values,
    })
    .returning({
      id: matchPrepAdvices.id,
      opponentId: matchPrepAdvices.opponentId,
      plannedMatchDate: matchPrepAdvices.plannedMatchDate,
      adviceMarkdown: matchPrepAdvices.adviceMarkdown,
      knowledgeBaseVersion: matchPrepAdvices.knowledgeBaseVersion,
      modelId: matchPrepAdvices.modelId,
      createdAt: matchPrepAdvices.createdAt,
    });

  if (!saved) {
    return { error: "Failed to save advice." };
  }

  revalidatePath("/prepare");
  return {
    ok: true,
    advice: { ...saved, opponentName: opponent.name },
  };
}

export async function generateMatchPrepAdviceAction(
  input: unknown,
): Promise<MatchPrepActionError | MatchPrepActionOk> {
  if (!isMatchPrepEnabled()) {
    return { error: "Match preparation is not available yet." };
  }

  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  const parsed = parseMatchPrepAdviceRequest(input);
  if (!parsed.success) {
    return { error: "Please select an opponent and a match date." };
  }

  return generateAndPersistAdvice({
    userId,
    opponentId: parsed.data.opponentId,
    plannedMatchDate: parsed.data.plannedMatchDate,
  });
}

export async function regenerateMatchPrepAdviceAction(
  adviceId: string,
): Promise<MatchPrepActionError | MatchPrepActionOk> {
  if (!isMatchPrepEnabled()) {
    return { error: "Match preparation is not available yet." };
  }

  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  if (!adviceId || typeof adviceId !== "string") {
    return { error: "Advice not found." };
  }

  const existing = await getMatchPrepAdviceById(userId, adviceId);
  if (!existing) {
    return { error: "Advice not found." };
  }
  if (!existing.opponentId) {
    return {
      error:
        "This advice’s opponent is no longer available. Choose an opponent and get new advice.",
    };
  }

  return generateAndPersistAdvice({
    userId,
    opponentId: existing.opponentId,
    plannedMatchDate: existing.plannedMatchDate,
    replaceAdviceId: existing.id,
  });
}

export async function deleteMatchPrepAdviceAction(
  adviceId: string,
): Promise<MatchPrepActionError | MatchPrepDeleteOk> {
  if (!isMatchPrepEnabled()) {
    return { error: "Match preparation is not available yet." };
  }

  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  if (!adviceId || typeof adviceId !== "string") {
    return { error: "Advice not found." };
  }

  const deleted = await db
    .delete(matchPrepAdvices)
    .where(
      and(
        eq(matchPrepAdvices.id, adviceId),
        eq(matchPrepAdvices.userId, userId),
      ),
    )
    .returning({ id: matchPrepAdvices.id });

  if (deleted.length === 0) {
    return { error: "Advice not found." };
  }

  revalidatePath("/prepare");
  return { ok: true };
}

export async function loadSavedMatchPrepAdviceAction(
  adviceId: string,
): Promise<MatchPrepActionError | MatchPrepActionOk> {
  if (!isMatchPrepEnabled()) {
    return { error: "Match preparation is not available yet." };
  }

  const userId = await requireUserId();
  if (!userId) return { error: "You must be signed in." };

  if (!adviceId || typeof adviceId !== "string") {
    return { error: "Advice not found." };
  }

  const row = await getMatchPrepAdviceById(userId, adviceId);
  if (!row) {
    return { error: "Advice not found." };
  }

  return {
    ok: true,
    advice: {
      id: row.id,
      opponentId: row.opponentId,
      opponentName: row.opponentName,
      plannedMatchDate: row.plannedMatchDate,
      adviceMarkdown: row.adviceMarkdown,
      knowledgeBaseVersion: row.knowledgeBaseVersion,
      modelId: row.modelId,
      createdAt: row.createdAt,
    },
  };
}
