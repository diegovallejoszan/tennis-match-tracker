import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { deletePlayerAction } from "@/app/actions/players";
import { PlayerForm } from "@/components/players/player-form";
import { Button } from "@/components/ui/button";
import { db, players } from "@/db";
import { and, eq } from "drizzle-orm";
import {
  defaultPlayerFormValues,
  jsonToAvailability,
} from "@/lib/players-validation";

type EditPlayerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [row] = await db
    .select()
    .from(players)
    .where(and(eq(players.id, id), eq(players.userId, session.user.id)))
    .limit(1);

  if (!row) notFound();

  const defaults = {
    ...defaultPlayerFormValues(),
    name: row.name,
    phone: row.phone ?? "",
    playStyle: row.playStyle ?? "",
    strengths: row.strengths ?? "",
    weaknesses: row.weaknesses ?? "",
    notes: row.notes ?? "",
    availability: jsonToAvailability(row.availability),
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/players">← Back</Link>
          </Button>
          <h1 className="text-2xl font-semibold">Edit player</h1>
        </div>
        <form action={deletePlayerAction.bind(null, row.id)} className="sm:ml-auto">
          <Button type="submit" variant="destructive" size="sm">
            Delete player
          </Button>
        </form>
      </div>
      <PlayerForm mode="edit" playerId={row.id} defaultValues={defaults} />
    </div>
  );
}
