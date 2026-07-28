import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { asc, eq } from "drizzle-orm";

import { MatchForm } from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import { db, players } from "@/db";
import { auth } from "@/lib/auth";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import { defaultMatchFormValues } from "@/lib/matches-validation";
import { getUserLocale } from "@/lib/user-locale-db";

export default async function NewMatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("matches");
  const tCommon = await getTranslations("common");

  const [playerRows, locale] = await Promise.all([
    db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.userId, session.user.id))
      .orderBy(asc(players.name)),
    getUserLocale(session.user.id),
  ]);

  const userLocale: AppLocale = isAppLocale(locale) ? locale : "en";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/matches">← {tCommon("back")}</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{t("newMatchTitle")}</h1>
      </div>
      <MatchForm
        mode="create"
        defaultValues={defaultMatchFormValues()}
        players={playerRows}
        userLocale={userLocale}
      />
    </div>
  );
}
