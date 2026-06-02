import { z } from "zod";

import { SEGMENT_TYPES } from "@/lib/match-score/types";
import { formatScoreFromSegments } from "@/lib/match-score/format";
import {
  checkMatchIntegrity,
  hasBlockingIntegrityIssues,
} from "@/lib/match-score/integrity";

export const MATCH_TYPES = ["practice", "single", "doubles"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const OUTCOMES = ["win", "loss", "non_finished"] as const;
export type MatchOutcome = (typeof OUTCOMES)[number];

const uuidOrEmpty = z.union([z.string().uuid("Invalid id"), z.literal("")]);

export const scoreSegmentSchema = z.object({
  segmentType: z.enum(SEGMENT_TYPES),
  userGamesOrPoints: z.number().int().min(0).max(99),
  opponentGamesOrPoints: z.number().int().min(0).max(99),
});

export type ScoreSegmentFormValue = z.infer<typeof scoreSegmentSchema>;

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
    outcome: z.enum(["", ...OUTCOMES]),
    /** Legacy free-text score when not using structured segments. */
    legacyScore: z
      .string()
      .trim()
      .max(120, "Score must be at most 120 characters"),
    useStructuredScore: z.boolean(),
    scoreSegments: z.array(scoreSegmentSchema),
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

    if (
      data.outcome !== "win" &&
      data.outcome !== "loss" &&
      data.outcome !== "non_finished"
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Select a match result",
        path: ["outcome"],
      });
    }

    const competitiveFinished =
      data.outcome === "win" || data.outcome === "loss";

    if (data.useStructuredScore) {
      if (competitiveFinished && data.scoreSegments.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one score segment",
          path: ["scoreSegments"],
        });
      }
      const integrity = checkMatchIntegrity({
        outcome:
          data.outcome === "" ? null : (data.outcome as MatchOutcome),
        segments: data.scoreSegments,
      });
      if (hasBlockingIntegrityIssues(integrity)) {
        for (const issue of integrity.filter((i) => i.severity === "error")) {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: ["scoreSegments"],
          });
        }
      }
    } else if (competitiveFinished && data.legacyScore.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Score is required",
        path: ["legacyScore"],
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
    legacyScore: "",
    useStructuredScore: true,
    scoreSegments: [],
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

export function resolveMatchScore(data: MatchFormValues): string | null {
  if (data.matchType === "practice") {
    if (data.useStructuredScore && data.scoreSegments.length > 0) {
      return formatScoreFromSegments(data.scoreSegments);
    }
    const legacy = data.legacyScore.trim();
    return legacy === "" ? null : legacy;
  }

  if (data.useStructuredScore && data.scoreSegments.length > 0) {
    return formatScoreFromSegments(data.scoreSegments);
  }
  const legacy = data.legacyScore.trim();
  return legacy === "" ? null : legacy;
}

export function toDbMatchValues(data: MatchFormValues, userId: string) {
  return {
    userId,
    date: data.date,
    time: emptyToNull(data.time),
    matchType: data.matchType,
    outcome:
      data.matchType === "practice"
        ? null
        : data.outcome === "win" ||
            data.outcome === "loss" ||
            data.outcome === "non_finished"
          ? data.outcome
          : null,
    score: resolveMatchScore(data),
    notes: emptyToNull(data.notes),
  };
}

export function toDbScoreSegments(data: MatchFormValues) {
  if (!data.useStructuredScore || data.scoreSegments.length === 0) {
    return [];
  }
  return data.scoreSegments.map((seg, index) => ({
    segmentOrder: index,
    segmentType: seg.segmentType,
    userGamesOrPoints: seg.userGamesOrPoints,
    opponentGamesOrPoints: seg.opponentGamesOrPoints,
  }));
}
