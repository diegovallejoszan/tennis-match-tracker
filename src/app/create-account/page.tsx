import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db, users } from "@/db";

import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dbColumnsToProfileFormDefaults } from "@/lib/user-profile-validation";

export default async function CreateAccountPage() {
  const session = await auth();
  const t = await getTranslations("auth.onboarding");
  const tCommon = await getTranslations("common");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user] = await db
    .select({
      onboardingCompletedAt: users.onboardingCompletedAt,
      profilePlayStyle: users.profilePlayStyle,
      profileStrengths: users.profileStrengths,
      profileWeaknesses: users.profileWeaknesses,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  if (!user) {
    redirect("/login");
  }

  const defaultValues = dbColumnsToProfileFormDefaults({
    profilePlayStyle: user.profilePlayStyle,
    profileStrengths: user.profileStrengths,
    profileWeaknesses: user.profileWeaknesses,
  });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              {session.user.name ?? tCommon("user")}
            </p>
            <p className="text-muted-foreground">{session.user.email ?? ""}</p>
          </div>
          <ProfileForm variant="onboarding" defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
