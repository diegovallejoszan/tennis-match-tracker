"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Target,
  Menu,
  User,
  UserCircle,
  LogOut,
} from "lucide-react";
import type { Session } from "next-auth";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import { isMatchPrepEnabled } from "@/lib/app-phase";

const allNavItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/players", labelKey: "players", icon: Users },
  { href: "/matches", labelKey: "matches", icon: Trophy },
  { href: "/prepare", labelKey: "prepare", icon: Target, requiresMatchPrep: true },
  { href: "/account", labelKey: "account", icon: UserCircle },
] as const;

const navItems = allNavItems.filter(
  (item) => !("requiresMatchPrep" in item && item.requiresMatchPrep) || isMatchPrepEnabled(),
);

function NavLinks({
  className,
  onLinkClick,
}: {
  className?: string;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map(({ href, labelKey, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          {...(onLinkClick !== undefined && { onClick: onLinkClick })}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  );
}

function UserAvatar({ session }: { session: Session | null }) {
  const name = session?.user?.name ?? null;
  const image = session?.user?.image ?? null;
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <Avatar className="h-8 w-8">
      {image ? (
        <AvatarImage src={image} alt={name ?? "User"} />
      ) : null}
      <AvatarFallback className="text-xs">
        {initials ?? <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Link href="/" className="font-semibold text-foreground">
            {t("brand")}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3"
                size="sm"
              >
                <UserAvatar session={session} />
                <span className="text-sm text-muted-foreground">
                  {session?.user?.name ?? t("accountMenu")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">{t("profileSettings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">{t("dashboard")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile header + sheet */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle>
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  {t("brand")}
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <NavLinks onLinkClick={() => setMobileOpen(false)} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <UserAvatar session={session} />
                    {session?.user?.name ?? t("accountMenu")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" onClick={() => setMobileOpen(false)}>
                      {t("profileSettings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      {t("dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        {t("signOut")}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-semibold text-foreground">
          {t("brand")}
        </Link>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("accountMenu")}>
                <UserAvatar session={session} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">{t("profileSettings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">{t("dashboard")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="md:pl-64">{children}</main>
    </div>
  );
}
