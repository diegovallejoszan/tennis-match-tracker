export type MatchPrepPromptContext = {
  plannedMatchDate: string;
  opponent: {
    id: string;
    name: string;
    playStyle: string | null;
    strengths: string | null;
    weaknesses: string | null;
    notes: string | null;
  } | null;
  userProfile: {
    playStyle: string | null;
    strengths: string | null;
    weaknesses: string | null;
  };
  headToHeadMatches: Array<{
    date: string;
    matchType: string;
    outcome: string | null;
    score: string | null;
    notes: string | null;
  }>;
  recentUserMatches: Array<{
    date: string;
    matchType: string;
    outcome: string | null;
    score: string | null;
    opponents: string[];
    notes: string | null;
  }>;
  knowledgeBaseMarkdown: string;
  /** Sections with no data — LLM should still advise using what is available. */
  missingSections: string[];
};

/**
 * Renders the prompt context as a single markdown document for the LLM.
 */
export function formatMatchPrepPromptContext(ctx: MatchPrepPromptContext): string {
  const sections: string[] = [
    `# Match preparation request`,
    `Planned match date: ${ctx.plannedMatchDate}`,
    "",
  ];

  if (ctx.opponent) {
    sections.push("## Opponent profile", `- Name: ${ctx.opponent.name}`);
    if (ctx.opponent.playStyle) {
      sections.push(`- Play style: ${ctx.opponent.playStyle}`);
    }
    if (ctx.opponent.strengths) {
      sections.push(`- Strengths: ${ctx.opponent.strengths}`);
    }
    if (ctx.opponent.weaknesses) {
      sections.push(`- Weaknesses: ${ctx.opponent.weaknesses}`);
    }
    if (ctx.opponent.notes) {
      sections.push(`- Notes: ${ctx.opponent.notes}`);
    }
    sections.push("");
  }

  sections.push(
    "## Your profile",
    ctx.userProfile.playStyle
      ? `- Play style: ${ctx.userProfile.playStyle}`
      : "- Play style: (not set)",
    ctx.userProfile.strengths
      ? `- Strengths: ${ctx.userProfile.strengths}`
      : "- Strengths: (not set)",
    ctx.userProfile.weaknesses
      ? `- Weaknesses: ${ctx.userProfile.weaknesses}`
      : "- Weaknesses: (not set)",
    "",
  );

  if (ctx.headToHeadMatches.length > 0) {
    sections.push("## Matches vs this opponent");
    for (const m of ctx.headToHeadMatches) {
      sections.push(
        `- ${m.date} (${m.matchType}): ${m.outcome ?? "—"} ${m.score ?? ""}${m.notes ? ` — ${m.notes}` : ""}`,
      );
    }
    sections.push("");
  }

  if (ctx.recentUserMatches.length > 0) {
    sections.push("## Your last 5 matches (any opponent)");
    for (const m of ctx.recentUserMatches) {
      sections.push(
        `- ${m.date} vs ${m.opponents.join(", ") || "—"} (${m.matchType}): ${m.outcome ?? "—"} ${m.score ?? ""}${m.notes ? ` — ${m.notes}` : ""}`,
      );
    }
    sections.push("");
  }

  if (ctx.missingSections.length > 0) {
    sections.push(
      "## Missing data",
      `The following sections have no data yet: ${ctx.missingSections.join(", ")}.`,
      "Provide advice anyway using whatever context is available.",
      "",
    );
  }

  sections.push(ctx.knowledgeBaseMarkdown);

  return sections.join("\n");
}
