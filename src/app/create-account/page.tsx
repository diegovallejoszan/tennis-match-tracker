import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dbColumnsToProfileFormDefaults } from "@/lib/user-profile-validation";

export default async function CreateAccountPage() {
  const session = await auth();

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
          <CardTitle>Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            You’re signed in with Google. Complete your account to start using
            Tennis Match Tracker. Profile details below are optional—you can
            update them anytime under My Account.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              {session.user.name ?? "User"}
            </p>
            <p className="text-muted-foreground">{session.user.email ?? ""}</p>
          </div>
          <ProfileForm variant="onboarding" defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
