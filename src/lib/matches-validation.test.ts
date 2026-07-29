import { describe, expect, it } from "vitest";

import {
  defaultMatchFormValues,
  parseMatchForm,
  toDbMatchValues,
  toDbScoreSegments,
} from "./matches-validation";

const opponentA = "550e8400-e29b-41d4-a716-446655440000";
const opponentB = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const partnerC = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const winSegments = [
  { segmentType: "set" as const, userGamesOrPoints: 6, opponentGamesOrPoints: 4 },
  { segmentType: "set" as const, userGamesOrPoints: 6, opponentGamesOrPoints: 3 },
];

describe("parseMatchForm", () => {
  it("accepts a valid singles payload with structured score", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      time: "18:30",
      matchType: "single",
      outcome: "win",
      scoreSegments: winSegments,
      notes: "Keep first serves deep.",
      opponentIds: [opponentA],
      partnerId: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts a loss with one finished set and a partial final set", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-07-29",
      matchType: "single",
      outcome: "loss",
      scoreSegments: [
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 6 },
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 4 },
      ],
      opponentIds: [opponentA],
    });

    expect(parsed.success).toBe(true);
  });

  it("allows either result when a match ends during a partial set", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-07-29",
      matchType: "single",
      outcome: "win",
      scoreSegments: [
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 6 },
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 4 },
      ],
      opponentIds: [opponentA],
    });

    expect(parsed.success).toBe(true);
  });

  it("still rejects win or loss when no set has been finished", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-07-29",
      matchType: "single",
      outcome: "loss",
      scoreSegments: [
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 4 },
      ],
      opponentIds: [opponentA],
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts legacy score when structured is off", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "win",
      useStructuredScore: false,
      legacyScore: "6-4 6-3",
      opponentIds: [opponentA],
      partnerId: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects win with a loss score and surfaces outcome mismatch", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "win",
      scoreSegments: [
        { segmentType: "set", userGamesOrPoints: 4, opponentGamesOrPoints: 6 },
        { segmentType: "set", userGamesOrPoints: 3, opponentGamesOrPoints: 6 },
      ],
      opponentIds: [opponentA],
      partnerId: "",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const outcomeErrors = parsed.error.flatten().fieldErrors.outcome ?? [];
    const scoreErrors = parsed.error.flatten().fieldErrors.scoreSegments ?? [];
    expect(outcomeErrors.join(" ")).toMatch(/Win/i);
    expect(scoreErrors.join(" ")).toMatch(/Win/i);
  });

  it("accepts non-finished without score segments", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "non_finished",
      scoreSegments: [],
      opponentIds: [opponentA],
      partnerId: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts a valid doubles payload", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "doubles",
      outcome: "loss",
      useStructuredScore: false,
      legacyScore: "4-6 6-4 6-7",
      opponentIds: [opponentA, opponentB],
      partnerId: partnerC,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects doubles when partner is also an opponent", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "doubles",
      outcome: "win",
      scoreSegments: winSegments,
      opponentIds: [opponentA],
      partnerId: opponentA,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects single without outcome or score", () => {
    expect(
      parseMatchForm({
        ...defaultMatchFormValues(),
        date: "2026-04-01",
        matchType: "single",
        outcome: "",
        scoreSegments: [],
        opponentIds: [opponentA],
        partnerId: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid date", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "01/04/2026",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid opponent id", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "win",
      scoreSegments: winSegments,
      opponentIds: ["not-a-uuid"],
      partnerId: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts practice without outcome or opponents", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "practice",
      outcome: "",
      legacyScore: "",
      scoreSegments: [],
      notes: "",
      opponentIds: [],
      partnerId: "",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("toDbMatchValues", () => {
  it("normalizes practice fields to null where appropriate", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      time: "",
      matchType: "practice",
      outcome: "",
      legacyScore: "",
      scoreSegments: [],
      notes: "",
      opponentIds: [],
      partnerId: "",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(toDbMatchValues(parsed.data, "user-1")).toEqual({
      userId: "user-1",
      date: "2026-04-01",
      time: null,
      matchType: "practice",
      outcome: null,
      score: null,
      notes: null,
    });
  });

  it("auto-generates score from segments for singles", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "loss",
      scoreSegments: [
        { segmentType: "set", userGamesOrPoints: 3, opponentGamesOrPoints: 6 },
        { segmentType: "set", userGamesOrPoints: 2, opponentGamesOrPoints: 6 },
      ],
      opponentIds: [opponentA],
      partnerId: "",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(toDbMatchValues(parsed.data, "user-1")).toMatchObject({
      outcome: "loss",
      score: "3-6 2-6",
      matchType: "single",
    });
    expect(toDbScoreSegments(parsed.data)).toHaveLength(2);
  });
});
