import type { IntegrityIssue, ScoreSegmentInput } from "./types";

function winner(u: number, o: number): "user" | "opponent" | "tie" {
  if (u > o) return "user";
  if (o > u) return "opponent";
  return "tie";
}

function validateStandardSet(
  u: number,
  o: number,
  target: number,
  label: string,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  if (u < 0 || o < 0) {
    issues.push({
      code: "negative_games",
      message: `${label}: games cannot be negative`,
      severity: "error",
    });
    return issues;
  }
  if (u > target + 2 || o > target + 2) {
    issues.push({
      code: "games_too_high",
      message: `${label}: score looks too high for a ${target}-game set`,
      severity: "warning",
    });
  }
  const w = winner(u, o);
  if (w === "tie" && u === target && o === target) {
    return issues;
  }
  if (w === "tie") {
    issues.push({
      code: "set_tied",
      message: `${label}: set cannot end in a tie unless ${target}-${target} (add a tie break)`,
      severity: "error",
    });
    return issues;
  }
  const winGames = Math.max(u, o);
  const loseGames = Math.min(u, o);
  if (winGames < target) {
    issues.push({
      code: "set_incomplete",
      message: `${label}: winner needs at least ${target} games`,
      severity: "warning",
    });
    return issues;
  }
  if (winGames === target && winGames - loseGames < 2) {
    issues.push({
      code: "set_margin",
      message: `${label}: must win by 2 games at ${target}-${loseGames} or play a tie break at ${target}-${target}`,
      severity: "error",
    });
  }
  if (winGames === target + 1 && loseGames < target) {
    issues.push({
      code: "set_invalid_seven",
      message: `${label}: invalid ${winGames}-${loseGames} — use a tie break after ${target}-${target}`,
      severity: "error",
    });
  }
  return issues;
}

function validateTieBreak(
  u: number,
  o: number,
  minWin: number,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  if (u < 0 || o < 0) {
    issues.push({
      code: "negative_points",
      message: "Tie break: points cannot be negative",
      severity: "error",
    });
    return issues;
  }
  const w = winner(u, o);
  if (w === "tie") {
    issues.push({
      code: "tb_tied",
      message: "Tie break cannot end tied",
      severity: "error",
    });
    return issues;
  }
  const winPts = Math.max(u, o);
  const losePts = Math.min(u, o);
  if (winPts < minWin) {
    issues.push({
      code: "tb_incomplete",
      message: `Tie break: winner needs at least ${minWin} points`,
      severity: "warning",
    });
    return issues;
  }
  if (winPts - losePts < 2) {
    issues.push({
      code: "tb_margin",
      message: "Tie break: must win by 2 points",
      severity: "error",
    });
  }
  return issues;
}

export function validateSegment(
  segment: ScoreSegmentInput,
  index: number,
): IntegrityIssue[] {
  const { segmentType, userGamesOrPoints: u, opponentGamesOrPoints: o } =
    segment;
  const label = `Segment ${index + 1}`;

  switch (segmentType) {
    case "set":
      return validateStandardSet(u, o, 6, label);
    case "long_set":
      return validateStandardSet(u, o, 9, label);
    case "tie_break":
      return validateTieBreak(u, o, 7);
    case "super_tie_break":
      return validateTieBreak(u, o, 10);
    default:
      return [
        {
          code: "unknown_type",
          message: `${label}: unknown segment type`,
          severity: "error",
        },
      ];
  }
}

export function validateAllSegments(
  segments: ScoreSegmentInput[],
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  segments.forEach((seg, i) => {
    issues.push(...validateSegment(seg, i));
  });

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg.segmentType === "tie_break" && i > 0) {
      const prev = segments[i - 1]!;
      const target = prev.segmentType === "long_set" ? 9 : 6;
      if (
        (prev.segmentType === "set" || prev.segmentType === "long_set") &&
        !(
          prev.userGamesOrPoints === target &&
          prev.opponentGamesOrPoints === target
        )
      ) {
        issues.push({
          code: "tb_without_tie",
          message: `Segment ${i + 1}: tie break should follow a ${target}-${target} set`,
          severity: "warning",
        });
      }
    }
  }

  return issues;
}

export function countSetsWon(
  segments: ScoreSegmentInput[],
): { user: number; opponent: number } {
  let user = 0;
  let opponent = 0;
  let i = 0;
  while (i < segments.length) {
    const current = segments[i]!;
    const next = segments[i + 1];
    if (
      (current.segmentType === "set" || current.segmentType === "long_set") &&
      next?.segmentType === "tie_break"
    ) {
      const tbU = next.userGamesOrPoints;
      const tbO = next.opponentGamesOrPoints;
      if (tbU > tbO) user += 1;
      else if (tbO > tbU) opponent += 1;
      i += 2;
      continue;
    }
    if (
      current.segmentType === "set" ||
      current.segmentType === "long_set"
    ) {
      const w = winner(
        current.userGamesOrPoints,
        current.opponentGamesOrPoints,
      );
      if (w === "user") user += 1;
      else if (w === "opponent") opponent += 1;
    }
    if (current.segmentType === "super_tie_break") {
      const w = winner(
        current.userGamesOrPoints,
        current.opponentGamesOrPoints,
      );
      if (w === "user") user += 1;
      else if (w === "opponent") opponent += 1;
    }
    i += 1;
  }
  return { user, opponent };
}
