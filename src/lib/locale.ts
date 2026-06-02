import type { AppLocale } from "@/db/schema/user-preferences";
import { SUPPORTED_LOCALES } from "@/db/schema/user-preferences";

export { SUPPORTED_LOCALES, type AppLocale };

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tag for Web Speech API and similar browser STT. */
export function speechRecognitionLang(locale: AppLocale): string {
  return locale === "es" ? "es-ES" : "en-US";
}

export function resolveLocale(
  persisted: string | null | undefined,
  acceptLanguage?: string | null,
): AppLocale {
  if (persisted && isAppLocale(persisted)) return persisted;
  if (acceptLanguage?.toLowerCase().startsWith("es")) return "es";
  return "en";
}

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
};
