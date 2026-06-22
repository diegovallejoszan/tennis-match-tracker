import { describe, expect, it } from "vitest";

import { formatKnowledgeBaseForLlm, KNOWLEDGE_BASE_VERSION } from "./knowledge-base";
import { formatMatchPrepPromptContext } from "./format-prep-prompt";

describe("formatKnowledgeBaseForLlm", () => {
  it("includes version and tactics for a known play style", () => {
    const md = formatKnowledgeBaseForLlm({ opponentPlayStyle: "aggressive baseliner" });
    expect(md).toContain(`v${KNOWLEDGE_BASE_VERSION}`);
    expect(md).toContain("Aggressive baseliner");
    expect(md).toContain("Curated sources");
    expect(md).toContain("Relevant tactics");
  });

  it("still returns content when play style is unknown", () => {
    const md = formatKnowledgeBaseForLlm({ opponentPlayStyle: null });
    expect(md).toContain("All-court player");
  });
});

describe("formatMatchPrepPromptContext", () => {
  it("lists missing sections and still includes knowledge base", () => {
    const md = formatMatchPrepPromptContext({
      plannedMatchDate: "2026-06-20",
      opponent: null,
      userProfile: { playStyle: null, strengths: null, weaknesses: null },
      headToHeadMatches: [],
      recentUserMatches: [],
      knowledgeBaseMarkdown: "## Tactical knowledge base\nSample",
      missingSections: ["opponent_profile", "head_to_head_history"],
    });

    expect(md).toContain("2026-06-20");
    expect(md).toContain("Missing data");
    expect(md).toContain("opponent_profile");
    expect(md).toContain("Provide advice anyway");
    expect(md).toContain("Sample");
  });
});
