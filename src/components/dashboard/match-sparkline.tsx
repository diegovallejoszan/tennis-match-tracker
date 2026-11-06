"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { SparklinePoint } from "@/lib/dashboard-aggregates";

type MatchSparklineProps = {
  points: SparklinePoint[];
};

/**
 * The chart is drawn 1:1 in CSS pixels (fixed height, width measured from
 * the container) instead of letting the SVG scale with the card. Scaling
 * made strokes fat and soft on wide screens; this keeps them crisp.
 */
const CHART_HEIGHT = 160;
const BASELINE = CHART_HEIGHT / 2;
const MAX_BAR = 62;
const MIN_POINT_GAP = 18;
const MIN_WIDTH = 320;
const HIT_WIDTH = 28;
const ZERO_DOT_R = 4.5;
const BAR_STROKE = 3;
const BAR_STROKE_ACTIVE = 4;
const CAP_HALF = 6;

function formatPointDate(date: string, locale: string): string {
  const [y, mo, d] = date.split("-");
  if (!y || !mo || !d) return date;
  const parsed = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function outcomeColor(outcome: SparklinePoint["outcome"]): string {
  if (outcome === "win") return "hsl(var(--outcome-win))";
  if (outcome === "loss") return "hsl(var(--outcome-loss))";
  return "hsl(var(--muted-foreground))";
}

export function MatchSparkline({ points }: MatchSparklineProps) {
  const t = useTranslations("dashboard.charts.sparkline");
  const locale = useLocale();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  /** Skip the synthetic mouseenter that follows a touch tap on mobile. */
  const skipHoverRef = useRef(false);
  const skipHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setContainerWidth(Math.floor(node.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const count = points.length;
    const minWidth = Math.max(MIN_WIDTH, count * MIN_POINT_GAP + 48);
    const width = Math.max(minWidth, containerWidth);
    const gap = count > 0 ? width / (count + 1) : width;
    const maxAbs = Math.max(
      1,
      ...points.map((p) => Math.abs(p.gameDifferential)),
    );
    return { width, gap, count, maxAbs };
  }, [points, containerWidth]);

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
      <div ref={containerRef} className="relative overflow-x-auto rounded-lg">
        <svg
          width={layout.width}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${layout.width} ${CHART_HEIGHT}`}
          className="block touch-manipulation text-foreground [&_:focus]:outline-none"
          role="img"
          aria-label={t("ariaLabel")}
        >
          {/* Court halves: grass above the net (games won), clay below (games lost). */}
          <rect
            x={0}
            y={0}
            width={layout.width}
            height={BASELINE}
            fill="hsl(var(--outcome-win))"
            opacity={0.07}
            pointerEvents="none"
          />
          <rect
            x={0}
            y={BASELINE}
            width={layout.width}
            height={CHART_HEIGHT - BASELINE}
            fill="hsl(var(--outcome-loss))"
            opacity={0.07}
            pointerEvents="none"
          />
          <line
            x1={layout.gap * 0.5}
            y1={BASELINE}
            x2={layout.width - layout.gap * 0.5}
            y2={BASELINE}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.45}
          />
          {points.map((point, index) => {
            const x = layout.gap * (index + 1);
            const isActive = activeIndex === index;
            const color = outcomeColor(point.outcome);
            const len = barLength(point.gameDifferential);
            const strokeWidth = isActive ? BAR_STROKE_ACTIVE : BAR_STROKE;
            const capHalf = isActive ? CAP_HALF + 1 : CAP_HALF;

            return (
              <g key={point.id}>
                {isActive ? (
                  <rect
                    x={x - HIT_WIDTH / 2}
                    y={4}
                    width={HIT_WIDTH}
                    height={CHART_HEIGHT - 8}
                    rx={6}
                    fill="hsl(var(--highlight))"
                    opacity={0.28}
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
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                    <line
                      x1={x - capHalf}
                      y1={BASELINE - len}
                      x2={x + capHalf}
                      y2={BASELINE - len}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
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
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                    <line
                      x1={x - capHalf}
                      y1={BASELINE + len}
                      x2={x + capHalf}
                      y2={BASELINE + len}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
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
                    stroke="hsl(var(--card))"
                    strokeWidth={1.5}
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
                  aria-label={`${formatPointDate(point.date, locale)} · ${outcomeLabel(point.outcome)}`}
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
                {formatPointDate(active.date, locale)}
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
        <span className="text-outcome-win">↑ {t("win")}</span>
        <span className="text-outcome-loss">↓ {t("loss")}</span>
        <span>· {t("notFinished")}</span>
        <span>· {t("heightHint")}</span>
      </div>
    </div>
  );
}
