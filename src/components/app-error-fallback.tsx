"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type AppErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function AppErrorFallback({ error, reset }: AppErrorFallbackProps) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("description")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          {t("tryAgain")}
        </Button>
        <Button asChild>
          <a href="/auth/recover">{t("signInAgain")}</a>
        </Button>
      </div>
    </div>
  );
}
