import { SCORE_SEGMENT_TYPES } from "@/db/schema/matches";

export const SEGMENT_TYPES = SCORE_SEGMENT_TYPES;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

export type ScoreSegmentInput = {
  segmentType: SegmentType;
  userGamesOrPoints: number;
  opponentGamesOrPoints: number;
};

export type ScoreSegmentWithOrder = ScoreSegmentInput & {
  segmentOrder: number;
};

export type IntegrityIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};
