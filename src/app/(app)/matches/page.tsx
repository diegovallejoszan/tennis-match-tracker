import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchesFilters } from "@/components/matches/matches-filters";
import { db, players } from "@/db";
import { auth } from "@/lib/auth";
import { fetchGroupedMatchesForUser } from "@/lib/grouped-matches";

type MatchesPageProps = {
  searchParams: Promise<{
    type?: string;
    from?: string;
    to?: string;
    opponentId?: string;
  }>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("matches");
  const tCommon = await getTranslations("common");
  const { type = "", from = "", to = "", opponentId = "" } = await searchParams;

  const [playerRows, groupedMatches] = await Promise.all([
    db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.userId, session.user.id))
      .orderBy(players.name),
    fetchGroupedMatchesForUser(session.user.id),
  ]);

  const filtered = groupedMatches.filter((match) => {
    if (type && match.matchType !== type) return false;
    if (from && match.date < from) return false;
    if (to && match.date > to) return false;
    if (opponentId) {
      const asOpponent = match.opponents.some((op) => op.id === opponentId);
      const asPartner = match.partner?.id === opponentId;
      if (!asOpponent && !asPartner) return false;
    }
    return true;
  });

  const typeLabels: Record<string, string> = {
    practice: tCommon("practice"),
    single: tCommon("singles"),
    doubles: tCommon("doubles"),
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild>
          <Link href="/matches/new">{t("newMatch")}</Link>
        </Button>
      </div>

      <MatchesFilters
        filters={{ type, from, to, opponentId }}
        players={playerRows}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
          <Button asChild className="mt-4">
            <Link href="/matches/new">{t("createFirst")}</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  {t("columns.date")}
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  {t("columns.type")}
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  {t("columns.result")}
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  {t("columns.score")}
                </th>
                <th scope="col" className="min-w-[140px] px-3 py-3 font-medium">
                  {t("columns.partner")}
                </th>
                <th scope="col" className="min-w-[160px] px-3 py-3 font-medium">
                  {t("columns.opponents")}
                </th>
                <th scope="col" className="min-w-[200px] px-3 py-3 font-medium">
                  {t("columns.notes")}
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  <span className="sr-only">{t("columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => (
                <tr
                  key={match.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <Link
                      href={`/matches/${match.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {match.date}
                      {match.time ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {match.time.slice(0, 5)}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <Badge variant="secondary">
                      {typeLabels[match.matchType] ?? match.matchType}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
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
                    {!match.outcome ? (
                      <span className="text-muted-foreground">—</span>
                    ) : null}
                  </td>
                  <td className="max-w-[120px] px-3 py-3 align-top">
                    {match.score ? (
                      <span className="break-words">{match.score}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {match.partner ? (
                      <span className="break-words">{match.partner.name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {match.opponents.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="break-words">
                        {match.opponents.map((op) => op.name).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs px-3 py-3 align-top text-muted-foreground">
                    {match.notes ? (
                      <span className="line-clamp-2 break-words" title={match.notes}>
                        {match.notes}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <Link href={`/matches/${match.id}`}>{tCommon("open")}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
