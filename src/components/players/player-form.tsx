"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  WEEKDAYS,
} from "@/lib/players-validation";
import { translateKnownError } from "@/lib/translate-error";

type PlayerFormProps = {
  mode: "create" | "edit";
  playerId?: string;
  defaultValues: PlayerFormInput;
};

export function PlayerForm({ mode, playerId, defaultValues }: PlayerFormProps) {
  const router = useRouter();
  const t = useTranslations("players.form");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
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
            {translateKnownError(serverError, tErrors)}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="max-w-lg">
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} {...field} />
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
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder={t("phonePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div>
            <Label className="text-base">{t("availability")}</Label>
            <p className="text-[0.8rem] text-muted-foreground">
              {t("availabilityHelp")}
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
                    {t("day")}
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot}
                      scope="col"
                      className="px-1 py-2 text-center font-normal leading-tight"
                    >
                      {t(`timeSlots.${slot}`)}
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
                      {t(`weekdays.${day}`)}
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
                                  aria-label={`${t(`weekdays.${day}`)} ${t(`timeSlots.${slot}`)}`}
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
              <FormLabel>{t("playStyle")}</FormLabel>
              <FormControl>
                <Input placeholder={t("playStylePlaceholder")} {...field} />
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
              <FormLabel>{t("strengths")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("strengthsPlaceholder")}
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
              <FormLabel>{t("weaknesses")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("weaknessesPlaceholder")}
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
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("notesPlaceholder")}
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
              ? tCommon("saving")
              : mode === "create"
                ? t("addPlayer")
                : t("saveChanges")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/players">{tCommon("cancel")}</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
