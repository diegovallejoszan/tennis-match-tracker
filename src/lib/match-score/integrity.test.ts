import { describe, expect, it } from "vitest";

import {
  checkMatchIntegrity,
  getLiveIntegrityMessages,
  hasBlockingIntegrityIssues,
} from "./integrity";
import type { ScoreSegmentInput } from "./types";

const winSets: ScoreSegmentInput[] = [
  { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 4 },
  { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 3 },
];

describe("checkMatchIntegrity", () => {
  it("flags outcome vs structured score mismatch", () => {
    const issues = checkMatchIntegrity({
      outcome: "win",
      segments: [
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 6 },
        { segmentType: "set", userGamesOrPoints: 3, opponentGamesOrPoints: 6 },
      ],
    });
    expect(issues.some((i) => i.code === "outcome_vs_score")).toBe(true);
    expect(hasBlockingIntegrityIssues(issues)).toBe(true);
  });

  it("accepts consistent win and score", () => {
    const issues = checkMatchIntegrity({
      outcome: "win",
      segments: winSets,
    });
    expect(hasBlockingIntegrityIssues(issues)).toBe(false);
  });

  it("allows non-finished without segments", () => {
    const issues = checkMatchIntegrity({
      outcome: "non_finished",
      segments: [],
    });
    expect(hasBlockingIntegrityIssues(issues)).toBe(false);
  });
});

describe("getLiveIntegrityMessages", () => {
  it("returns nothing when result is set but score is empty", () => {
    expect(
      getLiveIntegrityMessages({ outcome: "win", segments: [] }),
    ).toEqual([]);
    expect(
      getLiveIntegrityMessages({
        outcome: "win",
        segments: [
          { segmentType: "set", userGamesOrPoints: 0, opponentGamesOrPoints: 0 },
        ],
      }),
    ).toEqual([]);
  });

  it("flags outcome mismatch once score data is meaningful", () => {
    expect(
      getLiveIntegrityMessages({
        outcome: "win",
        segments: [
          { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 6 },
          { segmentType: "set", userGamesOrPoints: 3, opponentGamesOrPoints: 6 },
        ],
      }),
    ).toEqual([
      "Result is Win but the structured score favors your opponent",
    ]);
  });

  it("waits until sets favor one side", () => {
    expect(
      getLiveIntegrityMessages({
        outcome: "win",
        segments: [
          { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 4 },
          { segmentType: "set", userGamesOrPoints: 0, opponentGamesOrPoints: 0 },
        ],
      }),
    ).toEqual([]);
  });
});
