import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tables = {
    players: { id: "players" },
    matchPrepAdvices: { id: "matchPrepAdvices" },
  };

  const selectWhere = vi.fn();
  const selectLimit = vi.fn(() => selectWhere());
  const selectFrom = vi.fn(() => ({
    where: vi.fn(() => ({ limit: selectLimit })),
  }));
  const selectFn = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insertFn = vi.fn(() => ({ values: insertValues }));

  return {
    tables,
    selectFn,
    selectWhere,
    selectLimit,
    insertFn,
    insertValues,
    insertReturning,
    buildContext: vi.fn(),
    generateLlm: vi.fn(),
    getLocale: vi.fn(),
    getAdviceById: vi.fn(),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/app-phase", () => ({
  isMatchPrepEnabled: vi.fn(() => true),
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.selectFn,
    insert: mocks.insertFn,
  },
  players: mocks.tables.players,
  matchPrepAdvices: mocks.tables.matchPrepAdvices,
}));

vi.mock("@/lib/match-prep/build-prep-prompt-context", () => ({
  buildMatchPrepPromptContext: mocks.buildContext,
}));

vi.mock("@/lib/match-prep/generate-advice", () => ({
  generateMatchPrepAdviceFromLlm: mocks.generateLlm,
  formatMatchPrepLlmError: (err: unknown) =>
    err instanceof Error ? err.message : "Could not generate advice. Please try again.",
}));

vi.mock("@/lib/user-locale-db", () => ({
  getUserLocale: mocks.getLocale,
}));

vi.mock("@/lib/match-prep/advice-queries", () => ({
  getMatchPrepAdviceById: mocks.getAdviceById,
}));

import { auth } from "@/lib/auth";
import { isMatchPrepEnabled } from "@/lib/app-phase";
import {
  generateMatchPrepAdviceAction,
  loadSavedMatchPrepAdviceAction,
} from "./match-prep";

const opponentId = "550e8400-e29b-41d4-a716-446655440000";

describe("generateMatchPrepAdviceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMatchPrepEnabled).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    mocks.getLocale.mockResolvedValue("en");
    mocks.selectWhere.mockResolvedValue([{ id: opponentId, name: "Alex" }]);
    mocks.buildContext.mockResolvedValue({
      plannedMatchDate: "2026-08-15",
      opponent: {
        id: opponentId,
        name: "Alex",
        playStyle: "baseliner",
        strengths: null,
        weaknesses: null,
        notes: null,
      },
      userProfile: { playStyle: null, strengths: null, weaknesses: null },
      headToHeadMatches: [],
      recentUserMatches: [],
      knowledgeBaseMarkdown: "## KB",
      missingSections: ["user_profile", "head_to_head_history", "recent_match_history"],
    });
    mocks.generateLlm.mockResolvedValue({
      adviceMarkdown: "## Tactical advice\nHit deep.\n\n## Game plan\nStay patient.",
      modelId: "gpt-5.6-terra",
    });
    mocks.insertReturning.mockResolvedValue([
      {
        id: "advice-1",
        opponentId,
        plannedMatchDate: "2026-08-15",
        adviceMarkdown: "## Tactical advice\nHit deep.\n\n## Game plan\nStay patient.",
        knowledgeBaseVersion: "1.1.0",
        modelId: "gpt-5.6-terra",
        createdAt: new Date("2026-07-30T12:00:00Z"),
      },
    ]);
  });

  it("requires authentication", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await generateMatchPrepAdviceAction({
      opponentId,
      plannedMatchDate: "2026-08-15",
    });
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("validates input", async () => {
    const result = await generateMatchPrepAdviceAction({ opponentId: "x" });
    expect(result).toEqual({
      error: "Please select an opponent and a match date.",
    });
  });

  it("rejects unknown opponents", async () => {
    mocks.selectWhere.mockResolvedValue([]);
    const result = await generateMatchPrepAdviceAction({
      opponentId,
      plannedMatchDate: "2026-08-15",
    });
    expect(result).toEqual({
      error: "Opponent not found or you do not have access.",
    });
  });

  it("persists LLM advice on success", async () => {
    const result = await generateMatchPrepAdviceAction({
      opponentId,
      plannedMatchDate: "2026-08-15",
    });

    expect(mocks.generateLlm).toHaveBeenCalled();
    expect(mocks.insertValues).toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      advice: {
        id: "advice-1",
        opponentName: "Alex",
        plannedMatchDate: "2026-08-15",
      },
    });
  });

  it("surfaces a clear error when the API key is missing", async () => {
    mocks.generateLlm.mockRejectedValue(
      new Error("OPENAI_API_KEY is not configured"),
    );
    const result = await generateMatchPrepAdviceAction({
      opponentId,
      plannedMatchDate: "2026-08-15",
    });
    expect(result).toEqual({
      error:
        "AI advice is not configured. Ask an admin to set OPENAI_API_KEY.",
    });
  });

  it("surfaces the underlying LLM error message", async () => {
    mocks.generateLlm.mockRejectedValue(
      new Error("OpenAI API error (HTTP 400): Unsupported parameter: temperature"),
    );
    const result = await generateMatchPrepAdviceAction({
      opponentId,
      plannedMatchDate: "2026-08-15",
    });
    expect(result).toEqual({
      error:
        "OpenAI API error (HTTP 400): Unsupported parameter: temperature",
    });
  });
});

describe("loadSavedMatchPrepAdviceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMatchPrepEnabled).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns saved advice without calling the LLM", async () => {
    mocks.getAdviceById.mockResolvedValue({
      id: "advice-1",
      opponentId,
      opponentName: "Alex",
      plannedMatchDate: "2026-08-15",
      adviceMarkdown: "## Game plan\nServe wide.",
      knowledgeBaseVersion: "1.1.0",
      modelId: "gpt-5.6-terra",
      createdAt: new Date("2026-07-30T12:00:00Z"),
    });

    const result = await loadSavedMatchPrepAdviceAction("advice-1");
    expect(mocks.generateLlm).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      advice: { id: "advice-1", opponentName: "Alex" },
    });
  });
});
