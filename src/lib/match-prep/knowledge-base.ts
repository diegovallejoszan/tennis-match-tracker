/**
 * Serializes the internal tactical knowledge base for LLM prompts.
 * End users never browse this directly — it is injected as model context.
 */
import { classifyOpponentTypeFromText, getMatchPrepTactics } from "./generator";
import { TACTIC_SOURCES } from "./sources";
import type { CourtSurface, MatchFormat, OpponentType, PlayerLevel } from "./tactics";

/** Bump when tactics/sources change materially (audit trail for saved advice). */
export const KNOWLEDGE_BASE_VERSION = "1.1.0";

export type KnowledgeBaseQuery = {
  opponentPlayStyle?: string | null;
  format?: MatchFormat;
  surface?: CourtSurface;
  playerLevel?: PlayerLevel;
  /** Cap tokens sent to the model; most relevant tactics first. */
  maxTactics?: number;
};

function opponentTypeLabel(type: OpponentType): string {
  const labels: Record<OpponentType, string> = {
    aggressive_baseliner: "Aggressive baseliner",
    counterpuncher: "Counterpuncher",
    serve_and_volleyer: "Serve & volleyer",
    all_court_player: "All-court player",
    moonballer_retriever: "Moonballer / retriever",
  };
  return labels[type];
}

/**
 * Returns a markdown block suitable for an LLM system or user context message.
 */
export function formatKnowledgeBaseForLlm(query: KnowledgeBaseQuery = {}): string {
  const format = query.format ?? "singles";
  const surface = query.surface ?? "unknown";
  const playerLevel = query.playerLevel ?? "unknown";
  const maxTactics = query.maxTactics ?? 12;

  const detectedType =
    classifyOpponentTypeFromText(query.opponentPlayStyle) ?? "all_court_player";

  const tactics = getMatchPrepTactics({
    opponentType: detectedType,
    format,
    surface,
    playerLevel,
  }).slice(0, maxTactics);

  const sourceLines = TACTIC_SOURCES.map(
    (s) => `- [${s.trustTier}] ${s.organization}: ${s.title}`,
  ).join("\n");

  const tacticLines =
    tactics.length === 0
      ? "_No archetype-specific tactics matched; use general tennis principles._"
      : tactics
          .map(
            (t, i) =>
              `${i + 1}. **${t.title}** (${t.situation.replaceAll("_", " ")})\n` +
              `   - Do: ${t.recommendation}\n` +
              `   - Why: ${t.whyItWorks}\n` +
              `   - Source: ${t.citation.organization}`,
          )
          .join("\n");

  return [
    `## Tactical knowledge base (v${KNOWLEDGE_BASE_VERSION})`,
    `Detected opponent archetype: ${opponentTypeLabel(detectedType)}`,
    "",
    "### Curated sources",
    sourceLines,
    "",
    "### Relevant tactics for this matchup",
    tacticLines,
  ].join("\n");
}
