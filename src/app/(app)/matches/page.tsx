import Link from "next/link";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const typeLabels: Record<string, string> = {
  practice: "Practice",
  single: "Single",
  doubles: "Doubles",
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Matches</h1>
        <Button asChild>
          <Link href="/matches/new">New match</Link>
        </Button>
      </div>

      <form
        method="get"
        className="mb-6 grid gap-3 rounded-lg border border-border p-4 md:grid-cols-4"
      >
        <label className="space-y-1 text-sm">
          <span>Type</span>
          <select
            name="type"
            defaultValue={type}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">All</option>
            <option value="practice">Practice</option>
            <option value="single">Single</option>
            <option value="doubles">Doubles</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>From</span>
          <Input type="date" name="from" defaultValue={from} />
        </label>

        <label className="space-y-1 text-sm">
          <span>To</span>
          <Input type="date" name="to" defaultValue={to} />
        </label>

        <label className="space-y-1 text-sm">
          <span>Player (opponent or partner)</span>
          <select
            name="opponentId"
            defaultValue={opponentId}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">All</option>
            {playerRows.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-4">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">No matches yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first match to track score, opponents, and notes.
          </p>
          <Button asChild className="mt-4">
            <Link href="/matches/new">Create first match</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  Result
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  Score
                </th>
                <th scope="col" className="min-w-[140px] px-3 py-3 font-medium">
                  Partner
                </th>
                <th scope="col" className="min-w-[160px] px-3 py-3 font-medium">
                  Opponents
                </th>
                <th scope="col" className="min-w-[200px] px-3 py-3 font-medium">
                  Notes
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                  <span className="sr-only">Actions</span>
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
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Win</Badge>
                    ) : null}
                    {match.outcome === "loss" ? (
                      <Badge variant="destructive">Loss</Badge>
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
                      <Link href={`/matches/${match.id}`}>Open</Link>
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
