type RateLimitAllowed = { allowed: true };
type RateLimitBlocked = { allowed: false; retryAfterSeconds: number };
export type MatchPrepRateLimitResult = RateLimitAllowed | RateLimitBlocked;

const hitsByUser = new Map<string, number[]>();

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function matchPrepRateLimitConfig(nowEnv = process.env): {
  max: number;
  windowMs: number;
} {
  return {
    max: readPositiveInt(nowEnv.MATCH_PREP_RATE_LIMIT_MAX, 8),
    windowMs: readPositiveInt(nowEnv.MATCH_PREP_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000)
  };
}

/**
 * In-process sliding window for LLM advice calls (generate + regenerate).
 * One Railway replica is enough for this personal app; the limit is per server process.
 */
export function consumeMatchPrepRateLimit(
  userId: string,
  now = Date.now()
): MatchPrepRateLimitResult {
  const { max, windowMs } = matchPrepRateLimitConfig();
  const recent = (hitsByUser.get(userId) ?? []).filter((stamp) => now - stamp < windowMs);

  if (recent.length >= max) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    hitsByUser.set(userId, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hitsByUser.set(userId, recent);
  return { allowed: true };
}

export function resetMatchPrepRateLimitForTests(): void {
  hitsByUser.clear();
}
