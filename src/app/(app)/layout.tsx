import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user] = await db
    .select({ onboardingCompletedAt: users.onboardingCompletedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.onboardingCompletedAt) {
    redirect("/create-account");
  }

  return <>{children}</>;
}
