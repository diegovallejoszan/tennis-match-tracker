"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
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

const roleCopy: Record<
  QuickAddPlayerRole,
  { title: string; description: string; submit: string }
> = {
  partner: {
    title: "Add new partner",
    description: "Create a player and select them as your doubles partner.",
    submit: "Create and select partner",
  },
  opponent: {
    title: "Add new opponent",
    description: "Create a player and add them to this match.",
    submit: "Create and add opponent",
  },
};

export function QuickAddPlayerSheet({
  open,
  onOpenChange,
  role,
  onCreated,
}: QuickAddPlayerSheetProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = roleCopy[role];

  const form = useForm<QuickAddPlayerValues>({
    resolver: zodResolver(quickAddPlayerSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ name: "" });
      setServerError(null);
    }
  }, [open, form]);

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
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
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
                {serverError}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Alex"
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
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : copy.submit}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
