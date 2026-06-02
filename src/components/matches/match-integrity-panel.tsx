import { checkMatchIntegrity } from "@/lib/match-score/integrity";
import type { MatchOutcome } from "@/lib/matches-validation";
import type { ScoreSegmentInput } from "@/lib/match-score/types";

type MatchIntegrityPanelProps = {
  outcome: MatchOutcome | null;
  segments: ScoreSegmentInput[];
  legacyScore?: string | null;
};

export function MatchIntegrityPanel({
  outcome,
  segments,
  legacyScore,
}: MatchIntegrityPanelProps) {
  const issues = checkMatchIntegrity({
    outcome,
    segments,
    ...(legacyScore !== undefined ? { legacyScore } : {}),
  });
  if (issues.length === 0) return null;

  return (
    <div className="mb-6 max-w-4xl rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
        Score review
      </h2>
      <ul className="mt-2 space-y-1 text-sm">
        {issues.map((issue) => (
          <li
            key={`${issue.code}-${issue.message}`}
            className={
              issue.severity === "error"
                ? "text-destructive"
                : "text-amber-900 dark:text-amber-200"
            }
          >
            {issue.severity === "error" ? "Error: " : "Note: "}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
