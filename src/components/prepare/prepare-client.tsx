"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  generateMatchPrepAdviceAction,
  loadSavedMatchPrepAdviceAction,
} from "@/app/actions/match-prep";
import { AdviceMarkdown } from "@/components/prepare/advice-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavedMatchPrepAdviceSummary } from "@/lib/match-prep/advice-queries";
import { cn } from "@/lib/utils";

export type PreparePlayerOption = { id: string; name: string };

type PrepareClientProps = {
  players: PreparePlayerOption[];
  history: SavedMatchPrepAdviceSummary[];
  initialAdvice: {
    id: string;
    opponentId: string | null;
    opponentName: string | null;
    plannedMatchDate: string;
    adviceMarkdown: string;
    createdAt: Date;
  } | null;
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
  const [isPending, startTransition] = useTransition();

  const filteredHistory = useMemo(() => {
    if (!opponentId) return history;
    return history.filter((h) => h.opponentId === opponentId);
  }, [history, opponentId]);

  function onGetAdvice() {
    setServerError(null);
    startTransition(async () => {
      const result = await generateMatchPrepAdviceAction({
        opponentId,
        plannedMatchDate,
      });
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setActiveAdvice({
        id: result.advice.id,
        opponentId: result.advice.opponentId,
        opponentName: result.advice.opponentName ?? null,
        plannedMatchDate: result.advice.plannedMatchDate,
        adviceMarkdown: result.advice.adviceMarkdown,
        createdAt: result.advice.createdAt,
      });
      router.replace(`/prepare?adviceId=${result.advice.id}`, { scroll: false });
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
      setActiveAdvice({
        id: result.advice.id,
        opponentId: result.advice.opponentId,
        opponentName: result.advice.opponentName ?? null,
        plannedMatchDate: result.advice.plannedMatchDate,
        adviceMarkdown: result.advice.adviceMarkdown,
        createdAt: result.advice.createdAt,
      });
      if (result.advice.opponentId) {
        setOpponentId(result.advice.opponentId);
      }
      setPlannedMatchDate(result.advice.plannedMatchDate);
      router.replace(`/prepare?adviceId=${result.advice.id}`, { scroll: false });
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
              onChange={(e) => setOpponentId(e.target.value)}
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
            {isPending ? t("generating") : t("getAdvice")}
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
