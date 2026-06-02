"use client";

import { useTransition } from "react";

import { updateLocaleAction } from "@/app/actions/user-preferences";
import { Button } from "@/components/ui/button";
import { localeLabels, type AppLocale } from "@/lib/locale";
import { SUPPORTED_LOCALES } from "@/db/schema/user-preferences";

type LocaleSettingsProps = {
  currentLocale: AppLocale;
};

export function LocaleSettings({ currentLocale }: LocaleSettingsProps) {
  const [isPending, startTransition] = useTransition();

  function onSelect(locale: AppLocale) {
    startTransition(async () => {
      await updateLocaleAction({ locale });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SUPPORTED_LOCALES.map((locale) => (
        <Button
          key={locale}
          type="button"
          size="sm"
          variant={currentLocale === locale ? "default" : "outline"}
          disabled={isPending || currentLocale === locale}
          onClick={() => onSelect(locale)}
        >
          {localeLabels[locale]}
        </Button>
      ))}
    </div>
  );
}
