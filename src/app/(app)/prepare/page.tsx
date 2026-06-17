import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db, players } from "@/db";
import { and, asc, eq } from "drizzle-orm";
import { MatchPrep } from "@/components/prepare/match-prep";

export default function PreparePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Prepare</h1>
      <PrepareContent />
    </div>
  );
}

async function PrepareContent() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please sign in to prepare for matches.
        </CardContent>
      </Card>
    );
  }

  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      playStyle: players.playStyle,
      strengths: players.strengths,
      weaknesses: players.weaknesses,
      notes: players.notes,
    })
    .from(players)
    .where(and(eq(players.userId, userId)))
    .orderBy(asc(players.name));

  return <MatchPrep opponents={rows} />;
}
