import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
      <h1 className="mb-6 text-2xl font-semibold">My Account</h1>

      <div className="flex max-w-xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Used for speech-to-text on match notes and for AI recommendations
              in a later update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocaleSettings currentLocale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your play style, strengths, and weaknesses help contextualize match
              prep and notes. All fields are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium text-foreground">{user.name ?? "User"}</p>
              <p className="text-muted-foreground">{user.email ?? ""}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Name and email come from Google. To change them, update your
                Google account.
              </p>
            </div>
            <ProfileForm variant="settings" defaultValues={defaultValues} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
