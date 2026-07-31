import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { asc, eq } from "drizzle-orm";

import { PrepareClient } from "@/components/prepare/prepare-client";
import { db, players } from "@/db";
import { isMatchPrepEnabled } from "@/lib/app-phase";
import { auth } from "@/lib/auth";
import {
  getMatchPrepAdviceById,
  listMatchPrepAdviceForUser,
} from "@/lib/match-prep/advice-queries";

type PreparePageProps = {
  searchParams: Promise<{ adviceId?: string; opponentId?: string }>;
};

/**
 * Match preparation (Phase 5c): opponent + date → LLM advice with knowledge-base context.
 */
export default async function PreparePage({ searchParams }: PreparePageProps) {
  if (!isMatchPrepEnabled()) {
    redirect("/dashboard");
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("prepare");
  const params = await searchParams;

  const [playerRows, history, selectedAdvice] = await Promise.all([
    db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.userId, session.user.id))
      .orderBy(asc(players.name)),
    listMatchPrepAdviceForUser(session.user.id),
    params.adviceId
      ? getMatchPrepAdviceById(session.user.id, params.adviceId)
      : Promise.resolve(null),
  ]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <PrepareClient
        players={playerRows}
        history={history}
        initialAdvice={
          selectedAdvice
            ? {
                id: selectedAdvice.id,
                opponentId: selectedAdvice.opponentId,
                opponentName: selectedAdvice.opponentName,
                plannedMatchDate: selectedAdvice.plannedMatchDate,
                adviceMarkdown: selectedAdvice.adviceMarkdown,
                createdAt: selectedAdvice.createdAt,
              }
            : null
        }
        {...(params.opponentId ? { initialOpponentId: params.opponentId } : {})}
      />
    </div>
  );
}
