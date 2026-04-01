import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarDays, Phone, ShieldAlert, Swords } from "lucide-react";

import { auth } from "@/lib/auth";
import { db, players } from "@/db";
import { and, desc, eq, ilike } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { getAvailableDayAbbrevList } from "@/lib/players-validation";

type PlayersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const safeTerm = query.trim().replace(/[%_\\]/g, "");

  const conditions = [eq(players.userId, session.user.id)];
  if (safeTerm.length > 0) {
    conditions.push(ilike(players.name, `%${safeTerm}%`));
  }

  const rows = await db
    .select()
    .from(players)
    .where(and(...conditions))
    .orderBy(desc(players.createdAt));

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Players</h1>
        <Button asChild>
          <Link href="/players/new">Add player</Link>
        </Button>
      </div>

      <form
        method="get"
        className="mb-6 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center"
        role="search"
      >
        <label htmlFor="player-search" className="sr-only">
          Search players by name
        </label>
        <Input
          id="player-search"
          name="q"
          type="search"
          placeholder="Search by name…"
          defaultValue={query}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No players yet</CardTitle>
            <CardDescription>
              {safeTerm
                ? "No names match your search. Try a different term or clear the filter."
                : "Add opponents and partners you play with to track them here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/players/new">Add your first player</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const availableDays = getAvailableDayAbbrevList(
              p.availability as Record<string, unknown> | null,
            );

            return (
              <li key={p.id} className="min-w-0">
                <Card className="flex h-full min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="min-w-0 pb-3">
                    <div className="flex min-w-0 flex-col gap-2">
                      <CardTitle className="text-lg leading-tight">
                        <Link
                          href={`/players/${p.id}/edit`}
                          className="break-words hover:underline"
                        >
                          {p.name}
                        </Link>
                      </CardTitle>
                      {p.playStyle ? (
                        <Badge
                          variant="secondary"
                          className="h-auto w-fit max-w-full whitespace-normal break-words text-left font-normal leading-snug"
                        >
                          {p.playStyle}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col space-y-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      {p.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                          <span>{p.phone}</span>
                        </div>
                      ) : null}

                      {availableDays.length > 0 ? (
                        <div className="flex items-start gap-2">
                          <CalendarDays
                            className="mt-0.5 h-4 w-4 shrink-0 opacity-70"
                            aria-hidden
                          />
                          <div className="flex flex-wrap gap-1">
                            {availableDays.map((day) => (
                              <span
                                key={day}
                                className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {p.strengths || p.weaknesses ? (
                      <div className="space-y-2 border-t border-border pt-3">
                        {p.strengths ? (
                          <div className="flex items-start gap-2">
                            <Swords
                              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500"
                              aria-hidden
                            />
                            <p className="line-clamp-2">{p.strengths}</p>
                          </div>
                        ) : null}
                        {p.weaknesses ? (
                          <div className="flex items-start gap-2">
                            <ShieldAlert
                              className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                              aria-hidden
                            />
                            <p className="line-clamp-2">{p.weaknesses}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/players/${p.id}/edit`}>Edit player</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
