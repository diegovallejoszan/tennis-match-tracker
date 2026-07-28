import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  const t = await getTranslations("auth.landing");

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 md:p-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t("description")}
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/auth/after-login" });
          }}
        >
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t("signIn")}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
