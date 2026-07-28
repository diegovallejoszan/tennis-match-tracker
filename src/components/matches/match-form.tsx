"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FieldErrors } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { createMatchAction, updateMatchAction } from "@/app/actions/matches";
import { FormValidationAlert } from "@/components/matches/form-validation-alert";
import { MatchAudioNotes } from "@/components/matches/match-audio-notes";
import {
  QuickAddPlayerSheet,
  type QuickAddPlayerRole,
} from "@/components/matches/quick-add-player-sheet";
import { ScoreSegmentsEditor } from "@/components/matches/score-segments-editor";
import { getLiveIntegrityMessages } from "@/lib/match-score/integrity";
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
import { suggestOutcomeFromSegments } from "@/lib/match-score/integrity";
import {
  MATCH_TYPES,
  matchFormSchema,
  OUTCOMES,
  type MatchFormInput,
  type MatchFormValues,
  type MatchType,
} from "@/lib/matches-validation";
import {
  translateKnownError,
  translateKnownErrors,
} from "@/lib/translate-error";

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

const MATCH_TYPE_KEYS: Record<MatchType, "practice" | "singles" | "doubles"> = {
  practice: "practice",
  single: "singles",
  doubles: "doubles",
};

export function MatchForm({
  mode,
  matchId,
  defaultValues,
  players,
  userLocale = "en",
}: MatchFormProps) {
  const router = useRouter();
  const t = useTranslations("matches.form");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [playerList, setPlayerList] = useState(players);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddRole, setQuickAddRole] = useState<QuickAddPlayerRole>("opponent");
  const outcomeUserSetRef = useRef(false);
  const skipSuggestOnceRef = useRef(mode === "edit");

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
      outcomeUserSetRef.current = false;
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

  useEffect(() => {
    if (skipSuggestOnceRef.current) {
      skipSuggestOnceRef.current = false;
      return;
    }
    if (!showCompetitiveFields || !useStructuredScore) return;
    if (outcomeUserSetRef.current) return;

    const suggested = suggestOutcomeFromSegments(scoreSegments ?? []);
    if (suggested !== "" && suggested !== outcome) {
      form.setValue("outcome", suggested);
    }
  }, [
    scoreSegments,
    showCompetitiveFields,
    useStructuredScore,
    outcome,
    form,
  ]);

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
    return getLiveIntegrityMessages({
      outcome:
        outcome === "win" || outcome === "loss"
          ? outcome
          : null,
      segments: scoreSegments ?? [],
    });
  }, [showCompetitiveFields, useStructuredScore, outcome, scoreSegments]);

  const outcomeFieldError =
    attemptedSubmit &&
    typeof form.formState.errors.outcome?.message === "string"
      ? form.formState.errors.outcome.message
      : null;

  const alertMessages = attemptedSubmit
    ? translateKnownErrors(submitErrors, tErrors)
    : [];

  const highlightOutcome =
    liveScoreErrors.length > 0 || Boolean(outcomeFieldError);

  function openQuickAdd(role: QuickAddPlayerRole) {
    setQuickAddRole(role);
    setQuickAddOpen(true);
  }

  function handlePlayerCreated(
    player: { id: string; name: string },
    role: QuickAddPlayerRole,
  ) {
    setPlayerList((current) => {
      if (current.some((entry) => entry.id === player.id)) return current;
      return [...current, player].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
    });

    if (role === "partner") {
      form.setValue("partnerId", player.id);
      const opponents = form.getValues("opponentIds");
      if (opponents.includes(player.id)) {
        form.setValue(
          "opponentIds",
          opponents.filter((id) => id !== player.id),
        );
      }
      return;
    }

    const opponents = form.getValues("opponentIds");
    if (!opponents.includes(player.id)) {
      form.setValue("opponentIds", [...opponents, player.id]);
    }
  }

  function onInvalid(errors: FieldErrors<MatchFormValues>) {
    setAttemptedSubmit(true);
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
    setAttemptedSubmit(false);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMatchAction(values)
          : await updateMatchAction(matchId!, values);

      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }

      router.push("/matches");
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="mx-auto max-w-4xl space-y-6"
      >
        {attemptedSubmit ? (
          <FormValidationAlert
            id="match-form-errors"
            title={t("fixBeforeSaving")}
            messages={alertMessages}
          />
        ) : null}

        {serverError ? (
          <p
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {translateKnownError(serverError, tErrors)}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("date")}</FormLabel>
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
                <FormLabel>{t("timeOptional")}</FormLabel>
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
              <FormLabel>{t("matchType")}</FormLabel>
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
                    {t(MATCH_TYPE_KEYS[type])}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {matchType === "doubles" ? (
          <FormField
            control={form.control}
            name="partnerId"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FormLabel className="!mt-0">{t("partner")}</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openQuickAdd("partner")}
                  >
                    {t("addNewPartner")}
                  </Button>
                </div>
                {playerList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noPlayersPartner")}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {playerList.map((player) => (
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FormLabel className="!mt-0">
                  {matchType === "doubles"
                    ? t("opponents")
                    : matchType === "single"
                      ? t("opponentSingular")
                      : t("opponentsOptional")}
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openQuickAdd("opponent")}
                >
                  {t("addNewOpponent")}
                </Button>
              </div>
              {playerList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noPlayersOpponent")}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {playerList.map((player) => {
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

        <QuickAddPlayerSheet
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          role={quickAddRole}
          onCreated={handlePlayerCreated}
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
                  {t("structuredScore")}
                </FormLabel>
              </FormItem>
            )}
          />
        ) : null}

        {showCompetitiveFields && useStructuredScore ? (
          <ScoreSegmentsEditor
            control={form.control}
            scoreRequired={scoreRequired}
            showValidationErrors={attemptedSubmit}
            liveConflictMessages={liveScoreErrors}
          />
        ) : null}

        {showCompetitiveFields && !useStructuredScore ? (
          <FormField
            control={form.control}
            name="legacyScore"
            render={({ field }) => (
              <FormItem className="max-w-lg">
                <FormLabel>
                  {t("legacyScore")}
                  {scoreRequired ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      {t("legacyRequired")}
                    </span>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      {t("legacyOptional")}
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("legacyPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {generatedPreview ? (
          <p className="text-sm text-muted-foreground">
            {t("displayScore")}{" "}
            <span className="font-mono text-foreground">{generatedPreview}</span>
          </p>
        ) : null}

        {showCompetitiveFields ? (
          <FormField
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("result")}</FormLabel>
                <p className="text-[0.8rem] text-muted-foreground">
                  {t("resultHelp")}
                </p>
                <div
                  className={`flex flex-wrap gap-2 rounded-md p-1 ${
                    highlightOutcome
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
                        onChange={() => {
                          outcomeUserSetRef.current = true;
                          field.onChange(value);
                        }}
                      />
                      {value === "non_finished"
                        ? t("notFinished")
                        : t(value)}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="max-w-2xl">
              <FormLabel>{t("notes")}</FormLabel>
              <p className="text-[0.8rem] text-muted-foreground">
                {t("notesHelp")}
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
                  placeholder={t("notesPlaceholder")}
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
              ? t("saving")
              : mode === "create"
                ? t("createMatch")
                : t("saveAndClose")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/matches">{tCommon("cancel")}</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
