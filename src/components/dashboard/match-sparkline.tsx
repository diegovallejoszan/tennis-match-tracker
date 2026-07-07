"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { SparklinePoint } from "@/lib/dashboard-aggregates";

type MatchSparklineProps = {
  points: SparklinePoint[];
};

const WHISKER_LEN = 26;
const CHART_HEIGHT = 100;
const MIN_POINT_GAP = 10;

function formatPointDate(date: string, time: string | null): string {
  const [y, mo, d] = date.split("-");
  if (!y || !mo || !d) return date;
  const base = `${mo}/${d}/${y.slice(2)}`;
  return time ? `${base} ${time.slice(0, 5)}` : base;
}

export function MatchSparkline({ points }: MatchSparklineProps) {
  const t = useTranslations("dashboard.charts.sparkline");
  const [hovered, setHovered] = useState<number | null>(null);

  const layout = useMemo(() => {
    const count = points.length;
    const width = Math.max(320, count * MIN_POINT_GAP + 48);
    const baseline = CHART_HEIGHT / 2;
    const gap = count > 0 ? width / (count + 1) : width;
    return { width, baseline, gap, count };
  }, [points.length]);

  if (points.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const active = hovered !== null ? points[hovered] : null;

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${CHART_HEIGHT}`}
          className="min-w-full text-foreground"
          role="img"
          aria-label={t("ariaLabel")}
        >
          <line
            x1={layout.gap * 0.5}
            y1={layout.baseline}
            x2={layout.width - layout.gap * 0.5}
            y2={layout.baseline}
            stroke="currentColor"
            strokeWidth={0.75}
            opacity={0.25}
          />
          {points.map((point, index) => {
            const x = layout.gap * (index + 1);
            const isHovered = hovered === index;
            const strokeWidth = isHovered ? 2 : 1.25;

            if (point.outcome === "win") {
              const yTop = layout.baseline - WHISKER_LEN;
              return (
                <g
                  key={point.id}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-default"
                >
                  <line
                    x1={x}
                    y1={layout.baseline}
                    x2={x}
                    y2={yTop}
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                  />
                  <line
                    x1={x - 4}
                    y1={yTop}
                    x2={x + 4}
                    y2={yTop}
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                  />
                </g>
              );
            }

            if (point.outcome === "loss") {
              const yBottom = layout.baseline + WHISKER_LEN;
              return (
                <g
                  key={point.id}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-default"
                >
                  <line
                    x1={x}
                    y1={layout.baseline}
                    x2={x}
                    y2={yBottom}
                    stroke="#dc2626"
                    strokeWidth={strokeWidth}
                  />
                  <line
                    x1={x - 4}
                    y1={yBottom}
                    x2={x + 4}
                    y2={yBottom}
                    stroke="#dc2626"
                    strokeWidth={strokeWidth}
                  />
                </g>
              );
            }

            return (
              <circle
                key={point.id}
                cx={x}
                cy={layout.baseline}
                r={isHovered ? 4 : 3}
                fill="currentColor"
                opacity={0.45}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-default"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex min-h-[1.25rem] items-center justify-between text-xs text-muted-foreground">
        <span>
          {active
            ? `${formatPointDate(active.date, active.time)} · ${
                active.outcome === "win"
                  ? t("win")
                  : active.outcome === "loss"
                    ? t("loss")
                    : t("notFinished")
              }${
                active.opponents.length > 0
                  ? ` · ${t("vs")} ${active.opponents.join(", ")}`
                  : ""
              }`
            : t("hint")}
        </span>
        <span className="flex shrink-0 gap-3 tabular-nums">
          <span className="text-emerald-600">↑ {t("win")}</span>
          <span className="text-red-600">↓ {t("loss")}</span>
          <span>· {t("notFinished")}</span>
        </span>
      </div>
    </div>
  );
}
