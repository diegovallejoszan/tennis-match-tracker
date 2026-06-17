import { z } from "zod";

import type { SourceTrustTier } from "./sources";

export const OpponentTypeSchema = z.enum([
  "aggressive_baseliner",
  "counterpuncher",
  "serve_and_volleyer",
  "all_court_player",
  "moonballer_retriever",
]);

export type OpponentType = z.infer<typeof OpponentTypeSchema>;

export const GameSituationSchema = z.enum([
  "serve",
  "return",
  "baseline_rally",
  "approach_net",
  "passing_defense",
  "general",
]);

export type GameSituation = z.infer<typeof GameSituationSchema>;

export const MatchFormatSchema = z.enum(["singles", "doubles"]);
export type MatchFormat = z.infer<typeof MatchFormatSchema>;

export const CourtSurfaceSchema = z.enum(["hard", "clay", "grass", "indoor", "unknown"]);
export type CourtSurface = z.infer<typeof CourtSurfaceSchema>;

export const PlayerLevelSchema = z.enum(["beginner", "intermediate", "advanced", "unknown"]);
export type PlayerLevel = z.infer<typeof PlayerLevelSchema>;

export const TacticCitationSchema = z.object({
  sourceId: z.string().min(1),
  trustTier: z.custom<SourceTrustTier>(),
  url: z.string().url(),
  title: z.string().min(1),
  organization: z.string().min(1),
});

export type TacticCitation = z.infer<typeof TacticCitationSchema>;

export const TacticSchema = z.object({
  id: z.string().min(1),
  opponentType: OpponentTypeSchema,
  situation: GameSituationSchema,
  title: z.string().min(1),
  recommendation: z.string().min(1),
  whyItWorks: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  constraints: z
    .object({
      format: MatchFormatSchema.optional(),
      surface: CourtSurfaceSchema.optional(),
      playerLevel: PlayerLevelSchema.optional(),
    })
    .default({}),
  confidenceScore: z.number().min(0).max(1),
  citation: TacticCitationSchema,
});

export type Tactic = z.infer<typeof TacticSchema>;

export function trustTierToBaseConfidence(trustTier: SourceTrustTier): number {
  return trustTier === "tier1" ? 0.85 : 0.7;
}

