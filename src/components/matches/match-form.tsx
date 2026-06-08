"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { FieldErrors } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { createMatchAction, updateMatchAction } from "@/app/actions/matches";
import { FormValidationAlert } from "@/components/matches/form-validation-alert";
import { MatchAudioNotes } from "@/components/matches/match-audio-notes";
import { ScoreSegmentsEditor } from "@/components/matches/score-segments-editor";
import { checkMatchIntegrity } from "@/lib/match-score/integrity";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatScoreFromSegments } from "@/lib/match-score";
import type { AppLocale } from "@/lib/locale";
import {
  MATCH_TYPES,
  matchFormSchema,
  OUTCOMES,
  type MatchFormInput,
  type MatchFormValues,
  type MatchOutcome,
} from "@/lib/matches-validation";

function collectFormErrors(errors: FieldErrors<MatchFormValues>): string[] {
  const messages: string[] = [];

  function walk(value: unknown): void {
    if (!value || typeof value !== "object") return;
    if (
      "message" in value &&
      typeof (value as { message?: unknown }).message === "string"
    ) {
      const message = (value as { message: string }).message;
      if (!messages.includes(message)) messages.push(message);
      return;
    }
    for (const nested of Object.values(value)) {
      walk(nested);
    }
  }

  walk(errors);
  return messages;
}

type MatchFormProps = {
  mode: "create" | "edit";
  matchId?: string;
  defaultValues: MatchFormInput;
  players: Array<{ id: string; name: string }>;
  userLocale?: AppLocale;
};

const matchTypeLabels: Record<(typeof MATCH_TYPES)[number], string> = {
  practice: "Practice",
  single: "Single",
  doubles: "Doubles",
};

const outcomeLabels: Record<(typeof OUTCOMES)[number], string> = {
  win: "Win",
  loss: "Loss",
  non_finished: "Not finished",
};

export function MatchForm({
  mode,
  matchId,
  defaultValues,
  players,
  userLocale = "en",
}: MatchFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues,
  });

  const matchType = useWatch({ control: form.control, name: "matchType" });
  const partnerId = useWatch({ control: form.control, name: "partnerId" });
  const outcome = useWatch({ control: form.control, name: "outcome" });
  const useStructuredScore = useWatch({
    control: form.control,
    name: "useStructuredScore",
  });
  const scoreSegments = useWatch({ control: form.control, name: "scoreSegments" });

  useEffect(() => {
    if (matchType !== "doubles") {
      form.setValue("partnerId", "");
    }
    if (matchType === "practice") {
      form.setValue("outcome", "");
    }
  }, [matchType, form]);

  useEffect(() => {
    if (partnerId === "") return;
    const current = form.getValues("opponentIds");
    if (current.includes(partnerId)) {
      form.setValue(
        "opponentIds",
        current.filter((id) => id !== partnerId),
      );
    }
  }, [partnerId, form]);

  const showCompetitiveFields =
    matchType === "single" || matchType === "doubles";
  const scoreRequired =
    showCompetitiveFields &&
    outcome !== "non_finished" &&
    (outcome === "win" || outcome === "loss");
  const generatedPreview =
    useStructuredScore && (scoreSegments?.length ?? 0) > 0
      ? formatScoreFromSegments(scoreSegments ?? [])
      : null;

  const liveScoreErrors = useMemo(() => {
    if (!showCompetitiveFields || !useStructuredScore) return [];
    if (outcome !== "win" && outcome !== "loss") return [];
    return checkMatchIntegrity({
      outcome: outcome as MatchOutcome,
      segments: scoreSegments ?? [],
    })
      .filter((issue) => issue.severity === "error")
      .map((issue) => issue.message);
  }, [showCompetitiveFields, useStructuredScore, outcome, scoreSegments]);

  const outcomeFieldError =
    typeof form.formState.errors.outcome?.message === "string"
      ? form.formState.errors.outcome.message
      : null;

  const alertMessages =
    liveScoreErrors.length > 0 ? liveScoreErrors : submitErrors;

  function onInvalid(errors: FieldErrors<MatchFormValues>) {
    const messages = collectFormErrors(errors);
    setSubmitErrors(messages);
    requestAnimationFrame(() => {
      document
        .getElementById("match-form-errors")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onSubmit(values: MatchFormValues) {
    setServerError(null);
    setSubmitErrors([]);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMatchAction(values)
          : await updateMatchAction(matchId!, values);

      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }

      router.push(mode === "create" ? "/matches" : `/matches/${matchId}`);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="mx-auto max-w-4xl space-y-6"
      >
        <FormValidationAlert
          id="match-form-errors"
          messages={alertMessages}
        />

        {serverError ? (
          <p
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="matchType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match type</FormLabel>
              <div className="flex flex-wrap gap-2">
                {MATCH_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={type}
                      checked={field.value === type}
                      onChange={field.onChange}
                    />
                    {matchTypeLabels[type]}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCompetitiveFields ? (
          <FormField
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Result</FormLabel>
                <div
                  className={`flex flex-wrap gap-2 rounded-md p-1 ${
                    outcomeFieldError
                      ? "ring-2 ring-destructive/60 ring-offset-2"
                      : ""
                  }`}
                >
                  {OUTCOMES.map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                      />
                      {outcomeLabels[value]}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {matchType === "doubles" ? (
          <FormField
            control={form.control}
            name="partnerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partner</FormLabel>
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add players first to select a partner.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {players.map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="partnerId"
                          value={player.id}
                          checked={field.value === player.id}
                          onChange={() => field.onChange(player.id)}
                        />
                        <span>{player.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="opponentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {matchType === "doubles"
                  ? "Opponents"
                  : matchType === "single"
                    ? "Opponent(s)"
                    : "Opponents (optional)"}
              </FormLabel>
              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No players yet. Add players first to tag opponents in matches.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {players.map((player) => {
                    const checked = field.value.includes(player.id);
                    const disabledForPartner =
                      matchType === "doubles" &&
                      partnerId !== "" &&
                      player.id === partnerId;
                    return (
                      <label
                        key={player.id}
                        className={`flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm ${
                          disabledForPartner
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabledForPartner}
                          onCheckedChange={(next) => {
                            if (disabledForPartner) return;
                            if (next) {
                              field.onChange([...field.value, player.id]);
                              return;
                            }
                            field.onChange(
                              field.value.filter((id) => id !== player.id),
                            );
                          }}
                        />
                        <span>{player.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {showCompetitiveFields ? (
          <FormField
            control={form.control}
            name="useStructuredScore"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <FormLabel className="!mt-0 font-normal">
                  Register score segment by segment (recommended)
                </FormLabel>
              </FormItem>
            )}
          />
        ) : null}

        {showCompetitiveFields && useStructuredScore ? (
          <ScoreSegmentsEditor control={form.control} />
        ) : null}

        {showCompetitiveFields && !useStructuredScore ? (
          <FormField
            control={form.control}
            name="legacyScore"
            render={({ field }) => (
              <FormItem className="max-w-lg">
                <FormLabel>
                  Score (legacy text)
                  {scoreRequired ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      (required)
                    </span>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      (optional for not finished)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 6-4 6-3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {generatedPreview ? (
          <p className="text-sm text-muted-foreground">
            Display score:{" "}
            <span className="font-mono text-foreground">{generatedPreview}</span>
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="max-w-2xl">
              <FormLabel>Notes</FormLabel>
              <p className="text-[0.8rem] text-muted-foreground">
                Learnings, observations, or anything else worth remembering about
                this match.
              </p>
              <MatchAudioNotes
                locale={userLocale}
                onTranscript={(text) => {
                  const current = field.value.trim();
                  field.onChange(
                    current ? `${current}\n\n${text}` : text,
                  );
                }}
              />
              <FormControl>
                <Textarea
                  placeholder="Optional"
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : mode === "create"
                ? "Create match"
                : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/matches">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
