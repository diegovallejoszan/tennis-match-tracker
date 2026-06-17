"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  classifyOpponentTypeFromText,
  getMatchPrepTactics,
  type MatchPrepContext,
} from "@/lib/match-prep/generator";
import { getTacticSourceById } from "@/lib/match-prep/sources";
import type { CourtSurface, MatchFormat, PlayerLevel } from "@/lib/match-prep/tactics";
import { WINNING_UGLY_GAME_PLAN_QUESTIONS } from "@/lib/match-prep/winning-ugly";

const winningUglySource = getTacticSourceById("winning-ugly-gilbert");

export type PrepareOpponent = {
  id: string;
  name: string;
  playStyle: string | null;
  strengths: string | null;
  weaknesses: string | null;
  notes: string | null;
};

const opponentTypeLabels: Record<string, string> = {
  aggressive_baseliner: "Aggressive baseliner",
  counterpuncher: "Counterpuncher",
  serve_and_volleyer: "Serve & volleyer / net rusher",
  all_court_player: "All-court player",
  moonballer_retriever: "Moonballer / retriever",
};

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}

export function MatchPrep({ opponents }: { opponents: PrepareOpponent[] }) {
  const [opponentId, setOpponentId] = useState<string>(opponents[0]?.id ?? "");
  const [format, setFormat] = useState<MatchFormat>("singles");
  const [surface, setSurface] = useState<CourtSurface>("unknown");
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>("unknown");

  const opponent = useMemo(
    () => opponents.find((o) => o.id === opponentId) ?? null,
    [opponentId, opponents],
  );

  const classifiedOpponentType = useMemo(() => {
    const fromText = classifyOpponentTypeFromText(opponent?.playStyle ?? "");
    return fromText ?? "all_court_player";
  }, [opponent?.playStyle]);

  const ctx: MatchPrepContext = useMemo(
    () => ({
      opponentType: classifiedOpponentType,
      format,
      surface,
      playerLevel,
    }),
    [classifiedOpponentType, format, surface, playerLevel],
  );

  const tactics = useMemo(() => getMatchPrepTactics(ctx), [ctx]);

  if (opponents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No opponents yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add at least one player to generate match-prep recommendations.
          </p>
          <Button asChild>
            <Link href="/players/new">Add a player</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Match preparation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Opponent" value={opponentId} onChange={setOpponentId}>
              {opponents.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Format"
              value={format}
              onChange={(v) => setFormat(v as MatchFormat)}
            >
              <option value="singles">Singles</option>
              <option value="doubles">Doubles</option>
            </SelectField>

            <SelectField
              label="Surface"
              value={surface}
              onChange={(v) => setSurface(v as CourtSurface)}
            >
              <option value="unknown">Unknown</option>
              <option value="hard">Hard</option>
              <option value="clay">Clay</option>
              <option value="grass">Grass</option>
              <option value="indoor">Indoor</option>
            </SelectField>

            <SelectField
              label="Your level"
              value={playerLevel}
              onChange={(v) => setPlayerLevel(v as PlayerLevel)}
            >
              <option value="unknown">Unknown</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </SelectField>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Detected archetype:</span>
              <Badge variant="secondary">
                {opponentTypeLabels[classifiedOpponentType] ?? "All-court player"}
              </Badge>
              {opponent?.playStyle ? (
                <span className="text-muted-foreground">
                  (from play style: “{opponent.playStyle}”)
                </span>
              ) : (
                <span className="text-muted-foreground">
                  (no play style saved; using a general plan)
                </span>
              )}
            </div>

            {opponent?.strengths || opponent?.weaknesses ? (
              <div className="grid gap-2 md:grid-cols-2">
                {opponent?.strengths ? (
                  <div>
                    <div className="font-medium">Their strengths</div>
                    <div className="text-muted-foreground">{opponent.strengths}</div>
                  </div>
                ) : null}
                {opponent?.weaknesses ? (
                  <div>
                    <div className="font-medium">Their weaknesses</div>
                    <div className="text-muted-foreground">{opponent.weaknesses}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Winning Ugly — pre-match checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            From Brad Gilbert&apos;s{" "}
            <em>Winning Ugly</em> (paraphrased). Use these at changeovers to stay on plan.
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            {WINNING_UGLY_GAME_PLAN_QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Source:</span>{" "}
            <a
              href={winningUglySource.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {winningUglySource.organization} — {winningUglySource.title}
            </a>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {tactics.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No tactics matched</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Try setting Surface/Format back to “Unknown/Singles” or update the player’s
                play style text to something like “aggressive baseliner”, “retriever”,
                “speedster”, or “serve and volley”.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/players/${opponentId}/edit`}>Edit opponent</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          tactics.map((t) => (
            <Card key={t.id} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{t.situation.replaceAll("_", " ")}</Badge>
                    <Badge variant={t.citation.trustTier === "tier1" ? "secondary" : "outline"}>
                      {t.citation.trustTier === "tier1" ? "Tier 1 source" : "Tier 2 source"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">What to do</div>
                  <p className="text-muted-foreground">{t.recommendation}</p>
                </div>
                <div>
                  <div className="font-medium">Why it works</div>
                  <p className="text-muted-foreground">{t.whyItWorks}</p>
                </div>
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Source:</span>{" "}
                  <a
                    href={t.citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {t.citation.organization} — {t.citation.title}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

