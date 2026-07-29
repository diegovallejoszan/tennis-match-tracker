import { auth } from "@/lib/auth";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { isAppLocale, localeLabels, type AppLocale } from "@/lib/locale";
import { dbColumnsToProfileFormDefaults } from "@/lib/user-profile-validation";
import { getUserLocale } from "@/lib/user-locale-db";

type AccountPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("account");
  const tCommon = await getTranslations("common");
  const { edit } = await searchParams;
  const isEditing = edit === "1";

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {isEditing ? (
          <Button variant="outline" asChild>
            <Link href="/account">{tCommon("cancel")}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/account?edit=1">{tCommon("edit")}</Link>
          </Button>
        )}
      </div>

      <div className="flex max-w-xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("languageTitle")}</CardTitle>
            <CardDescription>{t("languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <LocaleSettings currentLocale={locale} />
            ) : (
              <p className="text-sm">{localeLabels[locale]}</p>
            )}
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
            {isEditing ? (
              <ProfileForm
                variant="settings"
                defaultValues={defaultValues}
                cancelHref="/account"
              />
            ) : (
              <dl className="space-y-5">
                {[
                  [t("playStyle"), defaultValues.playStyle],
                  [t("strengths"), defaultValues.strengths],
                  [t("weaknesses"), defaultValues.weaknesses],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm font-medium">{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {value || t("notProvided")}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
