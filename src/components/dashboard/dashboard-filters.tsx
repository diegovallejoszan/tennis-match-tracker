"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardFilters } from "@/lib/dashboard-aggregates";
import { cn } from "@/lib/utils";

type OpponentOption = { id: string; name: string };

type DashboardFiltersFormProps = {
  filters: DashboardFilters;
  opponents: OpponentOption[];
};

export function DashboardFiltersForm({
  filters,
  opponents,
}: DashboardFiltersFormProps) {
  const t = useTranslations("dashboard.filters");

  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.matchType ||
      filters.opponentId ||
      (filters.completionStatus && filters.completionStatus !== "all"),
  );

  const [mobileOpen, setMobileOpen] = useState(hasFilters);

  const formFields = (
    <form
      method="get"
      className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      <label className="space-y-1 text-sm">
        <span>{t("from")}</span>
        <Input type="date" name="from" defaultValue={filters.from ?? ""} />
      </label>
      <label className="space-y-1 text-sm">
        <span>{t("to")}</span>
        <Input type="date" name="to" defaultValue={filters.to ?? ""} />
      </label>
      <label className="space-y-1 text-sm">
        <span>{t("matchType")}</span>
        <select
          name="matchType"
          defaultValue={filters.matchType ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("allTypes")}</option>
          <option value="practice">{t("practice")}</option>
          <option value="single">{t("singles")}</option>
          <option value="doubles">{t("doubles")}</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span>{t("opponent")}</span>
        <select
          name="opponentId"
          defaultValue={filters.opponentId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("allOpponents")}</option>
          {opponents.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span>{t("completion")}</span>
        <select
          name="completionStatus"
          defaultValue={filters.completionStatus ?? "all"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t("allStatuses")}</option>
          <option value="finished">{t("finishedOnly")}</option>
          <option value="non_finished">{t("notFinishedOnly")}</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit" variant="secondary" className="flex-1">
          {t("apply")}
        </Button>
        {hasFilters ? (
          <Button variant="ghost" asChild>
            <Link href="/dashboard">{t("clear")}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="mb-6">
      {/* Mobile: compact toggle */}
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
          {t("toggle")}
          {hasFilters ? (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
              {t("active")}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              mobileOpen && "rotate-180",
            )}
          />
        </Button>
        {mobileOpen ? <div className="mt-2">{formFields}</div> : null}
      </div>

      {/* Desktop: always visible */}
      <div className="hidden md:block">{formFields}</div>
    </div>
  );
}
