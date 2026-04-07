import { describe, expect, it } from "vitest";

import {
  defaultMatchFormValues,
  parseMatchForm,
  toDbMatchValues,
} from "./matches-validation";

const opponentA = "550e8400-e29b-41d4-a716-446655440000";
const opponentB = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const partnerC = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

describe("parseMatchForm", () => {
  it("accepts a valid singles payload", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      time: "18:30",
      matchType: "single",
      outcome: "win",
      score: "6-4 6-3",
      notes: "Keep first serves deep.",
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
      score: "4-6 6-4 6-7",
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
      score: "6-0 6-0",
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
        score: "",
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
      score: "6-0",
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
      score: "",
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
      score: "",
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

  it("persists outcome and score for singles", () => {
    const parsed = parseMatchForm({
      ...defaultMatchFormValues(),
      date: "2026-04-01",
      matchType: "single",
      outcome: "loss",
      score: "3-6 2-6",
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
  });
});
