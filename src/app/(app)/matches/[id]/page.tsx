import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { and, asc, eq } from "drizzle-orm";

import { deleteMatchAction } from "@/app/actions/matches";
import { MatchForm } from "@/components/matches/match-form";
import { MatchIntegrityPanel } from "@/components/matches/match-integrity-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db, matchPlayers, matchScoreSegments, matches, players } from "@/db";
import { auth } from "@/lib/auth";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import { formatScoreFromSegments } from "@/lib/match-score/format";
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
  searchParams: Promise<{ edit?: string }>;
};

export default async function MatchDetailPage({
  params,
  searchParams,
}: MatchDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("matches");
  const tCommon = await getTranslations("common");
  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "1";

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
  const playerNames = new Map(playerRows.map((player) => [player.id, player.name]));
  const opponentNames = opponentRows
    .map((entry) => playerNames.get(entry.playerId))
    .filter((name): name is string => Boolean(name));
  const partnerName = teammateRows[0]
    ? playerNames.get(teammateRows[0].playerId)
    : null;
  const displayScore = useStructuredScore
    ? formatScoreFromSegments(scoreSegments)
    : row.score;
  const typeLabel =
    row.matchType === "single"
      ? tCommon("singles")
      : row.matchType === "doubles"
        ? tCommon("doubles")
        : tCommon("practice");
  const outcomeLabel =
    outcome === "win"
      ? tCommon("win")
      : outcome === "loss"
        ? tCommon("loss")
        : outcome === "non_finished"
          ? tCommon("notFinished")
          : "—";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/matches">← {tCommon("back")}</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{t("matchDetails")}</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button variant="outline" asChild>
              <Link href={`/matches/${row.id}`}>{tCommon("cancel")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href={`/matches/${row.id}?edit=1`}>{tCommon("edit")}</Link>
              </Button>
              <form action={deleteMatchAction.bind(null, row.id)}>
                <Button type="submit" variant="destructive">
                  {t("deleteMatch")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <MatchForm
          mode="edit"
          matchId={row.id}
          defaultValues={defaultValues}
          players={playerRows}
          userLocale={userLocale}
          cancelHref={`/matches/${row.id}`}
        />
      ) : (
        <div className="max-w-2xl space-y-4">
          <MatchIntegrityPanel
            outcome={integrityOutcome}
            segments={scoreSegments}
            legacyScore={useStructuredScore ? null : row.score}
          />
          <Card>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <Detail label={t("form.date")} value={row.date} />
              <Detail
                label={t("form.timeOptional")}
                value={row.time?.slice(0, 5) || "—"}
              />
              <Detail label={t("form.matchType")} value={typeLabel} />
              <Detail label={t("form.result")} value={outcomeLabel} />
              <Detail
                label={t("columns.score")}
                value={displayScore || "—"}
              />
              <Detail
                label={t("columns.partner")}
                value={partnerName || "—"}
              />
              <Detail
                label={t("columns.opponents")}
                value={opponentNames.join(", ") || "—"}
              />
              <Detail
                label={t("columns.notes")}
                value={row.notes || "—"}
                className="sm:col-span-2"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
        {value}
      </dd>
    </div>
  );
}
