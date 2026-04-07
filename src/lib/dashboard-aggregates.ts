/** Minimal match shape for dashboard math (keeps aggregates testable without DB). */
export type MatchForDashboard = {
  date: string;
  matchType: string;
  outcome: string | null;
  opponents: Array<{ id: string; name: string }>;
};

export function filterMatchesByDateRange(
  matches: MatchForDashboard[],
  from?: string,
  to?: string,
): MatchForDashboard[] {
  return matches.filter((m) => {
    if (from && m.date < from) return false;
    if (to && m.date > to) return false;
    return true;
  });
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
