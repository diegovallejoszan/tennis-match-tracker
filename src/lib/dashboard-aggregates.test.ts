import { describe, expect, it } from "vitest";

import {
  competitiveWinLoss,
  filterMatchesByDateRange,
  matchesPerMonth,
  mostFrequentOpponent,
  winLossByMatchType,
  winRateByMonth,
  winRatePercent,
  countMatchesThisCalendarMonth,
} from "./dashboard-aggregates";

const sample: Parameters<typeof filterMatchesByDateRange>[0] = [
  {
    date: "2026-03-10",
    matchType: "single",
    outcome: "win",
    opponents: [{ id: "1", name: "Alex" }],
  },
  {
    date: "2026-03-15",
    matchType: "single",
    outcome: "loss",
    opponents: [{ id: "1", name: "Alex" }],
  },
  {
    date: "2026-04-01",
    matchType: "doubles",
    outcome: "win",
    opponents: [{ id: "2", name: "Sam" }],
  },
  {
    date: "2026-04-05",
    matchType: "practice",
    outcome: null,
    opponents: [],
  },
];

describe("filterMatchesByDateRange", () => {
  it("filters by from and to inclusive", () => {
    const r = filterMatchesByDateRange(sample, "2026-03-11", "2026-04-01");
    expect(r.map((m) => m.date)).toEqual(["2026-03-15", "2026-04-01"]);
  });
});

describe("competitiveWinLoss and winRatePercent", () => {
  it("counts only win/loss outcomes", () => {
    expect(competitiveWinLoss(sample)).toEqual({ wins: 2, losses: 1 });
    expect(winRatePercent(2, 1)).toBe(66.7);
    expect(winRatePercent(0, 0)).toBeNull();
  });
});

describe("mostFrequentOpponent", () => {
  it("returns opponent with highest count; tie-break by name", () => {
    expect(mostFrequentOpponent(sample)).toEqual({ name: "Alex", count: 2 });
  });

  it("returns null when no opponents", () => {
    expect(
      mostFrequentOpponent([
        {
          date: "2026-01-01",
          matchType: "practice",
          outcome: null,
          opponents: [],
        },
      ]),
    ).toBeNull();
  });
});

describe("matchesPerMonth", () => {
  it("aggregates by month and sorts chronologically", () => {
    const rows = matchesPerMonth(sample);
    expect(rows.map((r) => r.monthKey)).toEqual(["2026-03", "2026-04"]);
    expect(rows[0]?.count).toBe(2);
    expect(rows[1]?.count).toBe(2);
  });
});

describe("winLossByMatchType", () => {
  it("only singles and doubles", () => {
    const rows = winLossByMatchType(sample);
    expect(rows).toEqual([
      { typeKey: "single", label: "Singles", wins: 1, losses: 1 },
      { typeKey: "doubles", label: "Doubles", wins: 1, losses: 0 },
    ]);
  });
});

describe("winRateByMonth", () => {
  it("computes monthly win rate for competitive matches", () => {
    const rows = winRateByMonth(sample);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      monthKey: "2026-03",
      winRate: 50,
      competitiveCount: 2,
    });
    expect(rows[1]).toMatchObject({
      monthKey: "2026-04",
      winRate: 100,
      competitiveCount: 1,
    });
  });
});

describe("countMatchesThisCalendarMonth", () => {
  it("counts matches in the given UTC month", () => {
    const april = new Date(Date.UTC(2026, 3, 7));
    expect(countMatchesThisCalendarMonth(sample, april)).toBe(2);
    const march = new Date(Date.UTC(2026, 2, 1));
    expect(countMatchesThisCalendarMonth(sample, march)).toBe(2);
  });
});
