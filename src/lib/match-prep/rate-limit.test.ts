import { afterEach, describe, expect, it } from "vitest";

import { consumeMatchPrepRateLimit, resetMatchPrepRateLimitForTests } from "./rate-limit";

describe("consumeMatchPrepRateLimit", () => {
  afterEach(() => {
    resetMatchPrepRateLimitForTests();
    delete process.env.MATCH_PREP_RATE_LIMIT_MAX;
    delete process.env.MATCH_PREP_RATE_LIMIT_WINDOW_MS;
  });

  it("allows requests under the cap and blocks the next one", () => {
    process.env.MATCH_PREP_RATE_LIMIT_MAX = "2";
    process.env.MATCH_PREP_RATE_LIMIT_WINDOW_MS = "60000";

    expect(consumeMatchPrepRateLimit("user-a", 1_000).allowed).toBe(true);
    expect(consumeMatchPrepRateLimit("user-a", 2_000).allowed).toBe(true);
    const blocked = consumeMatchPrepRateLimit("user-a", 3_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("does not share a bucket across users", () => {
    process.env.MATCH_PREP_RATE_LIMIT_MAX = "1";
    expect(consumeMatchPrepRateLimit("user-a", 1_000).allowed).toBe(true);
    expect(consumeMatchPrepRateLimit("user-b", 1_000).allowed).toBe(true);
  });

  it("allows another request after the window slides", () => {
    process.env.MATCH_PREP_RATE_LIMIT_MAX = "1";
    process.env.MATCH_PREP_RATE_LIMIT_WINDOW_MS = "1000";
    expect(consumeMatchPrepRateLimit("user-a", 0).allowed).toBe(true);
    expect(consumeMatchPrepRateLimit("user-a", 500).allowed).toBe(false);
    expect(consumeMatchPrepRateLimit("user-a", 1_001).allowed).toBe(true);
  });
});
