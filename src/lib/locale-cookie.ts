export const LOCALE_COOKIE = "app_locale";

export function isAppLocale(value: string | undefined | null): value is "en" | "es" {
  return value === "en" || value === "es";
}
