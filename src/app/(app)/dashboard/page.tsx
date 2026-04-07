import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import {
  competitiveWinLoss,
  countMatchesThisCalendarMonth,
  filterMatchesByDateRange,
  matchesPerMonth,
  mostFrequentOpponent,
  winLossByMatchType,
  winRateByMonth,
  winRatePercent,
} from "@/lib/dashboard-aggregates";
import { fetchGroupedMatchesForUser, type GroupedMatch } from "@/lib/grouped-matches";

type DashboardPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

const typeLabels: Record<string, string> = {
  practice: "Practice",
  single: "Single",
  doubles: "Doubles",
};

function toStatsShape(matches: GroupedMatch[]) {
  return matches.map((m) => ({
    date: m.date,
    matchType: m.matchType,
    outcome: m.outcome,
    opponents: m.opponents,
  }));
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { from = "", to = "" } = await searchParams;

  const allMatches = await fetchGroupedMatchesForUser(session.user.id);
  const statsInput = toStatsShape(allMatches);
  const filteredInput = filterMatchesByDateRange(statsInput, from || undefined, to || undefined);

  const filteredFull = allMatches.filter((m) => {
    if (from && m.date < from) return false;
    if (to && m.date > to) return false;
    return true;
  });

  const { wins, losses } = competitiveWinLoss(filteredInput);
  const rate = winRatePercent(wins, losses);
  const topOpponent = mostFrequentOpponent(filteredInput);
  const thisMonthCount = countMatchesThisCalendarMonth(filteredInput, new Date());

  const monthSeries = matchesPerMonth(filteredInput).map(({ label, count }) => ({
    label,
    count,
  }));
  const wlByType = winLossByMatchType(filteredInput).map(
    ({ label, wins: w, losses: l }) => ({ label, wins: w, losses: l }),
  );
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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button variant="outline" asChild>
          <Link href="/matches/new">Log a match</Link>
        </Button>
      </div>

      <form
        method="get"
        className="mb-6 grid gap-3 rounded-lg border border-border p-4 md:grid-cols-3"
      >
        <label className="space-y-1 text-sm">
          <span>From</span>
          <Input type="date" name="from" defaultValue={from} />
        </label>
        <label className="space-y-1 text-sm">
          <span>To</span>
          <Input type="date" name="to" defaultValue={to} />
        </label>
        <div className="flex items-end gap-2 md:col-span-1">
          <Button type="submit" variant="secondary">
            Apply range
          </Button>
          {from || to ? (
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Clear</Link>
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{filteredFull.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">In selected date range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {rate === null ? "—" : `${rate}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {wins + losses === 0
                ? "No competitive results in range"
                : `${wins}W · ${losses}L (singles & doubles)`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matches this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{thisMonthCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Within range, current calendar month (UTC)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top opponent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold leading-snug">
              {topOpponent ? topOpponent.name : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topOpponent
                ? `${topOpponent.count} match${topOpponent.count === 1 ? "" : "es"} in range`
                : "No opponents in range"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-10">
        <DashboardCharts
          matchesPerMonth={monthSeries}
          winLossByType={wlByType}
          winRateByMonth={winRateSeries}
        />
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Recent matches</h2>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/matches">View all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No matches in this range.{" "}
              <Link href="/matches/new" className="font-medium text-foreground underline">
                Add one
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
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Win</Badge>
                    ) : null}
                    {match.outcome === "loss" ? (
                      <Badge variant="destructive">Loss</Badge>
                    ) : null}
                  </div>
                  {match.score ? (
                    <p className="mt-2 text-sm text-muted-foreground">Score: {match.score}</p>
                  ) : null}
                  {match.opponents.length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      vs {match.opponents.map((o) => o.name).join(", ")}
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
