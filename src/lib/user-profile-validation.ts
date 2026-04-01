import { z } from "zod";

export const userProfileFormSchema = z.object({
  playStyle: z
    .string()
    .trim()
    .max(100, "Play style must be at most 100 characters"),
  strengths: z.string().trim().max(10_000),
  weaknesses: z.string().trim().max(10_000),
});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

export function parseUserProfileForm(input: unknown) {
  return userProfileFormSchema.safeParse(input);
}

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export function userProfileFormToDbColumns(data: UserProfileFormValues) {
  return {
    profilePlayStyle: emptyToNull(data.playStyle),
    profileStrengths: emptyToNull(data.strengths),
    profileWeaknesses: emptyToNull(data.weaknesses),
  };
}

export function dbColumnsToProfileFormDefaults(row: {
  profilePlayStyle: string | null;
  profileStrengths: string | null;
  profileWeaknesses: string | null;
}): UserProfileFormValues {
  return {
    playStyle: row.profilePlayStyle ?? "",
    strengths: row.profileStrengths ?? "",
    weaknesses: row.profileWeaknesses ?? "",
  };
}
