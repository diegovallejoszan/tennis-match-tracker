"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MatchesFiltersProps = {
  filters: {
    type: string;
    from: string;
    to: string;
    opponentId: string;
  };
  players: Array<{ id: string; name: string }>;
};

export function MatchesFilters({ filters, players }: MatchesFiltersProps) {
  const t = useTranslations("matches");
  const tCommon = useTranslations("common");
  const hasFilters = Boolean(
    filters.type || filters.from || filters.to || filters.opponentId,
  );
  const [mobileOpen, setMobileOpen] = useState(hasFilters);

  const form = (
    <form
      method="get"
      className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-4"
    >
      <label className="space-y-1 text-sm">
        <span>{t("type")}</span>
        <select
          name="type"
          defaultValue={filters.type}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">{tCommon("all")}</option>
          <option value="practice">{tCommon("practice")}</option>
          <option value="single">{tCommon("singles")}</option>
          <option value="doubles">{tCommon("doubles")}</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>{tCommon("from")}</span>
        <Input type="date" name="from" defaultValue={filters.from} />
      </label>

      <label className="space-y-1 text-sm">
        <span>{tCommon("to")}</span>
        <Input type="date" name="to" defaultValue={filters.to} />
      </label>

      <label className="space-y-1 text-sm">
        <span>{t("playerFilter")}</span>
        <select
          name="opponentId"
          defaultValue={filters.opponentId}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">{tCommon("all")}</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 md:col-span-4">
        <Button type="submit" variant="secondary">
          {tCommon("applyFilters")}
        </Button>
        {hasFilters ? (
          <Button variant="ghost" asChild>
            <Link href="/matches">{tCommon("clear")}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="mb-6">
      <div className="md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filters.toggle")}
          {hasFilters ? (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
              {t("filters.active")}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              mobileOpen && "rotate-180",
            )}
          />
        </Button>
        {mobileOpen ? <div className="mt-2">{form}</div> : null}
      </div>

      <div className="hidden md:block">{form}</div>
    </div>
  );
}
