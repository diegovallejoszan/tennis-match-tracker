"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  completeOnboardingAction,
  updateUserProfileAction,
} from "@/app/actions/user-profile";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type UserProfileFormValues,
  userProfileFormSchema,
} from "@/lib/user-profile-validation";

type ProfileFormProps = {
  variant: "onboarding" | "settings";
  defaultValues: UserProfileFormValues;
};

export function ProfileForm({ variant, defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("account");
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues,
  });

  function onSubmit(values: UserProfileFormValues) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      if (variant === "onboarding") {
        const result = await completeOnboardingAction(values);
        if (result && "error" in result) {
          setServerError(result.error);
        }
        return;
      }

      const result = await updateUserProfileAction(values);
      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {serverError ? (
          <p
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        {variant === "settings" && saved ? (
          <p
            className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {t("saved")}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="playStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("playStyle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("playStylePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("playStyleHelp")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strengths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("strengths")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("strengthsPlaceholder")}
                  className="min-h-[88px] resize-y"
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
            <FormItem>
              <FormLabel>{t("weaknesses")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("weaknessesPlaceholder")}
                  className="min-h-[88px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending
            ? t("saving")
            : variant === "onboarding"
              ? t("createAccount")
              : t("save")}
        </Button>
      </form>
    </Form>
  );
}
