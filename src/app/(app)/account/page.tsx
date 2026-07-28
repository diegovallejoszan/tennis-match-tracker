import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

import { LocaleSettings } from "@/components/account/locale-settings";
import { ProfileForm } from "@/components/account/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import { dbColumnsToProfileFormDefaults } from "@/lib/user-profile-validation";
import { getUserLocale } from "@/lib/user-locale-db";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("account");
  const tCommon = await getTranslations("common");

  const [userRows, localeRaw] = await Promise.all([
    db
      .select({
        name: users.name,
        email: users.email,
        profilePlayStyle: users.profilePlayStyle,
        profileStrengths: users.profileStrengths,
        profileWeaknesses: users.profileWeaknesses,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    getUserLocale(session.user.id),
  ]);

  const user = userRows[0];
  if (!user) redirect("/login");

  const locale: AppLocale = isAppLocale(localeRaw) ? localeRaw : "en";

  const defaultValues = dbColumnsToProfileFormDefaults({
    profilePlayStyle: user.profilePlayStyle,
    profileStrengths: user.profileStrengths,
    profileWeaknesses: user.profileWeaknesses,
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>

      <div className="flex max-w-xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("languageTitle")}</CardTitle>
            <CardDescription>{t("languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LocaleSettings currentLocale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profileTitle")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium text-foreground">
                {user.name ?? tCommon("user")}
              </p>
              <p className="text-muted-foreground">{user.email ?? ""}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("googleIdentityHint")}
              </p>
            </div>
            <ProfileForm variant="settings" defaultValues={defaultValues} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
