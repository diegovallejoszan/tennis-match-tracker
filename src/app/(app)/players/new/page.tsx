import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { PlayerForm } from "@/components/players/player-form";
import { Button } from "@/components/ui/button";
import { defaultPlayerFormValues } from "@/lib/players-validation";

export default async function NewPlayerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("players");
  const tCommon = await getTranslations("common");

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/players">← {tCommon("back")}</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{t("newPlayer")}</h1>
      </div>
      <PlayerForm mode="create" defaultValues={defaultPlayerFormValues()} />
    </div>
  );
}
