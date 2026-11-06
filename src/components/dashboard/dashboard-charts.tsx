"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MatchSparkline } from "@/components/dashboard/match-sparkline";
import type { SparklinePoint } from "@/lib/dashboard-aggregates";

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
  sparklinePoints: SparklinePoint[];
  winLossByType: WinLossByTypePoint[];
  winRateByMonth: WinRateMonthPoint[];
};

const GRASS = "hsl(var(--outcome-win))";
const CLAY = "hsl(var(--outcome-loss))";
const HARD_COURT = "hsl(var(--chart-1))";
const INK = "hsl(var(--foreground))";
const MUTED_INK = "hsl(var(--muted-foreground))";
const GRID = "hsl(var(--border))";

const axisTick = { fontSize: 12, fill: MUTED_INK };
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: INK,
  boxShadow: "0 6px 20px -8px hsl(var(--foreground) / 0.25)",
};
const tooltipLabelStyle = { color: INK, fontWeight: 600 };
const legendStyle = { fontSize: 12, color: MUTED_INK, paddingTop: 8 };

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm md:p-6 ${className ?? ""}`}
    >
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

export function DashboardCharts({
  sparklinePoints,
  winLossByType,
  winRateByMonth,
}: DashboardChartsProps) {
  const t = useTranslations("dashboard.charts");
  const winRateSeries = winRateByMonth.filter(
    (p) => p.competitiveCount > 0 && p.winRate !== null,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title={t("sparkline.title")}
        subtitle={t("sparkline.subtitle")}
        className="lg:col-span-2"
      >
        <MatchSparkline points={sparklinePoints} />
      </ChartCard>

      <ChartCard title={t("byType.title")} subtitle={t("byType.subtitle")}>
        {winLossByType.every((r) => r.wins === 0 && r.losses === 0) ? (
          <EmptyChart message={t("byType.empty")} />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={winLossByType}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="28%"
              >
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent))", opacity: 0.6 }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
                <Bar
                  dataKey="wins"
                  name={t("wins")}
                  stackId="wl"
                  fill={GRASS}
                  maxBarSize={72}
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="losses"
                  name={t("losses")}
                  stackId="wl"
                  fill={CLAY}
                  maxBarSize={72}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard title={t("trend.title")} subtitle={t("trend.subtitle")}>
        {winRateSeries.length === 0 ? (
          <EmptyChart message={t("trend.empty")} />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={winRateSeries}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="winRateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={HARD_COURT} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={HARD_COURT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <ReferenceLine
                  y={50}
                  stroke={MUTED_INK}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <Tooltip
                  cursor={{ stroke: HARD_COURT, strokeOpacity: 0.35 }}
                  formatter={(value) => [
                    typeof value === "number" ? `${value}%` : "—",
                    t("winRate"),
                  ]}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Area
                  type="monotone"
                  dataKey="winRate"
                  stroke="none"
                  fill="url(#winRateFill)"
                  legendType="none"
                  tooltipType="none"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  name={t("winRate")}
                  stroke={HARD_COURT}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--card))", stroke: HARD_COURT, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: HARD_COURT, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
