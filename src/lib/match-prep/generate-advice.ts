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

function buildSystemPrompt(locale: AppLocale): string {
  const language =
    locale === "es"
      ? "Respond entirely in Spanish (Spain/Latin American tennis vocabulary is fine)."
      : "Respond entirely in English.";

  return [
    "You are an experienced recreational tennis coach preparing a player for an upcoming match.",
    "Use the opponent profile, head-to-head history, recent form, and the curated tactical knowledge base provided in the user message.",
    "Do not invent specific scores or quotes that are not in the context. If data is missing, say so briefly and still give practical advice.",
    "Ground tactics in the knowledge-base excerpts when relevant; paraphrase rather than dumping source lists.",
    "Output markdown with exactly these sections:",
    "## Tactical advice",
    "## Game plan",
    "Keep each section concrete and actionable for club-level / recreational play (not tour analytics).",
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
    instructions: buildSystemPrompt(options.locale),
    input: userContent,
  });

  const adviceMarkdown = response.output_text?.trim();
  if (!adviceMarkdown) {
    throw new Error("The AI returned an empty response");
  }

  return { adviceMarkdown, modelId };
}
