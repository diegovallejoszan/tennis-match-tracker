import { describe, expect, it } from "vitest";

import {
  buildSparklinePoints,
  competitiveWinLoss,
  filterMatchesByDateRange,
  filterMatchesForDashboard,
  matchesPerMonth,
  mostFrequentOpponent,
  winLossByMatchType,
  winRateByMonth,
  winRateForMatchType,
  winRatePercent,
  countMatchesThisCalendarMonth,
} from "./dashboard-aggregates";

const sample: Parameters<typeof filterMatchesByDateRange>[0] = [
  {
    id: "m1",
    date: "2026-03-10",
    time: "10:00:00",
    matchType: "single",
    outcome: "win",
    opponents: [{ id: "1", name: "Alex" }],
  },
  {
    id: "m2",
    date: "2026-03-15",
    time: "11:00:00",
    matchType: "single",
    outcome: "loss",
    opponents: [{ id: "1", name: "Alex" }],
  },
  {
    id: "m3",
    date: "2026-04-01",
    time: "09:00:00",
    matchType: "doubles",
    outcome: "win",
    opponents: [{ id: "2", name: "Sam" }],
    partner: { id: "3", name: "Pat" },
  },
  {
    id: "m4",
    date: "2026-04-05",
    matchType: "practice",
    outcome: null,
    opponents: [],
  },
  {
    id: "m5",
    date: "2026-04-04",
    matchType: "single",
    outcome: "non_finished",
    opponents: [{ id: "1", name: "Alex" }],
  },
];

describe("filterMatchesByDateRange", () => {
  it("filters by from and to inclusive", () => {
    const r = filterMatchesByDateRange(sample, "2026-03-11", "2026-04-01");
    expect(r.map((m) => m.date)).toEqual(["2026-03-15", "2026-04-01"]);
  });
});

describe("competitiveWinLoss and winRatePercent", () => {
  it("excludes non_finished from win rate", () => {
    const { wins, losses } = competitiveWinLoss(sample);
    expect(wins).toBe(2);
    expect(losses).toBe(1);
  });

  it("counts only win/loss outcomes", () => {
    expect(competitiveWinLoss(sample)).toEqual({ wins: 2, losses: 1 });
    expect(winRatePercent(2, 1)).toBe(66.7);
    expect(winRatePercent(0, 0)).toBeNull();
  });
});

describe("filterMatchesForDashboard", () => {
  it("filters by match type, opponent, and completion status", () => {
    const singles = filterMatchesForDashboard(sample, { matchType: "single" });
    expect(singles).toHaveLength(3);

    const alex = filterMatchesForDashboard(sample, { opponentId: "1" });
    expect(alex.map((m) => m.id)).toEqual(["m1", "m2", "m5"]);

    const unfinished = filterMatchesForDashboard(sample, {
      completionStatus: "non_finished",
    });
    expect(unfinished).toHaveLength(1);
    expect(unfinished[0]?.id).toBe("m5");

    const finished = filterMatchesForDashboard(sample, {
      completionStatus: "finished",
    });
    expect(finished).toHaveLength(3);
  });
});

describe("winRateForMatchType", () => {
  it("computes separate singles and doubles win rates", () => {
    expect(winRateForMatchType(sample, "single")).toEqual({
      wins: 1,
      losses: 1,
      rate: 50,
    });
    expect(winRateForMatchType(sample, "doubles")).toEqual({
      wins: 1,
      losses: 0,
      rate: 100,
    });
  });
});

describe("buildSparklinePoints", () => {
  it("orders matches chronologically and maps outcomes", () => {
    const points = buildSparklinePoints(sample);
    expect(points.map((p) => p.id)).toEqual(["m1", "m2", "m3", "m5", "m4"]);
    expect(points[3]?.outcome).toBe("non_finished");
    expect(points[0]?.outcome).toBe("win");
  });
});

describe("mostFrequentOpponent", () => {
  it("returns opponent with highest count; tie-break by name", () => {
    expect(mostFrequentOpponent(sample)).toEqual({ name: "Alex", count: 3 });
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
    expect(rows[1]?.count).toBe(3);
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
    expect(countMatchesThisCalendarMonth(sample, april)).toBe(3);
    const march = new Date(Date.UTC(2026, 2, 1));
    expect(countMatchesThisCalendarMonth(sample, march)).toBe(2);
  });
});
