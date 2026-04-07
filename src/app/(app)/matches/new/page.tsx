import Link from "next/link";
import { redirect } from "next/navigation";

import { asc, eq } from "drizzle-orm";

import { MatchForm } from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import { db, players } from "@/db";
import { auth } from "@/lib/auth";
import { defaultMatchFormValues } from "@/lib/matches-validation";

export default async function NewMatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const playerRows = await db
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(eq(players.userId, session.user.id))
    .orderBy(asc(players.name));

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/matches">← Back</Link>
        </Button>
        <h1 className="text-2xl font-semibold">New match</h1>
      </div>
      <MatchForm
        mode="create"
        defaultValues={defaultMatchFormValues()}
        players={playerRows}
      />
    </div>
  );
}
