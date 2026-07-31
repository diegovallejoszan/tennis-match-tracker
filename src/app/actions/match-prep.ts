"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db, matchPrepAdvices, players } from "@/db";
import type { MatchPrepContextSnapshot } from "@/db/schema/match-prep-advice";
import { auth } from "@/lib/auth";
import { isMatchPrepEnabled } from "@/lib/app-phase";
import { getMatchPrepAdviceById } from "@/lib/match-prep/advice-queries";
import {
  buildMatchPrepPromptContext,
} from "@/lib/match-prep/build-prep-prompt-context";
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

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
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

  const { opponentId, plannedMatchDate } = parsed.data;

  const [opponent] = await db
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(and(eq(players.id, opponentId), eq(players.userId, userId)))
    .limit(1);

  if (!opponent) {
    return { error: "Opponent not found or you do not have access." };
  }

  const locale = await getUserLocale(userId);
  const context = await buildMatchPrepPromptContext({
    userId,
    opponentId,
    plannedMatchDate,
  });

  let adviceMarkdown: string;
  let modelId: string;
  try {
    const result = await generateMatchPrepAdviceFromLlm({ context, locale });
    adviceMarkdown = result.adviceMarkdown;
    modelId = result.modelId;
  } catch (err) {
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

  const contextSnapshot: MatchPrepContextSnapshot = {
    missingSections: context.missingSections,
    opponentId,
    opponentName: context.opponent?.name ?? opponent.name,
    headToHeadCount: context.headToHeadMatches.length,
    recentMatchCount: context.recentUserMatches.length,
    hasUserProfile: !context.missingSections.includes("user_profile"),
  };

  const [saved] = await db
    .insert(matchPrepAdvices)
    .values({
      userId,
      opponentId,
      plannedMatchDate,
      adviceMarkdown,
      contextSnapshot,
      knowledgeBaseVersion: KNOWLEDGE_BASE_VERSION,
      modelId,
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
