import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardFiltersForm } from "@/components/dashboard/dashboard-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, players } from "@/db";
import { auth } from "@/lib/auth";
import {
  buildSparklinePoints,
  countMatchesThisCalendarMonth,
  filterMatchesForDashboard,
  mostFrequentOpponent,
  winLossByMatchType,
  winRateByMonth,
  winRateForMatchType,
  type DashboardFilters,
  type MatchForDashboard,
} from "@/lib/dashboard-aggregates";
import { fetchGroupedMatchesForUser, type GroupedMatch } from "@/lib/grouped-matches";

type DashboardPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    matchType?: string;
    opponentId?: string;
    completionStatus?: string;
  }>;
};

function toStatsShape(matches: GroupedMatch[]): MatchForDashboard[] {
  return matches.map((m) => ({
    id: m.id,
    date: m.date,
    time: m.time,
    createdAt: m.createdAt,
    matchType: m.matchType,
    outcome: m.outcome,
    opponents: m.opponents,
    partner: m.partner,
  }));
}

function parseFilters(params: {
  from?: string;
  to?: string;
  matchType?: string;
  opponentId?: string;
  completionStatus?: string;
}): DashboardFilters {
  const filters: DashboardFilters = {
    completionStatus: params.completionStatus || "all",
  };
  if (params.from) filters.from = params.from;
  if (params.to) filters.to = params.to;
  if (params.matchType) filters.matchType = params.matchType;
  if (params.opponentId) filters.opponentId = params.opponentId;
  return filters;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");

  const params = await searchParams;
  const filters = parseFilters(params);

  const [allMatches, playerRows] = await Promise.all([
    fetchGroupedMatchesForUser(session.user.id),
    db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.userId, session.user.id))
      .orderBy(players.name),
  ]);

  const statsInput = toStatsShape(allMatches);
  const filteredInput = filterMatchesForDashboard(statsInput, filters);

  const filteredFull = allMatches.filter((m) => {
    const shaped = toStatsShape([m])[0]!;
    return filterMatchesForDashboard([shaped], filters).length > 0;
  });

  const singlesRate = winRateForMatchType(filteredInput, "single");
  const doublesRate = winRateForMatchType(filteredInput, "doubles");
  const topOpponent = mostFrequentOpponent(filteredInput);
  const thisMonthCount = countMatchesThisCalendarMonth(filteredInput, new Date());

  const sparklinePoints = buildSparklinePoints(filteredInput);
  const wlByType = winLossByMatchType(filteredInput).map((row) => ({
    label:
      row.typeKey === "single" ? tCommon("singles") : tCommon("doubles"),
    wins: row.wins,
    losses: row.losses,
  }));
  const winRateSeries = winRateByMonth(filteredInput).map(
    ({ label, winRate, competitiveCount }) => ({
      label,
      winRate,
      competitiveCount,
    }),
  );

  const recent = [...filteredFull]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const typeLabels: Record<string, string> = {
    practice: tCommon("practice"),
    single: tCommon("singles"),
    doubles: tCommon("doubles"),
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button variant="outline" asChild>
          <Link href="/matches/new">{t("logMatch")}</Link>
        </Button>
      </div>

      <DashboardFiltersForm filters={filters} opponents={playerRows} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("cards.totalMatches")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {filteredFull.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("cards.inRange")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("cards.singlesWinRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {singlesRate.rate === null ? "—" : `${singlesRate.rate}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {singlesRate.wins + singlesRate.losses === 0
                ? t("cards.noResults")
                : t("cards.record", {
                    wins: singlesRate.wins,
                    losses: singlesRate.losses,
                  })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("cards.doublesWinRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {doublesRate.rate === null ? "—" : `${doublesRate.rate}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {doublesRate.wins + doublesRate.losses === 0
                ? t("cards.noResults")
                : t("cards.record", {
                    wins: doublesRate.wins,
                    losses: doublesRate.losses,
                  })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("cards.matchesThisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{thisMonthCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("cards.monthHint")}
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("cards.topOpponent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold leading-snug">
              {topOpponent ? topOpponent.name : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topOpponent
                ? t("cards.matchCount", { count: topOpponent.count })
                : t("cards.noOpponents")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-10">
        <DashboardCharts
          sparklinePoints={sparklinePoints}
          winLossByType={wlByType}
          winRateByMonth={winRateSeries}
        />
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">{t("recent.title")}</h2>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/matches">{tCommon("viewAll")}</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("recent.empty")}{" "}
              <Link href="/matches/new" className="font-medium text-foreground underline">
                {tCommon("addOne")}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {recent.map((match) => (
              <li key={match.id}>
                <Link
                  href={`/matches/${match.id}`}
                  className="block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{match.date}</span>
                    {match.time ? (
                      <span className="text-sm text-muted-foreground">
                        {match.time.slice(0, 5)}
                      </span>
                    ) : null}
                    <Badge variant="secondary">
                      {typeLabels[match.matchType] ?? match.matchType}
                    </Badge>
                    {match.outcome === "win" ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        {tCommon("win")}
                      </Badge>
                    ) : null}
                    {match.outcome === "loss" ? (
                      <Badge variant="destructive">{tCommon("loss")}</Badge>
                    ) : null}
                    {match.outcome === "non_finished" ? (
                      <Badge variant="outline">{tCommon("notFinished")}</Badge>
                    ) : null}
                  </div>
                  {match.score ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tCommon("score")}: {match.score}
                    </p>
                  ) : null}
                  {match.opponents.length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tCommon("vs")}{" "}
                      {match.opponents.map((o) => o.name).join(", ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
