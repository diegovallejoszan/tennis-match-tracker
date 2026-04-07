import { z } from "zod";

export const MATCH_TYPES = ["practice", "single", "doubles"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const OUTCOMES = ["win", "loss"] as const;
export type MatchOutcome = (typeof OUTCOMES)[number];

const uuidOrEmpty = z.union([z.string().uuid("Invalid id"), z.literal("")]);

export const matchFormSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
    time: z
      .string()
      .regex(/^$|^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
    matchType: z.enum(MATCH_TYPES),
    /** Required for single/doubles; ignored for practice in DB. */
    outcome: z.enum(["", "win", "loss"]),
    score: z.string().trim().max(50, "Score must be at most 50 characters"),
    notes: z
      .string()
      .trim()
      .max(10_000, "Notes must be at most 10000 characters"),
    opponentIds: z.array(z.string().uuid("Invalid opponent id")).max(8),
    /** Doubles only: one partner from your players list. */
    partnerId: uuidOrEmpty,
  })
  .superRefine((data, ctx) => {
    if (data.matchType === "practice") {
      if (data.partnerId !== "") {
        ctx.addIssue({
          code: "custom",
          message: "Partner applies only to doubles",
          path: ["partnerId"],
        });
      }
      return;
    }

    if (data.outcome !== "win" && data.outcome !== "loss") {
      ctx.addIssue({
        code: "custom",
        message: "Select win or loss",
        path: ["outcome"],
      });
    }

    if (data.score.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Score is required",
        path: ["score"],
      });
    }

    if (data.matchType === "single") {
      if (data.partnerId !== "") {
        ctx.addIssue({
          code: "custom",
          message: "Partner applies only to doubles",
          path: ["partnerId"],
        });
      }
      if (data.opponentIds.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Select at least one opponent",
          path: ["opponentIds"],
        });
      }
      return;
    }

    if (data.matchType === "doubles") {
      if (data.partnerId === "") {
        ctx.addIssue({
          code: "custom",
          message: "Select a partner",
          path: ["partnerId"],
        });
      }
      if (data.opponentIds.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Select at least one opponent",
          path: ["opponentIds"],
        });
      }
      if (
        data.partnerId !== "" &&
        data.opponentIds.includes(data.partnerId)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Partner cannot also be an opponent",
          path: ["partnerId"],
        });
      }
    }
  });

export type MatchFormValues = z.infer<typeof matchFormSchema>;
export type MatchFormInput = MatchFormValues;

export function defaultMatchFormValues(): MatchFormInput {
  return {
    date: "",
    time: "",
    matchType: "practice",
    outcome: "",
    score: "",
    notes: "",
    opponentIds: [],
    partnerId: "",
  };
}

export function parseMatchForm(input: unknown) {
  return matchFormSchema.safeParse(input);
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

export function toDbMatchValues(data: MatchFormValues, userId: string) {
  const score =
    data.matchType === "practice"
      ? emptyToNull(data.score)
      : data.score.trim();

  return {
    userId,
    date: data.date,
    time: emptyToNull(data.time),
    matchType: data.matchType,
    outcome:
      data.matchType === "practice"
        ? null
        : data.outcome === "win" || data.outcome === "loss"
          ? data.outcome
          : null,
    score: score === "" ? null : score,
    notes: emptyToNull(data.notes),
  };
}
