import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 md:p-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          Tennis Match Tracker
        </h1>
        <p className="mb-8 text-muted-foreground">
          Track your matches, manage opponents and partners, and build your
          game with learning-first stats and AI-ready preparation.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/auth/after-login" });
          }}
        >
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Sign in with Google
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Use your Google account to sign in. New users create an account on
          first sign-in.
        </p>
      </div>
    </div>
  );
}
