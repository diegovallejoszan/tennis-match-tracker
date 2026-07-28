import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  const t = await getTranslations("auth.login");

  if (session?.user) {
    redirect("/auth/after-login");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
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
