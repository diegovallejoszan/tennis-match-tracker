import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { BrandLockup } from "@/components/brand/brand-mark";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ recovered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Ignore invalid session; recover flow may have already cleared cookies.
  }
  const t = await getTranslations("auth.login");
  const tNav = await getTranslations("nav");
  const { recovered } = await searchParams;

  if (session?.user) {
    redirect("/auth/after-login");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
      <BrandLockup label={tNav("brand")} markClassName="h-10 w-10" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          {recovered === "1" ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{t("recovered")}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/auth/after-login" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              {t("button")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
