import { asc, desc, eq, inArray } from "drizzle-orm";

import { db, matchPlayers, matchScoreSegments, matches, players } from "@/db";
import type { ScoreSegmentInput, SegmentType } from "@/lib/match-score/types";

export type GroupedMatch = {
  id: string;
  date: string;
  time: string | null;
  matchType: string;
  outcome: string | null;
  score: string | null;
  notes: string | null;
  createdAt: Date;
  partner: { id: string; name: string } | null;
  opponents: Array<{ id: string; name: string }>;
  scoreSegments: ScoreSegmentInput[];
};

/**
 * All matches for a user with opponents/partner rolled up (same shape as the matches list page).
 */
export async function fetchGroupedMatchesForUser(
  userId: string,
): Promise<GroupedMatch[]> {
  const joinedRows = await db
    .select({
      matchId: matches.id,
      date: matches.date,
      time: matches.time,
      matchType: matches.matchType,
      outcome: matches.outcome,
      score: matches.score,
      notes: matches.notes,
      createdAt: matches.createdAt,
      playerId: players.id,
      playerName: players.name,
      role: matchPlayers.role,
    })
    .from(matches)
    .leftJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
    .leftJoin(players, eq(players.id, matchPlayers.playerId))
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.date), desc(matches.time), desc(matches.createdAt));

  const grouped = new Map<string, GroupedMatch>();

  for (const row of joinedRows) {
    if (!grouped.has(row.matchId)) {
      grouped.set(row.matchId, {
        id: row.matchId,
        date: row.date,
        time: row.time,
        matchType: row.matchType,
        outcome: row.outcome,
        score: row.score,
        notes: row.notes,
        createdAt: row.createdAt,
        partner: null,
        opponents: [],
        scoreSegments: [],
      });
    }

    const entry = grouped.get(row.matchId)!;
    if (
      row.role === "opponent" &&
      row.playerId !== null &&
      row.playerName !== null
    ) {
      entry.opponents.push({ id: row.playerId, name: row.playerName });
    }
    if (
      row.role === "teammate" &&
      row.playerId !== null &&
      row.playerName !== null
    ) {
      entry.partner = { id: row.playerId, name: row.playerName };
    }
  }

  const matchIds = [...grouped.keys()];
  if (matchIds.length > 0) {
    const segmentRows = await db
      .select({
        matchId: matchScoreSegments.matchId,
        segmentOrder: matchScoreSegments.segmentOrder,
        segmentType: matchScoreSegments.segmentType,
        userGamesOrPoints: matchScoreSegments.userGamesOrPoints,
        opponentGamesOrPoints: matchScoreSegments.opponentGamesOrPoints,
      })
      .from(matchScoreSegments)
      .where(inArray(matchScoreSegments.matchId, matchIds))
      .orderBy(asc(matchScoreSegments.segmentOrder));

    for (const seg of segmentRows) {
      const entry = grouped.get(seg.matchId);
      if (!entry) continue;
      entry.scoreSegments.push({
        segmentType: seg.segmentType as SegmentType,
        userGamesOrPoints: seg.userGamesOrPoints,
        opponentGamesOrPoints: seg.opponentGamesOrPoints,
      });
    }
  }

  return [...grouped.values()];
}
