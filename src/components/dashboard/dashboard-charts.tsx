"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MatchesPerMonthPoint = { label: string; count: number };
export type WinLossByTypePoint = {
  label: string;
  wins: number;
  losses: number;
};
export type WinRateMonthPoint = {
  label: string;
  winRate: number | null;
  competitiveCount: number;
};

type DashboardChartsProps = {
  matchesPerMonth: MatchesPerMonthPoint[];
  winLossByType: WinLossByTypePoint[];
  winRateByMonth: WinRateMonthPoint[];
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DashboardCharts({
  matchesPerMonth,
  winLossByType,
  winRateByMonth,
}: DashboardChartsProps) {
  const winRateSeries = winRateByMonth.filter(
    (p) => p.competitiveCount > 0 && p.winRate !== null,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 text-card-foreground shadow md:p-6">
        <h2 className="mb-1 text-lg font-semibold">Matches over time</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Total matches per month (all types).
        </p>
        {matchesPerMonth.length === 0 ? (
          <EmptyChart message="No matches in this range yet." />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={matchesPerMonth}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Matches"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 text-card-foreground shadow md:p-6">
        <h2 className="mb-1 text-lg font-semibold">Win / loss by match type</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Singles and doubles only (competitive matches).
        </p>
        {winLossByType.every((r) => r.wins === 0 && r.losses === 0) ? (
          <EmptyChart message="No competitive singles or doubles in this range." />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={winLossByType}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="wins"
                  name="Wins"
                  stackId="wl"
                  fill="#16a34a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="losses"
                  name="Losses"
                  stackId="wl"
                  fill="#dc2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 text-card-foreground shadow lg:col-span-2 md:p-6">
        <h2 className="mb-1 text-lg font-semibold">Performance trend</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Win rate by month among competitive matches (singles and doubles).
        </p>
        {winRateSeries.length === 0 ? (
          <EmptyChart message="No competitive results in this range yet." />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={winRateSeries}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number" ? `${value}%` : "—",
                    "Win rate",
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  name="Win rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
