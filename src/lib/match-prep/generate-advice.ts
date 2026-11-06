import OpenAI from "openai";

import type { AppLocale } from "@/lib/locale";
import type { MatchPrepPromptContext } from "./format-prep-prompt";
import { formatMatchPrepPromptContext } from "./format-prep-prompt";

export const DEFAULT_MATCH_PREP_MODEL = "gpt-5.6-terra";
export const DEFAULT_MATCH_PREP_REASONING_EFFORT = "low" as const;

const REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export type MatchPrepReasoningEffort = (typeof REASONING_EFFORTS)[number];

export function resolveMatchPrepModelId(): string {
  return process.env.OPENAI_MATCH_PREP_MODEL?.trim() || DEFAULT_MATCH_PREP_MODEL;
}

export function resolveMatchPrepReasoningEffort(): MatchPrepReasoningEffort {
  const raw = process.env.OPENAI_MATCH_PREP_REASONING_EFFORT?.trim().toLowerCase();
  if (raw && (REASONING_EFFORTS as readonly string[]).includes(raw)) {
    return raw as MatchPrepReasoningEffort;
  }
  return DEFAULT_MATCH_PREP_REASONING_EFFORT;
}

/** Exported so tests can lock the coaching stance of the match-prep call. */
export function buildMatchPrepSystemPrompt(locale: AppLocale): string {
  const language =
    locale === "es"
      ? "Respond entirely in Spanish (Spain/Latin American tennis vocabulary is fine)."
      : "Respond entirely in English.";

  return [
    "You are an expert tennis coach preparing a club or recreational player for an upcoming singles match.",
    "Use your full coaching knowledge: patterns of play, tactics, point construction, mentality, and match management.",
    "The tactical knowledge base in the user message is a reference, not a limit. Use an excerpt when it fits this matchup, and go beyond it whenever the player's profile, the opponent, head-to-head history, or recent form calls for something the excerpts do not cover.",
    "Tailor every point to this specific opponent and this player's game. Do not recycle a generic checklist that would fit any match, and do not restate the knowledge base as a list.",
    "Do not invent specific scores, quotes, or match facts that are not in the context. If data is missing, say so briefly and still give practical advice.",
    "Output markdown with exactly these sections:",
    "## Tactical advice",
    "## Game plan",
    "Under ## Tactical advice, use bullet points only and at most 6 bullets. Each bullet should name why it matters against this opponent.",
    "Under ## Game plan, choose short subsections that fit this matchup (for example ### Serve, ### Return, ### Rally pattern). Do not always use the same headings.",
    "Each Game plan subsection should have 2 bullet points, or 3 only when a third idea is distinct and high priority. Keep the plan short and specific.",
    "Keep the advice concrete and actionable for club-level singles, informed by expert coaching rather than tour analytics.",
    language,
  ].join("\n");
}

/** Human-readable message for UI / logs from OpenAI or generic failures. */
export function formatMatchPrepLlmError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    const status = err.status ? ` (HTTP ${err.status})` : "";
    const detail = err.message?.trim() || "Unknown API error";
    return `OpenAI API error${status}: ${detail}`;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  return "Could not generate advice. Please try again.";
}

export type GenerateMatchPrepAdviceResult = {
  adviceMarkdown: string;
  modelId: string;
};

/**
 * Calls the OpenAI Responses API with assembled match-prep context.
 * Requires OPENAI_API_KEY in the environment.
 */
export async function generateMatchPrepAdviceFromLlm(options: {
  context: MatchPrepPromptContext;
  locale: AppLocale;
  modelId?: string;
  reasoningEffort?: MatchPrepReasoningEffort;
}): Promise<GenerateMatchPrepAdviceResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const modelId = options.modelId ?? resolveMatchPrepModelId();
  const reasoningEffort =
    options.reasoningEffort ?? resolveMatchPrepReasoningEffort();
  const client = new OpenAI({ apiKey });
  const userContent = formatMatchPrepPromptContext(options.context);

  const response = await client.responses.create({
    model: modelId,
    reasoning: { effort: reasoningEffort },
    instructions: buildMatchPrepSystemPrompt(options.locale),
    input: userContent,
  });

  const adviceMarkdown = response.output_text?.trim();
  if (!adviceMarkdown) {
    throw new Error("The AI returned an empty response");
  }

  return { adviceMarkdown, modelId };
}
