/**
 * Active product phase. Bump when shipping a new major increment.
 * Phase 4: dashboard only — match preparation is built internally but hidden.
 */
export const CURRENT_APP_PHASE = 4 as const;

export type AppPhase = 4 | 5 | 6;

/** Match preparation UI and LLM advice generation (Phase 5+). */
export function isMatchPrepEnabled(): boolean {
  return CURRENT_APP_PHASE >= 5;
}
