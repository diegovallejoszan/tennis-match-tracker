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
/** Invisible hit area width so thin whiskers are easy to tap on mobile. */
const HIT_WIDTH = 28;

function formatPointDate(date: string, time: string | null): string {
  const [y, mo, d] = date.split("-");
  if (!y || !mo || !d) return date;
  const base = `${mo}/${d}/${y.slice(2)}`;
  return time ? `${base} ${time.slice(0, 5)}` : base;
}

export function MatchSparkline({ points }: MatchSparklineProps) {
  const t = useTranslations("dashboard.charts.sparkline");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const active = activeIndex !== null ? points[activeIndex] : null;

  function selectPoint(index: number) {
    setActiveIndex((prev) => (prev === index ? null : index));
  }

  function outcomeLabel(outcome: SparklinePoint["outcome"]): string {
    if (outcome === "win") return t("win");
    if (outcome === "loss") return t("loss");
    return t("notFinished");
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${CHART_HEIGHT}`}
          className="min-w-full touch-manipulation text-foreground"
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
            const isActive = activeIndex === index;
            const strokeWidth = isActive ? 2.25 : 1.25;

            const hitRect = (
              <rect
                x={x - HIT_WIDTH / 2}
                y={0}
                width={HIT_WIDTH}
                height={CHART_HEIGHT}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => selectPoint(index)}
                onMouseEnter={() => setActiveIndex(index)}
                role="button"
                tabIndex={0}
                aria-label={`${formatPointDate(point.date, point.time)} · ${outcomeLabel(point.outcome)}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectPoint(index);
                  }
                }}
              />
            );

            if (point.outcome === "win") {
              const yTop = layout.baseline - WHISKER_LEN;
              return (
                <g key={point.id}>
                  <line
                    x1={x}
                    y1={layout.baseline}
                    x2={x}
                    y2={yTop}
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                    pointerEvents="none"
                  />
                  <line
                    x1={x - 4}
                    y1={yTop}
                    x2={x + 4}
                    y2={yTop}
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                    pointerEvents="none"
                  />
                  {hitRect}
                </g>
              );
            }

            if (point.outcome === "loss") {
              const yBottom = layout.baseline + WHISKER_LEN;
              return (
                <g key={point.id}>
                  <line
                    x1={x}
                    y1={layout.baseline}
                    x2={x}
                    y2={yBottom}
                    stroke="#dc2626"
                    strokeWidth={strokeWidth}
                    pointerEvents="none"
                  />
                  <line
                    x1={x - 4}
                    y1={yBottom}
                    x2={x + 4}
                    y2={yBottom}
                    stroke="#dc2626"
                    strokeWidth={strokeWidth}
                    pointerEvents="none"
                  />
                  {hitRect}
                </g>
              );
            }

            return (
              <g key={point.id}>
                <circle
                  cx={x}
                  cy={layout.baseline}
                  r={isActive ? 4 : 3}
                  fill="currentColor"
                  opacity={0.45}
                  pointerEvents="none"
                />
                {hitRect}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        className={`rounded-md border px-3 py-2 text-sm ${
          active
            ? "border-border bg-muted/40 text-foreground"
            : "border-transparent text-muted-foreground"
        }`}
        aria-live="polite"
      >
        {active ? (
          <p>
            <span className="font-medium">
              {formatPointDate(active.date, active.time)}
            </span>
            {" · "}
            {outcomeLabel(active.outcome)}
            {active.opponents.length > 0
              ? ` · ${t("vs")} ${active.opponents.join(", ")}`
              : ""}
          </p>
        ) : (
          <p className="text-xs">{t("hint")}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-600">↑ {t("win")}</span>
        <span className="text-red-600">↓ {t("loss")}</span>
        <span>· {t("notFinished")}</span>
      </div>
    </div>
  );
}
