import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db";
import { eq } from "drizzle-orm";
import { createAccountAction } from "@/app/actions/create-account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CreateAccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user] = await db
    .select({ onboardingCompletedAt: users.onboardingCompletedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            You’re signed in with Google. Complete your account to start using
            Tennis Match Tracker.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              {session.user.name ?? "User"}
            </p>
            <p className="text-muted-foreground">{session.user.email ?? ""}</p>
          </div>
          <form action={createAccountAction}>
            <Button type="submit" className="w-full" size="lg">
              Create my account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
