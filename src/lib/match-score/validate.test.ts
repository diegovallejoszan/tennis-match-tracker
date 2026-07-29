import { describe, expect, it } from "vitest";

import { hasBlockingIntegrityIssues } from "./integrity";
import { validateAllSegments } from "./validate";

describe("validateAllSegments", () => {
  it("allows an unfinished set followed by a tie break", () => {
    const issues = validateAllSegments([
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 5 },
      { segmentType: "tie_break", userGamesOrPoints: 7, opponentGamesOrPoints: 4 },
    ]);
    expect(hasBlockingIntegrityIssues(issues)).toBe(false);
  });

  it("allows an unfinished long set followed by a super tie break", () => {
    const issues = validateAllSegments([
      { segmentType: "long_set", userGamesOrPoints: 8, opponentGamesOrPoints: 8 },
      {
        segmentType: "super_tie_break",
        userGamesOrPoints: 10,
        opponentGamesOrPoints: 8,
      },
    ]);
    expect(hasBlockingIntegrityIssues(issues)).toBe(false);
  });

  it("still rejects an incomplete set without a deciding break", () => {
    const issues = validateAllSegments([
      { segmentType: "set", userGamesOrPoints: 6, opponentGamesOrPoints: 5 },
    ]);
    expect(issues.some((i) => i.code === "set_margin")).toBe(true);
  });

  it.each([
    [7, 5],
    [5, 7],
  ])("accepts %i-%i as a completed standard set", (user, opponent) => {
    const issues = validateAllSegments([
      {
        segmentType: "set",
        userGamesOrPoints: user,
        opponentGamesOrPoints: opponent,
      },
    ]);

    expect(hasBlockingIntegrityIssues(issues)).toBe(false);
  });

  it("still rejects 7-4 as an invalid standard set", () => {
    const issues = validateAllSegments([
      { segmentType: "set", userGamesOrPoints: 7, opponentGamesOrPoints: 4 },
    ]);

    expect(issues.some((issue) => issue.code === "set_invalid_seven")).toBe(true);
  });
});
