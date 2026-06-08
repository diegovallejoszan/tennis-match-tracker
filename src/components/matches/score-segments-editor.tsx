"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { FormValidationAlert } from "@/components/matches/form-validation-alert";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  defaultSegment,
  formatScoreFromSegments,
  segmentTypeLabel,
} from "@/lib/match-score";
import { SEGMENT_TYPES } from "@/lib/match-score/types";
import type { MatchFormValues } from "@/lib/matches-validation";

type ScoreSegmentsEditorProps = {
  control: Control<MatchFormValues>;
};

/**
 * Numeric score input tuned for mobile: shows an empty field with a "0"
 * placeholder instead of a literal 0 the user has to delete, opens the numeric
 * keypad, and selects existing content on focus so typing overwrites it.
 */
function ScoreNumberInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));

  useEffect(() => {
    const currentNumeric = text === "" ? 0 : Number(text);
    if (currentNumeric !== value) {
      setText(value === 0 ? "" : String(value));
    }
    // Only resync when the form value changes from the outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={ariaLabel}
      placeholder="0"
      value={text}
      className="h-11 text-center text-base"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
        setText(digits);
        onChange(digits === "" ? 0 : Number(digits));
      }}
    />
  );
}

export function ScoreSegmentsEditor({ control }: ScoreSegmentsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scoreSegments",
  });

  const { errors } = useFormState({ control, name: "scoreSegments" });
  const segmentError =
    typeof errors.scoreSegments?.message === "string"
      ? errors.scoreSegments.message
      : null;

  const watchedSegments = useWatch({ control, name: "scoreSegments" }) ?? [];
  const preview =
    watchedSegments.length > 0
      ? formatScoreFromSegments(watchedSegments)
      : null;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      {segmentError ? (
        <FormValidationAlert
          title="Score issue"
          messages={[segmentError]}
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Structured score</p>
          <p className="text-xs text-muted-foreground">
            Add each set or tie break in order. The display score is generated
            automatically.
          </p>
        </div>
        {preview ? (
          <p className="font-mono text-sm text-foreground">{preview}</p>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No segments yet. Add a set to start.
        </p>
      ) : null}

      <ul className="space-y-3">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="rounded-md border border-border/80 bg-muted/30 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <FormField
                control={control}
                name={`scoreSegments.${index}.segmentType`}
                render={({ field: typeField }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Segment type</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-base"
                        value={typeField.value}
                        onChange={typeField.onChange}
                      >
                        {SEGMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {segmentTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-muted-foreground"
                aria-label={`Remove segment ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`scoreSegments.${index}.userGamesOrPoints`}
                render={({ field: userField }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      You
                    </FormLabel>
                    <FormControl>
                      <ScoreNumberInput
                        ariaLabel={`Your score for segment ${index + 1}`}
                        value={userField.value}
                        onChange={userField.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`scoreSegments.${index}.opponentGamesOrPoints`}
                render={({ field: oppField }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Opponent
                    </FormLabel>
                    <FormControl>
                      <ScoreNumberInput
                        ariaLabel={`Opponent score for segment ${index + 1}`}
                        value={oppField.value}
                        onChange={oppField.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {SEGMENT_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(defaultSegment(type))}
          >
            <Plus className="mr-1 h-3 w-3" />
            {segmentTypeLabel(type)}
          </Button>
        ))}
      </div>

      <FormField
        control={control}
        name="scoreSegments"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
