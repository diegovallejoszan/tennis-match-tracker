"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createPlayerAction } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { defaultPlayerFormValues } from "@/lib/players-validation";
import { translateKnownError } from "@/lib/translate-error";

const quickAddPlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
});

type QuickAddPlayerValues = z.infer<typeof quickAddPlayerSchema>;

export type QuickAddPlayerRole = "partner" | "opponent";

type QuickAddPlayerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: QuickAddPlayerRole;
  onCreated: (player: { id: string; name: string }, role: QuickAddPlayerRole) => void;
};

export function QuickAddPlayerSheet({
  open,
  onOpenChange,
  role,
  onCreated,
}: QuickAddPlayerSheetProps) {
  const t = useTranslations("quickAdd");
  const tErrors = useTranslations("errors");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<QuickAddPlayerValues>({
    resolver: zodResolver(quickAddPlayerSchema),
    defaultValues: { name: "" },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ name: "" });
      setServerError(null);
    }
    onOpenChange(next);
  }

  function onSubmit(values: QuickAddPlayerValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createPlayerAction({
        ...defaultPlayerFormValues(),
        name: values.name,
      });

      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }

      onCreated(result.player, role);
      handleOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {role === "partner" ? t("partnerTitle") : t("opponentTitle")}
          </SheetTitle>
          <SheetDescription>
            {role === "partner"
              ? t("partnerDescription")
              : t("opponentDescription")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
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
                <FormItem>
                  <FormLabel>{t("playerName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      autoComplete="off"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("creating")
                  : role === "partner"
                    ? t("partnerSubmit")
                    : t("opponentSubmit")}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
