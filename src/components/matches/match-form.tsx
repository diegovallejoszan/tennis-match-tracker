"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { createMatchAction, updateMatchAction } from "@/app/actions/matches";
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
import {
  MATCH_TYPES,
  matchFormSchema,
  OUTCOMES,
  type MatchFormInput,
  type MatchFormValues,
} from "@/lib/matches-validation";

type MatchFormProps = {
  mode: "create" | "edit";
  matchId?: string;
  defaultValues: MatchFormInput;
  players: Array<{ id: string; name: string }>;
};

const matchTypeLabels: Record<(typeof MATCH_TYPES)[number], string> = {
  practice: "Practice",
  single: "Single",
  doubles: "Doubles",
};

const outcomeLabels: Record<(typeof OUTCOMES)[number], string> = {
  win: "Win",
  loss: "Loss",
};

export function MatchForm({
  mode,
  matchId,
  defaultValues,
  players,
}: MatchFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues,
  });

  const matchType = useWatch({ control: form.control, name: "matchType" });
  const partnerId = useWatch({ control: form.control, name: "partnerId" });

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
  const scoreRequired = showCompetitiveFields;

  function onSubmit(values: MatchFormValues) {
    setServerError(null);
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
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-4xl space-y-6"
      >
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
                <div className="flex flex-wrap gap-2">
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

        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>
                Score
                {scoreRequired ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (required)
                  </span>
                ) : (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (optional)
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
