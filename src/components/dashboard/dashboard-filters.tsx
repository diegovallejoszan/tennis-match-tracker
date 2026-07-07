import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardFilters } from "@/lib/dashboard-aggregates";

type OpponentOption = { id: string; name: string };

type DashboardFiltersFormProps = {
  filters: DashboardFilters;
  opponents: OpponentOption[];
};

export async function DashboardFiltersForm({
  filters,
  opponents,
}: DashboardFiltersFormProps) {
  const t = await getTranslations("dashboard.filters");

  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.matchType ||
      filters.opponentId ||
      (filters.completionStatus && filters.completionStatus !== "all"),
  );

  return (
    <form
      method="get"
      className="mb-6 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
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
}
