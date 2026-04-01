"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createPlayerAction,
  updatePlayerAction,
} from "@/app/actions/players";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type PlayerFormInput,
  type PlayerFormValues,
  playerFormSchema,
  TIME_SLOTS,
  timeSlotLabels,
  WEEKDAYS,
} from "@/lib/players-validation";

const weekdayLabels: Record<(typeof WEEKDAYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type PlayerFormProps = {
  mode: "create" | "edit";
  playerId?: string;
  defaultValues: PlayerFormInput;
};

export function PlayerForm({ mode, playerId, defaultValues }: PlayerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues,
  });

  function onSubmit(values: PlayerFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPlayerAction(values)
          : await updatePlayerAction(playerId!, values);

      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/players");
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Opponent or partner name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div>
            <Label className="text-base">Availability</Label>
            <p className="text-[0.8rem] text-muted-foreground">
              Days and times they can typically play (optional). Check each cell
              for when they are free.
            </p>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-muted/40 px-2 py-2 text-left font-medium"
                  >
                    Day
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot}
                      scope="col"
                      className="px-1 py-2 text-center font-normal leading-tight"
                    >
                      {timeSlotLabels[slot]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((day) => (
                  <tr key={day} className="border-b border-border last:border-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-background px-2 py-2 text-left font-medium"
                    >
                      {weekdayLabels[day]}
                    </th>
                    {TIME_SLOTS.map((slot) => (
                      <td key={slot} className="px-1 py-1 text-center">
                        <FormField
                          control={form.control}
                          name={`availability.${day}.${slot}`}
                          render={({ field }) => (
                            <FormItem className="flex justify-center space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  aria-label={`${weekdayLabels[day]} ${timeSlotLabels[slot]}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FormField
          control={form.control}
          name="playStyle"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Play style</FormLabel>
              <FormControl>
                <Input placeholder="e.g. aggressive baseliner" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strengths"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Strengths</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What they do well"
                  className="min-h-[80px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weaknesses"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Weaknesses</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Areas to exploit or watch for"
                  className="min-h-[80px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anything else to remember"
                  className="min-h-[80px] resize-y"
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
              ? "Saving…"
              : mode === "create"
                ? "Add player"
                : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/players">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
