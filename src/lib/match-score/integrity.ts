import type { MatchOutcome } from "@/lib/matches-validation";

import { formatScoreFromSegments } from "./format";
import type { IntegrityIssue, ScoreSegmentInput } from "./types";
import { countSetsWon, validateAllSegments } from "./validate";

export type MatchIntegrityInput = {
  outcome: MatchOutcome | null;
  segments: ScoreSegmentInput[];
  legacyScore?: string | null;
};

export function checkMatchIntegrity(
  input: MatchIntegrityInput,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const { outcome, segments, legacyScore } = input;
  const hasSegments = segments.length > 0;
  const hasLegacy =
    legacyScore != null && legacyScore.trim().length > 0 && !hasSegments;

  if (!hasSegments && !hasLegacy && outcome && outcome !== "non_finished") {
    issues.push({
      code: "missing_score",
      message: "Add score segments or a legacy score for completed matches",
      severity: "error",
    });
  }

  if (hasSegments) {
    issues.push(...validateAllSegments(segments));

    const formatted = formatScoreFromSegments(segments);
    if (formatted.length > 120) {
      issues.push({
        code: "score_too_long",
        message: "Generated score exceeds maximum length",
        severity: "error",
      });
    }

    if (outcome === "win" || outcome === "loss") {
      const { user, opponent } = countSetsWon(segments);
      const hasFinishedSet = user + opponent > 0;
      const hasIncompleteSet = issues.some(
        (issue) => issue.code === "set_incomplete",
      );
      const outcomeCanComeFromRetirement = hasFinishedSet && hasIncompleteSet;

      if (outcomeCanComeFromRetirement) {
        // A match can end by retirement during a later set. In that case the
        // selected result is authoritative even if completed sets favor the
        // other player.
      } else if (user === opponent && user > 0) {
        issues.push({
          code: "tied_match",
          message: "Sets are tied — match may be incomplete",
          severity: "warning",
        });
      } else if (outcome === "win" && user <= opponent) {
        issues.push({
          code: "outcome_vs_score",
          message: "Result is Win but the structured score favors your opponent",
          severity: "error",
        });
      } else if (outcome === "loss" && opponent <= user) {
        issues.push({
          code: "outcome_vs_score",
          message: "Result is Loss but the structured score favors you",
          severity: "error",
        });
      }
    }
  }

  if (outcome === "non_finished" && hasSegments) {
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length === 0) {
      const { user, opponent } = countSetsWon(segments);
      if (user !== opponent && (user >= 2 || opponent >= 2)) {
        issues.push({
          code: "looks_finished",
          message:
            "Match is marked non-finished but the score suggests a completed match",
          severity: "warning",
        });
      }
    }
  }

  return issues;
}

export function hasBlockingIntegrityIssues(issues: IntegrityIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

function segmentHasData(segment: ScoreSegmentInput): boolean {
  return (
    segment.userGamesOrPoints > 0 || segment.opponentGamesOrPoints > 0
  );
}

export function hasEnteredScoreData(segments: ScoreSegmentInput[]): boolean {
  return segments.some(segmentHasData);
}

/**
 * Live form feedback only — surfaces result/score conflicts once the user has
 * entered meaningful score data. Missing or incomplete scores are validated on
 * submit, not while the user is still filling the form.
 */
export function getLiveIntegrityMessages(
  input: MatchIntegrityInput,
): string[] {
  const { outcome, segments } = input;
  if (outcome !== "win" && outcome !== "loss") return [];
  if (!hasEnteredScoreData(segments)) return [];

  const { user, opponent } = countSetsWon(segments);
  if (user === opponent) return [];

  if (outcome === "win" && user <= opponent) {
    return ["Result is Win but the structured score favors your opponent"];
  }
  if (outcome === "loss" && opponent <= user) {
    return ["Result is Loss but the structured score favors you"];
  }
  return [];
}

/**
 * Suggests a match result from structured score segments. Returns empty string
 * when there is not enough score data to infer a result.
 */
export function suggestOutcomeFromSegments(
  segments: ScoreSegmentInput[],
): MatchOutcome | "" {
  if (!hasEnteredScoreData(segments)) return "";

  const blockingErrors = validateAllSegments(segments).filter(
    (i) => i.severity === "error",
  );
  if (blockingErrors.length > 0) return "non_finished";

  const { user, opponent } = countSetsWon(segments);
  if (user === opponent) return "non_finished";

  if (user >= 2 && user > opponent) return "win";
  if (opponent >= 2 && opponent > user) return "loss";

  if (user + opponent === 1) {
    return user > opponent ? "win" : "loss";
  }

  return "non_finished";
}
