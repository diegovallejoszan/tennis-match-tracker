"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
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
  collapsed = false,
}: {
  className?: string;
  onLinkClick?: () => void;
  collapsed?: boolean;
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
          title={collapsed ? t(labelKey) : undefined}
          aria-label={collapsed ? t(labelKey) : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "justify-center px-2",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed ? t(labelKey) : null}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSidebarCollapsed(
        window.localStorage.getItem("desktop-sidebar-collapsed") === "true",
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "desktop-sidebar-collapsed",
        String(next),
      );
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center gap-2 border-b border-border px-3",
            sidebarCollapsed && "justify-center px-2",
          )}
        >
          {!sidebarCollapsed ? (
            <Link href="/" className="min-w-0 truncate font-semibold text-foreground">
              {t("brand")}
            </Link>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", !sidebarCollapsed && "ml-auto")}
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
            }
            title={
              sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks collapsed={sidebarCollapsed} />
        </div>
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full gap-3",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start px-3",
                )}
                size="sm"
                aria-label={sidebarCollapsed ? t("accountMenu") : undefined}
                title={sidebarCollapsed ? t("accountMenu") : undefined}
              >
                <UserAvatar session={session} />
                {!sidebarCollapsed ? (
                  <span className="truncate text-sm text-muted-foreground">
                    {session?.user?.name ?? t("accountMenu")}
                  </span>
                ) : null}
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
      <main
        className={cn(
          "transition-[padding] duration-200",
          sidebarCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {children}
      </main>
    </div>
  );
}
