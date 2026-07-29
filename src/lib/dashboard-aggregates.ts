/** Minimal match shape for dashboard math (keeps aggregates testable without DB). */
export type MatchForDashboard = {
  id?: string;
  date: string;
  time?: string | null;
  createdAt?: Date;
  matchType: string;
  outcome: string | null;
  score?: string | null;
  opponents: Array<{ id: string; name: string }>;
  partner?: { id: string; name: string } | null;
  scoreSegments?: Array<{
    segmentType: string;
    userGamesOrPoints: number;
    opponentGamesOrPoints: number;
  }>;
};

export type DashboardFilters = {
  from?: string;
  to?: string;
  matchType?: string;
  opponentId?: string;
  /** all | finished (win/loss) | non_finished */
  completionStatus?: string;
};

export function filterMatchesForDashboard(
  matches: MatchForDashboard[],
  filters: DashboardFilters,
): MatchForDashboard[] {
  return matches.filter((m) => {
    if (filters.from && m.date < filters.from) return false;
    if (filters.to && m.date > filters.to) return false;
    if (filters.matchType && m.matchType !== filters.matchType) return false;
    if (filters.opponentId) {
      const asOpponent = m.opponents.some((o) => o.id === filters.opponentId);
      const asPartner = m.partner?.id === filters.opponentId;
      if (!asOpponent && !asPartner) return false;
    }
    if (filters.completionStatus === "finished") {
      if (m.outcome !== "win" && m.outcome !== "loss") return false;
    } else if (filters.completionStatus === "non_finished") {
      if (m.outcome !== "non_finished") return false;
    }
    return true;
  });
}

export function filterMatchesByDateRange(
  matches: MatchForDashboard[],
  from?: string,
  to?: string,
): MatchForDashboard[] {
  const filters: DashboardFilters = {};
  if (from) filters.from = from;
  if (to) filters.to = to;
  return filterMatchesForDashboard(matches, filters);
}

function currentYearMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

export function countMatchesThisCalendarMonth(
  matches: MatchForDashboard[],
  now: Date,
): number {
  const ym = currentYearMonth(now);
  return matches.filter((m) => m.date.slice(0, 7) === ym).length;
}

export function competitiveWinLoss(matches: MatchForDashboard[]): {
  wins: number;
  losses: number;
} {
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    if (m.outcome === "win") wins += 1;
    else if (m.outcome === "loss") losses += 1;
  }
  return { wins, losses };
}

export function winRatePercent(wins: number, losses: number): number | null {
  const total = wins + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 1000) / 10;
}

export type WinRateByType = {
  wins: number;
  losses: number;
  rate: number | null;
};

/** Win rate for a single match type (singles or doubles). Excludes non_finished. */
export function winRateForMatchType(
  matches: MatchForDashboard[],
  matchType: "single" | "doubles",
): WinRateByType {
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    if (m.matchType !== matchType) continue;
    if (m.outcome === "win") wins += 1;
    else if (m.outcome === "loss") losses += 1;
  }
  return { wins, losses, rate: winRatePercent(wins, losses) };
}

export type SparklinePoint = {
  id: string;
  date: string;
  time: string | null;
  outcome: "win" | "loss" | "non_finished" | null;
  matchType: string;
  opponents: string[];
  score: string | null;
  /** Signed game differential (user − opponent). Legacy matches are 0. */
  gameDifferential: number;
  sortKey: string;
};

/**
 * Games won by the user minus games won by the opponent.
 *
 * - Counts set / long-set games only.
 * - A following standard (or super) tie-break awards the deciding set game
 *   (+1 to the TB winner) but TB/STB *points* never count.
 * - Standalone super/tie-break segments contribute 0.
 * - Legacy free-text scores (no segments) return 0.
 */
export function gameDifferentialFromSegments(
  segments:
    | Array<{
        segmentType: string;
        userGamesOrPoints: number;
        opponentGamesOrPoints: number;
      }>
    | null
    | undefined,
): number {
  if (!segments || segments.length === 0) return 0;

  let diff = 0;
  let i = 0;
  while (i < segments.length) {
    const current = segments[i]!;
    const next = segments[i + 1];
    const isSet =
      current.segmentType === "set" || current.segmentType === "long_set";
    const nextIsBreak =
      next?.segmentType === "tie_break" ||
      next?.segmentType === "super_tie_break";

    if (isSet && nextIsBreak) {
      let userGames = current.userGamesOrPoints;
      let oppGames = current.opponentGamesOrPoints;
      const isStandardTb = next.segmentType === "tie_break";
      const setTied = userGames === oppGames;
      // Standard TB always decides the set game. Match STB only does when the
      // preceding set is tied (e.g. 6-6 [10-8]); otherwise STB points are ignored.
      if (isStandardTb || setTied) {
        if (next.userGamesOrPoints > next.opponentGamesOrPoints) {
          userGames += 1;
        } else if (next.opponentGamesOrPoints > next.userGamesOrPoints) {
          oppGames += 1;
        }
      }
      diff += userGames - oppGames;
      i += 2;
      continue;
    }

    if (isSet) {
      diff += current.userGamesOrPoints - current.opponentGamesOrPoints;
      i += 1;
      continue;
    }

    // Orphan tie-break / super-tie-break points are excluded.
    i += 1;
  }

  return diff;
}

function sparklineSortKey(m: MatchForDashboard): string {
  const time = m.time?.slice(0, 8) ?? "00:00:00";
  const created = m.createdAt?.toISOString() ?? "";
  return `${m.date}T${time}#${created}`;
}

/** Per-match points ordered chronologically for the Tufte sparkline. */
export function buildSparklinePoints(
  matches: MatchForDashboard[],
): SparklinePoint[] {
  const sorted = [...matches].sort((a, b) =>
    sparklineSortKey(a).localeCompare(sparklineSortKey(b)),
  );

  return sorted.map((m, index) => {
    const outcome =
      m.outcome === "win" || m.outcome === "loss" || m.outcome === "non_finished"
        ? m.outcome
        : null;
    return {
      id: m.id ?? `idx-${index}`,
      date: m.date,
      time: m.time ?? null,
      outcome,
      matchType: m.matchType,
      opponents: m.opponents.map((o) => o.name),
      score: m.score ?? null,
      gameDifferential: gameDifferentialFromSegments(m.scoreSegments),
      sortKey: sparklineSortKey(m),
    };
  });
}

export function mostFrequentOpponent(
  matches: MatchForDashboard[],
): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const m of matches) {
    for (const op of m.opponents) {
      counts.set(op.name, (counts.get(op.name) ?? 0) + 1);
    }
  }
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && name.localeCompare(best.name) < 0)
    ) {
      best = { name, count };
    }
  }
  return best;
}

export type MonthBucket = { monthKey: string; label: string; count: number };

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const mi = Number(m) - 1;
  if (mi < 0 || mi > 11) return monthKey;
  return `${monthNames[mi]} ${y}`;
}

/** All match types: count per calendar month (YYYY-MM). */
export function matchesPerMonth(matches: MatchForDashboard[]): MonthBucket[] {
  const map = new Map<string, number>();
  for (const m of matches) {
    const key = m.date.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => ({
      monthKey,
      label: monthLabel(monthKey),
      count,
    }));
}

export type WinLossByTypeRow = {
  typeKey: string;
  label: string;
  wins: number;
  losses: number;
};

/** Singles and doubles only: stacked win/loss counts. */
export function winLossByMatchType(
  matches: MatchForDashboard[],
): WinLossByTypeRow[] {
  const acc = {
    single: { wins: 0, losses: 0 },
    doubles: { wins: 0, losses: 0 },
  };
  for (const m of matches) {
    if (m.matchType !== "single" && m.matchType !== "doubles") continue;
    const bucket = acc[m.matchType as "single" | "doubles"];
    if (m.outcome === "win") bucket.wins += 1;
    else if (m.outcome === "loss") bucket.losses += 1;
  }
  return [
    { typeKey: "single", label: "Singles", ...acc.single },
    { typeKey: "doubles", label: "Doubles", ...acc.doubles },
  ];
}

export type WinRateMonthPoint = {
  monthKey: string;
  label: string;
  winRate: number | null;
  competitiveCount: number;
};

/** Win % among competitive (win/loss) matches in each month. */
export function winRateByMonth(
  matches: MatchForDashboard[],
): WinRateMonthPoint[] {
  const byMonth = new Map<string, { wins: number; losses: number }>();
  for (const m of matches) {
    if (m.outcome !== "win" && m.outcome !== "loss") continue;
    const key = m.date.slice(0, 7);
    const row = byMonth.get(key) ?? { wins: 0, losses: 0 };
    if (m.outcome === "win") row.wins += 1;
    else row.losses += 1;
    byMonth.set(key, row);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, { wins, losses }]) => {
      const competitiveCount = wins + losses;
      return {
        monthKey,
        label: monthLabel(monthKey),
        winRate: winRatePercent(wins, losses),
        competitiveCount,
      };
    });
}
