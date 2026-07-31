import { afterEach, describe, expect, it } from "vitest";
import OpenAI from "openai";

import {
  DEFAULT_MATCH_PREP_MODEL,
  DEFAULT_MATCH_PREP_REASONING_EFFORT,
  formatMatchPrepLlmError,
  resolveMatchPrepModelId,
  resolveMatchPrepReasoningEffort,
} from "./generate-advice";
import { formatMatchPrepPromptContext } from "./format-prep-prompt";
import type { MatchPrepPromptContext } from "./format-prep-prompt";

describe("resolveMatchPrepModelId", () => {
  afterEach(() => {
    delete process.env.OPENAI_MATCH_PREP_MODEL;
  });

  it("defaults to gpt-5.6-terra", () => {
    delete process.env.OPENAI_MATCH_PREP_MODEL;
    expect(resolveMatchPrepModelId()).toBe(DEFAULT_MATCH_PREP_MODEL);
    expect(DEFAULT_MATCH_PREP_MODEL).toBe("gpt-5.6-terra");
  });

  it("respects OPENAI_MATCH_PREP_MODEL", () => {
    process.env.OPENAI_MATCH_PREP_MODEL = " gpt-5.6-luna ";
    expect(resolveMatchPrepModelId()).toBe("gpt-5.6-luna");
  });
});

describe("resolveMatchPrepReasoningEffort", () => {
  afterEach(() => {
    delete process.env.OPENAI_MATCH_PREP_REASONING_EFFORT;
  });

  it("defaults to low", () => {
    delete process.env.OPENAI_MATCH_PREP_REASONING_EFFORT;
    expect(resolveMatchPrepReasoningEffort()).toBe(
      DEFAULT_MATCH_PREP_REASONING_EFFORT,
    );
  });

  it("accepts a valid override and ignores invalid values", () => {
    process.env.OPENAI_MATCH_PREP_REASONING_EFFORT = "Medium";
    expect(resolveMatchPrepReasoningEffort()).toBe("medium");
    process.env.OPENAI_MATCH_PREP_REASONING_EFFORT = "turbo";
    expect(resolveMatchPrepReasoningEffort()).toBe(
      DEFAULT_MATCH_PREP_REASONING_EFFORT,
    );
  });
});

describe("formatMatchPrepLlmError", () => {
  it("formats OpenAI API errors with status", () => {
    const err = new OpenAI.APIError(
      400,
      { error: { message: "Unsupported parameter: temperature" } },
      "Unsupported parameter: temperature",
      undefined,
    );
    expect(formatMatchPrepLlmError(err)).toContain("HTTP 400");
    expect(formatMatchPrepLlmError(err)).toContain("temperature");
  });

  it("passes through generic Error messages", () => {
    expect(formatMatchPrepLlmError(new Error("The AI returned an empty response"))).toBe(
      "The AI returned an empty response",
    );
  });
});

describe("match prep prompt snapshot for LLM", () => {
  it("includes opponent, H2H, recent matches, and knowledge base", () => {
    const ctx: MatchPrepPromptContext = {
      plannedMatchDate: "2026-08-15",
      opponent: {
        id: "op-1",
        name: "Alex",
        playStyle: "aggressive baseliner",
        strengths: "forehand",
        weaknesses: "backhand",
        notes: "Pushes second serve",
      },
      userProfile: {
        playStyle: "all-court",
        strengths: "serve",
        weaknesses: "net",
      },
      headToHeadMatches: [
        {
          date: "2026-05-01",
          matchType: "single",
          outcome: "loss",
          score: "4-6 3-6",
          notes: null,
        },
      ],
      recentUserMatches: [
        {
          date: "2026-07-01",
          matchType: "single",
          outcome: "win",
          score: "6-4 6-2",
          opponents: ["Sam"],
          notes: null,
        },
      ],
      knowledgeBaseMarkdown: "## Tactical knowledge base\nv1.1.0",
      missingSections: [],
    };

    const md = formatMatchPrepPromptContext(ctx);
    expect(md).toContain("Alex");
    expect(md).toContain("aggressive baseliner");
    expect(md).toContain("Matches vs this opponent");
    expect(md).toContain("Your last 5 matches");
    expect(md).toContain("Tactical knowledge base");
    expect(md).not.toContain("Missing data");
  });
});
