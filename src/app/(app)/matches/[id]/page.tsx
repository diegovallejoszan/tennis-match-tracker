import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { and, asc, eq } from "drizzle-orm";

import { deleteMatchAction } from "@/app/actions/matches";
import { MatchForm } from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import { db, matchPlayers, matches, players } from "@/db";
import { auth } from "@/lib/auth";
import {
  defaultMatchFormValues,
  MATCH_TYPES,
  type MatchFormInput,
} from "@/lib/matches-validation";

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [matchRow, playerRows, opponentRows, teammateRows] = await Promise.all([
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
      .where(and(eq(matchPlayers.matchId, id), eq(matchPlayers.role, "opponent"))),
    db
      .select({ playerId: matchPlayers.playerId })
      .from(matchPlayers)
      .where(and(eq(matchPlayers.matchId, id), eq(matchPlayers.role, "teammate")))
      .limit(1),
  ]);

  const row = matchRow[0];
  if (!row) notFound();

  const outcome: MatchFormInput["outcome"] =
    row.outcome === "win" || row.outcome === "loss" ? row.outcome : "";

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
    score: row.score ?? "",
    notes: row.notes ?? "",
    opponentIds: opponentRows.map((entry) => entry.playerId),
    partnerId: teammateRows[0]?.playerId ?? "",
  };

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

      <MatchForm
        mode="edit"
        matchId={row.id}
        defaultValues={defaultValues}
        players={playerRows}
      />
    </div>
  );
}
