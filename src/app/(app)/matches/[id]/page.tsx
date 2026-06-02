import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { and, asc, eq } from "drizzle-orm";

import { deleteMatchAction } from "@/app/actions/matches";
import { MatchForm } from "@/components/matches/match-form";
import { MatchIntegrityPanel } from "@/components/matches/match-integrity-panel";
import { Button } from "@/components/ui/button";
import { db, matchPlayers, matchScoreSegments, matches, players } from "@/db";
import { auth } from "@/lib/auth";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import type { ScoreSegmentInput } from "@/lib/match-score/types";
import {
  defaultMatchFormValues,
  MATCH_TYPES,
  type MatchFormInput,
  type MatchOutcome,
} from "@/lib/matches-validation";
import { getUserLocale } from "@/lib/user-locale-db";

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [matchRow, playerRows, opponentRows, teammateRows, segmentRows, locale] =
    await Promise.all([
      db
        .select()
        .from(matches)
        .where(and(eq(matches.id, id), eq(matches.userId, session.user.id)))
        .limit(1),
      db
        .select({ id: players.id, name: players.name })
        .from(players)
        .where(eq(players.userId, session.user.id))
        .orderBy(asc(players.name)),
      db
        .select({ playerId: matchPlayers.playerId })
        .from(matchPlayers)
        .where(
          and(eq(matchPlayers.matchId, id), eq(matchPlayers.role, "opponent")),
        ),
      db
        .select({ playerId: matchPlayers.playerId })
        .from(matchPlayers)
        .where(
          and(eq(matchPlayers.matchId, id), eq(matchPlayers.role, "teammate")),
        )
        .limit(1),
      db
        .select({
          segmentType: matchScoreSegments.segmentType,
          userGamesOrPoints: matchScoreSegments.userGamesOrPoints,
          opponentGamesOrPoints: matchScoreSegments.opponentGamesOrPoints,
        })
        .from(matchScoreSegments)
        .where(eq(matchScoreSegments.matchId, id))
        .orderBy(asc(matchScoreSegments.segmentOrder)),
      getUserLocale(session.user.id),
    ]);

  const row = matchRow[0];
  if (!row) notFound();

  const outcome: MatchFormInput["outcome"] =
    row.outcome === "win" ||
    row.outcome === "loss" ||
    row.outcome === "non_finished"
      ? row.outcome
      : "";

  const scoreSegments: ScoreSegmentInput[] = segmentRows.map((seg) => ({
    segmentType: seg.segmentType as ScoreSegmentInput["segmentType"],
    userGamesOrPoints: seg.userGamesOrPoints,
    opponentGamesOrPoints: seg.opponentGamesOrPoints,
  }));

  const useStructuredScore = scoreSegments.length > 0;

  const defaultValues = {
    ...defaultMatchFormValues(),
    date: row.date,
    time: row.time ? row.time.slice(0, 5) : "",
    matchType: MATCH_TYPES.includes(
      row.matchType as (typeof MATCH_TYPES)[number],
    )
      ? (row.matchType as (typeof MATCH_TYPES)[number])
      : "practice",
    outcome,
    legacyScore: useStructuredScore ? "" : (row.score ?? ""),
    useStructuredScore,
    scoreSegments,
    notes: row.notes ?? "",
    opponentIds: opponentRows.map((entry) => entry.playerId),
    partnerId: teammateRows[0]?.playerId ?? "",
  };

  const userLocale: AppLocale = isAppLocale(locale) ? locale : "en";
  const integrityOutcome: MatchOutcome | null =
    outcome === "" ? null : outcome;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/matches">← Back</Link>
          </Button>
          <h1 className="text-2xl font-semibold">Match details</h1>
        </div>
        <form action={deleteMatchAction.bind(null, row.id)}>
          <Button type="submit" variant="destructive" size="sm">
            Delete match
          </Button>
        </form>
      </div>

      <MatchIntegrityPanel
        outcome={integrityOutcome}
        segments={scoreSegments}
        legacyScore={useStructuredScore ? null : row.score}
      />

      <MatchForm
        mode="edit"
        matchId={row.id}
        defaultValues={defaultValues}
        players={playerRows}
        userLocale={userLocale}
      />
    </div>
  );
}
