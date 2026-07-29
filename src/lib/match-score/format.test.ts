import { describe, expect, it } from "vitest";

import { formatScoreFromSegments } from "./format";
import type { ScoreSegmentInput } from "./types";

describe("formatScoreFromSegments", () => {
  it("formats straight sets", () => {
    const segments: ScoreSegmentInput[] = [
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 4 },
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 3 },
    ];
    expect(formatScoreFromSegments(segments)).toBe("6-4 6-3");
  });

  it("merges set at 6-6 with tie break", () => {
    const segments: ScoreSegmentInput[] = [
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 6 },
      { segmentType: "tie_break", userGamesOrPoints: 7, opponentGamesOrPoints: 5 },
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 2 },
    ];
    expect(formatScoreFromSegments(segments)).toBe("7-6(5) 6-2");
  });

  it("formats super tie break", () => {
    const segments: ScoreSegmentInput[] = [
      {
        segmentType: "super_tie_break",
        userGamesOrPoints: 10,
        opponentGamesOrPoints: 8,
      },
    ];
    expect(formatScoreFromSegments(segments)).toBe("[10-8]");
  });

  it("keeps a super tie break separate after a completed set", () => {
    const segments: ScoreSegmentInput[] = [
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 4 },
      {
        segmentType: "super_tie_break",
        userGamesOrPoints: 7,
        opponentGamesOrPoints: 10,
      },
    ];

    expect(formatScoreFromSegments(segments)).toBe("6-4 [7-10]");
  });

  it("merges unfinished set with tie break", () => {
    const segments: ScoreSegmentInput[] = [
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 5 },
      { segmentType: "tie_break", userGamesOrPoints: 7, opponentGamesOrPoints: 4 },
    ];
    expect(formatScoreFromSegments(segments)).toBe("7-5(4)");
  });

  it("merges unfinished long set with super tie break", () => {
    const segments: ScoreSegmentInput[] = [
      { segmentType: "long_set", userGamesOrPoints: 8, opponentGamesOrPoints: 8 },
      {
        segmentType: "super_tie_break",
        userGamesOrPoints: 10,
        opponentGamesOrPoints: 7,
      },
    ];
    expect(formatScoreFromSegments(segments)).toBe("9-8[10-7]");
  });
});
