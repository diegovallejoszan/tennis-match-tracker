import { describe, expect, it } from "vitest";

import { parseMatchPrepAdviceRequest } from "./validation";

describe("parseMatchPrepAdviceRequest", () => {
  it("accepts a valid opponent and date", () => {
    const parsed = parseMatchPrepAdviceRequest({
      opponentId: "550e8400-e29b-41d4-a716-446655440000",
      plannedMatchDate: "2026-08-15",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing or invalid fields", () => {
    expect(parseMatchPrepAdviceRequest({}).success).toBe(false);
    expect(
      parseMatchPrepAdviceRequest({
        opponentId: "not-a-uuid",
        plannedMatchDate: "2026-08-15",
      }).success,
    ).toBe(false);
    expect(
      parseMatchPrepAdviceRequest({
        opponentId: "550e8400-e29b-41d4-a716-446655440000",
        plannedMatchDate: "15/08/2026",
      }).success,
    ).toBe(false);
  });
});
