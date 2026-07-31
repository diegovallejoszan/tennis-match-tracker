import { and, desc, eq } from "drizzle-orm";

import { db, matchPrepAdvices, players } from "@/db";

export type SavedMatchPrepAdviceSummary = {
  id: string;
  opponentId: string | null;
  opponentName: string | null;
  plannedMatchDate: string;
  createdAt: Date;
  knowledgeBaseVersion: string | null;
  modelId: string | null;
};

export type SavedMatchPrepAdvice = SavedMatchPrepAdviceSummary & {
  adviceMarkdown: string;
};

export async function listMatchPrepAdviceForUser(
  userId: string,
  filters?: { opponentId?: string },
): Promise<SavedMatchPrepAdviceSummary[]> {
  const conditions = [eq(matchPrepAdvices.userId, userId)];
  if (filters?.opponentId) {
    conditions.push(eq(matchPrepAdvices.opponentId, filters.opponentId));
  }

  const rows = await db
    .select({
      id: matchPrepAdvices.id,
      opponentId: matchPrepAdvices.opponentId,
      opponentName: players.name,
      plannedMatchDate: matchPrepAdvices.plannedMatchDate,
      createdAt: matchPrepAdvices.createdAt,
      knowledgeBaseVersion: matchPrepAdvices.knowledgeBaseVersion,
      modelId: matchPrepAdvices.modelId,
    })
    .from(matchPrepAdvices)
    .leftJoin(players, eq(matchPrepAdvices.opponentId, players.id))
    .where(and(...conditions))
    .orderBy(desc(matchPrepAdvices.createdAt))
    .limit(50);

  return rows;
}

export async function getMatchPrepAdviceById(
  userId: string,
  adviceId: string,
): Promise<SavedMatchPrepAdvice | null> {
  const [row] = await db
    .select({
      id: matchPrepAdvices.id,
      opponentId: matchPrepAdvices.opponentId,
      opponentName: players.name,
      plannedMatchDate: matchPrepAdvices.plannedMatchDate,
      createdAt: matchPrepAdvices.createdAt,
      knowledgeBaseVersion: matchPrepAdvices.knowledgeBaseVersion,
      modelId: matchPrepAdvices.modelId,
      adviceMarkdown: matchPrepAdvices.adviceMarkdown,
    })
    .from(matchPrepAdvices)
    .leftJoin(players, eq(matchPrepAdvices.opponentId, players.id))
    .where(
      and(eq(matchPrepAdvices.id, adviceId), eq(matchPrepAdvices.userId, userId)),
    )
    .limit(1);

  return row ?? null;
}
