import type { ScoreSegmentInput, SegmentType } from "./types";

function isTieScore(u: number, o: number, target: number): boolean {
  return u === target && o === target;
}

function formatSetGames(u: number, o: number): string {
  return `${u}-${o}`;
}

function formatTieBreakSuffix(loserPoints: number): string {
  return `(${loserPoints})`;
}

/**
 * Builds a canonical display score from ordered segments (user games/points first).
 */
export function formatScoreFromSegments(segments: ScoreSegmentInput[]): string {
  const parts: string[] = [];
  let i = 0;

  while (i < segments.length) {
    const current = segments[i]!;
    const next = segments[i + 1];

    if (
      (current.segmentType === "set" || current.segmentType === "long_set") &&
      next?.segmentType === "tie_break" &&
      isTieScore(
        current.userGamesOrPoints,
        current.opponentGamesOrPoints,
        current.segmentType === "long_set" ? 9 : 6,
      )
    ) {
      const u = current.userGamesOrPoints;
      const o = current.opponentGamesOrPoints;
      const tbU = next.userGamesOrPoints;
      const tbO = next.opponentGamesOrPoints;
      const userWonTb = tbU > tbO;
      const setUser = userWonTb ? u + 1 : u;
      const setOpp = userWonTb ? o : o + 1;
      const loserTbPoints = userWonTb ? tbO : tbU;
      parts.push(
        `${setUser}-${setOpp}${formatTieBreakSuffix(loserTbPoints)}`,
      );
      i += 2;
      continue;
    }

    if (current.segmentType === "super_tie_break") {
      parts.push(
        `[${current.userGamesOrPoints}-${current.opponentGamesOrPoints}]`,
      );
      i += 1;
      continue;
    }

    if (current.segmentType === "tie_break") {
      parts.push(
        `TB ${current.userGamesOrPoints}-${current.opponentGamesOrPoints}`,
      );
      i += 1;
      continue;
    }

    parts.push(
      formatSetGames(
        current.userGamesOrPoints,
        current.opponentGamesOrPoints,
      ),
    );
    i += 1;
  }

  return parts.join(" ").trim();
}

export function segmentTypeLabel(type: SegmentType): string {
  switch (type) {
    case "set":
      return "Set (to 6)";
    case "long_set":
      return "Long set (to 9)";
    case "tie_break":
      return "Tie break";
    case "super_tie_break":
      return "Super tie break";
  }
}

export function defaultSegment(type: SegmentType = "set"): ScoreSegmentInput {
  return {
    segmentType: type,
    userGamesOrPoints: 0,
    opponentGamesOrPoints: 0,
  };
}
