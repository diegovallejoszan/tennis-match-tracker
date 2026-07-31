"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  deleteMatchPrepAdviceAction,
  generateMatchPrepAdviceAction,
  loadSavedMatchPrepAdviceAction,
  regenerateMatchPrepAdviceAction,
} from "@/app/actions/match-prep";
import { AdviceMarkdown } from "@/components/prepare/advice-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavedMatchPrepAdviceSummary } from "@/lib/match-prep/advice-queries";
import { cn } from "@/lib/utils";

export type PreparePlayerOption = { id: string; name: string };

type ActiveAdvice = {
  id: string;
  opponentId: string | null;
  opponentName: string | null;
  plannedMatchDate: string;
  adviceMarkdown: string;
  createdAt: Date;
};

type PrepareClientProps = {
  players: PreparePlayerOption[];
  history: SavedMatchPrepAdviceSummary[];
  initialAdvice: ActiveAdvice | null;
  initialOpponentId?: string;
};

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(iso: string, localeTag: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function PrepareClient({
  players,
  history,
  initialAdvice,
  initialOpponentId,
}: PrepareClientProps) {
  const t = useTranslations("prepare");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [opponentId, setOpponentId] = useState(
    initialOpponentId ?? initialAdvice?.opponentId ?? players[0]?.id ?? "",
  );
  const [plannedMatchDate, setPlannedMatchDate] = useState(
    initialAdvice?.plannedMatchDate ?? todayIsoDate(),
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeAdvice, setActiveAdvice] = useState(initialAdvice);
  const [pendingAction, setPendingAction] = useState<
    "generate" | "regenerate" | "delete" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const filteredHistory = useMemo(() => {
    if (!opponentId) return history;
    return history.filter((h) => h.opponentId === opponentId);
  }, [history, opponentId]);

  function applyAdvice(advice: {
    id: string;
    opponentId: string | null;
    opponentName?: string | null;
    plannedMatchDate: string;
    adviceMarkdown: string;
    createdAt: Date;
  }) {
    setActiveAdvice({
      id: advice.id,
      opponentId: advice.opponentId,
      opponentName: advice.opponentName ?? null,
      plannedMatchDate: advice.plannedMatchDate,
      adviceMarkdown: advice.adviceMarkdown,
      createdAt: advice.createdAt,
    });
    if (advice.opponentId) {
      setOpponentId(advice.opponentId);
    }
    setPlannedMatchDate(advice.plannedMatchDate);
    router.replace(`/prepare?adviceId=${advice.id}`, { scroll: false });
  }

  function onOpponentChange(nextOpponentId: string) {
    setOpponentId(nextOpponentId);
    setServerError(null);
    if (activeAdvice && activeAdvice.opponentId !== nextOpponentId) {
      setActiveAdvice(null);
      router.replace("/prepare", { scroll: false });
    }
  }

  function onGetAdvice() {
    setServerError(null);
    setPendingAction("generate");
    startTransition(async () => {
      const result = await generateMatchPrepAdviceAction({
        opponentId,
        plannedMatchDate,
      });
      setPendingAction(null);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      applyAdvice(result.advice);
      router.refresh();
    });
  }

  function openHistoryItem(item: SavedMatchPrepAdviceSummary) {
    setServerError(null);
    startTransition(async () => {
      const result = await loadSavedMatchPrepAdviceAction(item.id);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      applyAdvice(result.advice);
    });
  }

  function onRegenerate() {
    if (!activeAdvice) return;
    setServerError(null);
    setPendingAction("regenerate");
    startTransition(async () => {
      const result = await regenerateMatchPrepAdviceAction(activeAdvice.id);
      setPendingAction(null);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      applyAdvice(result.advice);
      router.refresh();
    });
  }

  function onDelete() {
    if (!activeAdvice) return;
    if (!window.confirm(t("deleteConfirm"))) return;

    setServerError(null);
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteMatchPrepAdviceAction(activeAdvice.id);
      setPendingAction(null);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setActiveAdvice(null);
      router.replace("/prepare", { scroll: false });
      router.refresh();
    });
  }

  if (players.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
        <p>{t("noPlayers")}</p>
        <Button asChild className="mt-4" variant="outline" size="sm">
          <Link href="/players/new">{t("addPlayer")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prepare-opponent">{t("opponent")}</Label>
            <select
              id="prepare-opponent"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={opponentId}
              onChange={(e) => onOpponentChange(e.target.value)}
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prepare-date">{t("matchDate")}</Label>
            <Input
              id="prepare-date"
              type="date"
              value={plannedMatchDate}
              onChange={(e) => setPlannedMatchDate(e.target.value)}
            />
          </div>

          {serverError ? (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={onGetAdvice}
            disabled={!opponentId || !plannedMatchDate || isPending}
            className="w-full sm:w-auto"
          >
            {pendingAction === "generate" ? t("generating") : t("getAdvice")}
          </Button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">{t("historyTitle")}</h2>
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
          ) : (
            <ul className="space-y-1">
              {filteredHistory.map((item) => {
                const selected = activeAdvice?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openHistoryItem(item)}
                      disabled={isPending}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span className="font-medium">
                        {item.opponentName ?? t("unknownOpponent")}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("historyItemMeta", {
                          date: formatShortDate(item.plannedMatchDate, locale),
                        })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="min-w-0">
        {activeAdvice ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("adviceTitle", {
                    opponent: activeAdvice.opponentName ?? t("unknownOpponent"),
                  })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("adviceSubtitle", {
                    date: formatShortDate(activeAdvice.plannedMatchDate, locale),
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isPending || !activeAdvice.opponentId}
                >
                  {pendingAction === "regenerate"
                    ? t("regenerating")
                    : t("regenerate")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isPending}
                >
                  {pendingAction === "delete"
                    ? t("deleting")
                    : tCommon("delete")}
                </Button>
              </div>
            </div>
            <AdviceMarkdown markdown={activeAdvice.adviceMarkdown} />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {t("advicePlaceholder")}
          </div>
        )}
      </section>
    </div>
  );
}
