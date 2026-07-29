"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { SparklinePoint } from "@/lib/dashboard-aggregates";

type MatchSparklineProps = {
  points: SparklinePoint[];
};

const CHART_HEIGHT = 120;
const BASELINE = CHART_HEIGHT / 2;
const MAX_BAR = 44;
const MIN_POINT_GAP = 14;
const HIT_WIDTH = 28;
const ZERO_DOT_R = 3.5;

function formatPointDate(date: string, time: string | null): string {
  const [y, mo, d] = date.split("-");
  if (!y || !mo || !d) return date;
  const base = `${mo}/${d}/${y.slice(2)}`;
  return time ? `${base} ${time.slice(0, 5)}` : base;
}

function outcomeColor(outcome: SparklinePoint["outcome"]): string {
  if (outcome === "win") return "#16a34a";
  if (outcome === "loss") return "#dc2626";
  return "currentColor";
}

export function MatchSparkline({ points }: MatchSparklineProps) {
  const t = useTranslations("dashboard.charts.sparkline");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  /** Skip the synthetic mouseenter that follows a touch tap on mobile. */
  const skipHoverRef = useRef(false);
  const skipHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = useMemo(() => {
    const count = points.length;
    const width = Math.max(320, count * MIN_POINT_GAP + 48);
    const gap = count > 0 ? width / (count + 1) : width;
    const maxAbs = Math.max(
      1,
      ...points.map((p) => Math.abs(p.gameDifferential)),
    );
    return { width, gap, count, maxAbs };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const activeIndex = selectedIndex ?? hoveredIndex;
  const active = activeIndex !== null ? points[activeIndex] : null;

  function outcomeLabel(outcome: SparklinePoint["outcome"]): string {
    if (outcome === "win") return t("win");
    if (outcome === "loss") return t("loss");
    return t("notFinished");
  }

  function barLength(diff: number): number {
    if (diff === 0) return 0;
    return Math.max(6, (Math.abs(diff) / layout.maxAbs) * MAX_BAR);
  }

  function selectPoint(index: number) {
    skipHoverRef.current = true;
    if (skipHoverTimerRef.current) clearTimeout(skipHoverTimerRef.current);
    skipHoverTimerRef.current = setTimeout(() => {
      skipHoverRef.current = false;
      skipHoverTimerRef.current = null;
    }, 500);
    setHoveredIndex(null);
    setSelectedIndex((prev) => (prev === index ? null : index));
  }

  function onPointerEnter(index: number) {
    if (skipHoverRef.current) return;
    setHoveredIndex(index);
  }

  function onPointerLeave() {
    if (skipHoverRef.current) return;
    setHoveredIndex(null);
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${CHART_HEIGHT}`}
          className="min-w-full touch-manipulation text-foreground [&_:focus]:outline-none"
          role="img"
          aria-label={t("ariaLabel")}
        >
          <line
            x1={layout.gap * 0.5}
            y1={BASELINE}
            x2={layout.width - layout.gap * 0.5}
            y2={BASELINE}
            stroke="currentColor"
            strokeWidth={0.75}
            opacity={0.25}
          />
          {points.map((point, index) => {
            const x = layout.gap * (index + 1);
            const isActive = activeIndex === index;
            const color = outcomeColor(point.outcome);
            const len = barLength(point.gameDifferential);
            const opacity = point.outcome === "non_finished" || point.outcome === null ? 0.55 : 1;

            return (
              <g key={point.id}>
                {isActive ? (
                  <rect
                    x={x - HIT_WIDTH / 2}
                    y={4}
                    width={HIT_WIDTH}
                    height={CHART_HEIGHT - 8}
                    rx={4}
                    fill="currentColor"
                    opacity={0.08}
                    pointerEvents="none"
                  />
                ) : null}

                {point.gameDifferential > 0 ? (
                  <>
                    <line
                      x1={x}
                      y1={BASELINE}
                      x2={x}
                      y2={BASELINE - len}
                      stroke={color}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      opacity={opacity}
                      pointerEvents="none"
                    />
                    <line
                      x1={x - 4}
                      y1={BASELINE - len}
                      x2={x + 4}
                      y2={BASELINE - len}
                      stroke={color}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      opacity={opacity}
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                {point.gameDifferential < 0 ? (
                  <>
                    <line
                      x1={x}
                      y1={BASELINE}
                      x2={x}
                      y2={BASELINE + len}
                      stroke={color}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      opacity={opacity}
                      pointerEvents="none"
                    />
                    <line
                      x1={x - 4}
                      y1={BASELINE + len}
                      x2={x + 4}
                      y2={BASELINE + len}
                      stroke={color}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      opacity={opacity}
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                {point.gameDifferential === 0 ? (
                  <circle
                    cx={x}
                    cy={BASELINE}
                    r={isActive ? ZERO_DOT_R + 1 : ZERO_DOT_R}
                    fill={color}
                    opacity={opacity}
                    pointerEvents="none"
                  />
                ) : null}

                <rect
                  x={x - HIT_WIDTH / 2}
                  y={0}
                  width={HIT_WIDTH}
                  height={CHART_HEIGHT}
                  fill="transparent"
                  className="cursor-pointer focus:outline-none"
                  style={{ outline: "none" }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedIndex === index}
                  aria-label={`${formatPointDate(point.date, point.time)} · ${outcomeLabel(point.outcome)}`}
                  onPointerUp={(event) => {
                    // Prefer pointerup so touch and mouse share one path.
                    if (event.pointerType === "touch") {
                      event.preventDefault();
                    }
                    selectPoint(index);
                  }}
                  onPointerEnter={() => onPointerEnter(index)}
                  onPointerLeave={onPointerLeave}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectPoint(index);
                    }
                  }}
                />
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
          <div className="space-y-0.5">
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
            <p className="text-xs text-muted-foreground">
              {active.score
                ? `${t("score")}: ${active.score}`
                : t("noScore")}
            </p>
          </div>
        ) : (
          <p className="text-xs">{t("hint")}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-600">↑ {t("win")}</span>
        <span className="text-red-600">↓ {t("loss")}</span>
        <span>· {t("notFinished")}</span>
        <span>· {t("heightHint")}</span>
      </div>
    </div>
  );
}
