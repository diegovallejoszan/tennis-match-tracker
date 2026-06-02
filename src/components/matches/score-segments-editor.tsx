"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

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

export function ScoreSegmentsEditor({ control }: ScoreSegmentsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scoreSegments",
  });

  const watchedSegments = useWatch({ control, name: "scoreSegments" }) ?? [];
  const preview =
    watchedSegments.length > 0
      ? formatScoreFromSegments(watchedSegments)
      : null;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
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
            className="grid gap-3 rounded-md border border-border/80 bg-muted/30 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <FormField
              control={control}
              name={`scoreSegments.${index}.segmentType`}
              render={({ field: typeField }) => (
                <FormItem>
                  <FormLabel className="sr-only">Segment type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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

            <FormField
              control={control}
              name={`scoreSegments.${index}.userGamesOrPoints`}
              render={({ field: userField }) => (
                <FormItem>
                  <FormLabel>You</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      {...userField}
                      onChange={(e) =>
                        userField.onChange(e.target.valueAsNumber || 0)
                      }
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
                  <FormLabel>Opponent</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      {...oppField}
                      onChange={(e) =>
                        oppField.onChange(e.target.valueAsNumber || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove segment"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
