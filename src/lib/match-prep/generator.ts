import type { CourtSurface, MatchFormat, OpponentType, PlayerLevel, Tactic } from "./tactics";
import { TACTIC_LIBRARY } from "./tactic-library";

/** Inputs for selecting tactics to inject into an LLM prompt (not shown in the UI). */
export type MatchPrepContext = {
  opponentType: OpponentType;
  format: MatchFormat;
  surface: CourtSurface;
  playerLevel: PlayerLevel;
};

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function classifyOpponentTypeFromText(
  playStyleText: string | null | undefined,
): OpponentType | null {
  const raw = (playStyleText ?? "").trim().toLowerCase();
  if (raw.length === 0) return null;

  // Serve & volley / net rusher
  if (
    includesAny(raw, [
      "serve and volley",
      "serve & volley",
      "s&v",
      "net rusher",
      "rush the net",
      "chip and charge",
      "chip & charge",
      "attacks the net",
      "volleyer",
    ])
  ) {
    return "serve_and_volleyer";
  }

  // Moonballer / junkballer / retriever archetype (Gilbert: Retriever, soft hitter)
  if (
    includesAny(raw, [
      "moonball",
      "moon ball",
      "junkball",
      "junk ball",
      "high looper",
      "high arcing",
      "lobber",
      "lob",
      "globero",
      "retriever",
      "human backboard",
      "pusher",
      "runner pusher",
      "runner / pusher",
      "drop shot lobber",
      "drop shot - lobber",
      "pasabolas",
      "ball passer",
      "ball-passer",
      "nerf",
      "soft hitter",
      "soft-hitter",
      "junk baller",
      "no pace",
      "low pace",
    ])
  ) {
    return "moonballer_retriever";
  }

  // Slice architect — low, skidding rhythm (manual: El Arquitecto del Slice)
  if (
    includesAny(raw, [
      "slice architect",
      "slice specialist",
      "serial slicer",
      "arquitecto del slice",
      "sliceador",
      "chip and slice",
      "all slice",
    ])
  ) {
    return "counterpuncher";
  }

  // Lefty — variable references (manual: El Zurdo)
  if (includesAny(raw, ["lefty", "left-handed", "left handed", "zurdo", "southpaw"])) {
    return "all_court_player";
  }

  // Gilbert: Speedster — fast court coverage as primary weapon
  if (
    includesAny(raw, [
      "speedster",
      "very fast",
      "fast mover",
      "fast feet",
      "quick around the court",
      "covers the court",
    ])
  ) {
    return "counterpuncher";
  }

  // Counterpuncher (defensive, consistent, uses opponent pace)
  if (includesAny(raw, ["counterpunch", "counter punch", "defensive", "consistent"])) {
    return "counterpuncher";
  }

  // Aggressive baseliner (baseline hitter / power)
  if (
    includesAny(raw, [
      "aggressive baseliner",
      "baseline basher",
      "baseliner",
      "baseline hitter",
      "power",
      "big forehand",
      "huge forehand",
      "strong groundstroke",
      "groundstroke player",
      "takes it early",
      "basher",
      "pegador",
      "hitter",
      "goes for winners",
    ])
  ) {
    return "aggressive_baseliner";
  }

  // All-court player / variety
  if (includesAny(raw, ["all court", "all-court", "variety", "mixes it up"])) {
    return "all_court_player";
  }

  return null;
}

function tacticApplies(t: Tactic, ctx: MatchPrepContext): boolean {
  const c = t.constraints ?? {};
  if (c.format && c.format !== ctx.format) return false;
  if (c.surface && c.surface !== ctx.surface) return false;
  if (c.playerLevel && c.playerLevel !== ctx.playerLevel) return false;
  return true;
}

/**
 * Tactics from the internal knowledge base relevant to the detected opponent archetype.
 * Used by `knowledge-base.ts` when building LLM context — not rendered to users directly.
 */
export function getMatchPrepTactics(ctx: MatchPrepContext): Tactic[] {
  const applicable = TACTIC_LIBRARY.filter(
    (t) => t.opponentType === ctx.opponentType && tacticApplies(t, ctx),
  );

  // Keep results stable and predictable.
  return applicable
    .slice()
    .sort((a, b) => b.confidenceScore - a.confidenceScore || a.title.localeCompare(b.title));
}

