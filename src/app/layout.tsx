import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { auth } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import { AppShell } from "@/components/app-shell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  const locale = await getLocale();
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: getSiteUrl(),
    title: {
      default: title,
      template: `%s · ${title}`
    },
    description,
    applicationName: title,
    openGraph: {
      title,
      description,
      siteName: title,
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Invalid session cookie must not crash the shell; user can recover via /auth/recover.
  }
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={plusJakarta.variable}>
      <body className={plusJakarta.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppShell session={session}>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
