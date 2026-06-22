import { and, eq } from "drizzle-orm";

import { db, players, users } from "@/db";
import { fetchGroupedMatchesForUser } from "@/lib/grouped-matches";

import { formatKnowledgeBaseForLlm } from "./knowledge-base";
import type { MatchPrepPromptContext } from "./format-prep-prompt";

export type { MatchPrepPromptContext } from "./format-prep-prompt";
export { formatMatchPrepPromptContext } from "./format-prep-prompt";

export type BuildMatchPrepPromptContextInput = {
  userId: string;
  opponentId: string;
  plannedMatchDate: string;
};

function summarizeMatch(
  m: Awaited<ReturnType<typeof fetchGroupedMatchesForUser>>[number],
) {
  return {
    date: m.date,
    matchType: m.matchType,
    outcome: m.outcome,
    score: m.score,
    notes: m.notes,
  };
}

/**
 * Gathers all inputs for a Phase 5 LLM match-prep request.
 * Missing data is omitted and listed in `missingSections` so the model can adapt.
 */
export async function buildMatchPrepPromptContext(
  input: BuildMatchPrepPromptContextInput,
): Promise<MatchPrepPromptContext> {
  const missingSections: string[] = [];

  const [opponentRows, userRows, allMatches] = await Promise.all([
    db
      .select({
        id: players.id,
        name: players.name,
        playStyle: players.playStyle,
        strengths: players.strengths,
        weaknesses: players.weaknesses,
        notes: players.notes,
      })
      .from(players)
      .where(and(eq(players.id, input.opponentId), eq(players.userId, input.userId)))
      .limit(1),
    db
      .select({
        profilePlayStyle: users.profilePlayStyle,
        profileStrengths: users.profileStrengths,
        profileWeaknesses: users.profileWeaknesses,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1),
    fetchGroupedMatchesForUser(input.userId),
  ]);

  const opponent = opponentRows[0] ?? null;
  if (!opponent) {
    missingSections.push("opponent_profile");
  }

  const user = userRows[0];
  const userProfile = {
    playStyle: user?.profilePlayStyle ?? null,
    strengths: user?.profileStrengths ?? null,
    weaknesses: user?.profileWeaknesses ?? null,
  };

  if (
    !userProfile.playStyle &&
    !userProfile.strengths &&
    !userProfile.weaknesses
  ) {
    missingSections.push("user_profile");
  }

  const headToHeadMatches = allMatches
    .filter((m) => m.opponents.some((o) => o.id === input.opponentId))
    .map(summarizeMatch);

  if (headToHeadMatches.length === 0) {
    missingSections.push("head_to_head_history");
  }

  const recentUserMatches = allMatches.slice(0, 5).map((m) => ({
    ...summarizeMatch(m),
    opponents: m.opponents.map((o) => o.name),
  }));

  if (recentUserMatches.length === 0) {
    missingSections.push("recent_match_history");
  }

  const knowledgeBaseMarkdown = formatKnowledgeBaseForLlm({
    opponentPlayStyle: opponent?.playStyle ?? null,
  });

  return {
    plannedMatchDate: input.plannedMatchDate,
    opponent,
    userProfile,
    headToHeadMatches,
    recentUserMatches,
    knowledgeBaseMarkdown,
    missingSections,
  };
}
