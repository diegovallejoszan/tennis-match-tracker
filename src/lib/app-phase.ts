/**
 * Active product phase. Bump when shipping a new major increment.
 * Phase 5: match preparation UI + LLM advice (5a–5c).
 */
export const CURRENT_APP_PHASE = 5 as const;

export type AppPhase = 4 | 5 | 6;

/** Match preparation UI and LLM advice generation (Phase 5+). */
export function isMatchPrepEnabled(): boolean {
  return CURRENT_APP_PHASE >= 5;
}
