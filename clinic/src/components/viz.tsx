"use client";

import type { ReactNode } from "react";
import { cx } from "./ui";

/* ===========================================================================
   Instruments

   Small pieces of measuring apparatus: a gauge, a ruler, a bar field, an
   annotated number. They are deliberately plain SVG and CSS gradients rather
   than a charting library, because at this size a chart library draws the
   same marks with a hundred times the weight.

   Nothing here animates on mount. A number that fades in is a number you
   cannot read yet.
   =========================================================================== */

/* ---------------------------------------------------------------- Metric */

/**
 * A headline count. Solid display type, tabular so a changing number never
 * shifts the layout under it, and tightly tracked because at this size the
 * default spacing reads as a gap rather than a figure.
 */
export function Metric({
  value,
  className,
  tone,
}: {
  value: ReactNode;
  className?: string;
  /** Any CSS colour. Defaults to the inherited ink. */
  tone?: string;
}) {
  return (
    <span
      className={cx("block font-medium tabular-nums", className)}
      style={tone ? { color: tone } : undefined}
    >
      {value}
    </span>
  );
}

/* -------------------------------------------------------------- ArcGauge */

const R = 42;
const CIRC = 2 * Math.PI * R;
const SWEEP = 0.75; // three quarters of the circle, opening at the bottom
const START_DEG = 135;

/** A 270° arc with a terminator dot, for a single ratio. */
export function ArcGauge({
  value,
  max,
  label,
  caption,
  className,
  trackClass = "text-ink/10",
  arcClass = "text-ink",
  children,
}: {
  value: number;
  max: number;
  label?: ReactNode;
  caption?: ReactNode;
  className?: string;
  trackClass?: string;
  arcClass?: string;
  children?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const track = CIRC * SWEEP;
  const angle = ((START_DEG + 270 * pct) * Math.PI) / 180;
  const dotX = 50 + R * Math.cos(angle);
  const dotY = 50 + R * Math.sin(angle);

  return (
    <div className={cx("relative grid place-items-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className="size-full -rotate-0"
        role="img"
        aria-label={
          typeof label === "string" ? `${label}: ${value} nga ${max}` : `${value} nga ${max}`
        }
      >
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${track} ${CIRC}`}
          transform={`rotate(${START_DEG} 50 50)`}
          className={trackClass}
        />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${track * pct} ${CIRC}`}
          transform={`rotate(${START_DEG} 50 50)`}
          className={arcClass}
        />
        {pct > 0 ? (
          <circle cx={dotX} cy={dotY} r="3.4" fill="currentColor" className={arcClass} />
        ) : null}
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {children}
          {caption ? <div className="mt-1 text-[11px] text-ink-3">{caption}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Ruler */

/**
 * A tick ruler. `marker` (0 to 1) drops a single tall line at that fraction,
 * which is how the reading is shown: the ticks are the scale, the line is the
 * value.
 */
export function Ruler({
  marker,
  className,
  gap = 6,
  markerClass = "bg-ink",
}: {
  marker?: number;
  className?: string;
  gap?: number;
  markerClass?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <div
        className="ruler size-full"
        style={{ ["--gap" as string]: `${gap}px` }}
        aria-hidden="true"
      />
      {marker !== undefined ? (
        <span
          className="absolute bottom-0 top-0"
          style={{ left: `${Math.min(Math.max(marker, 0), 1) * 100}%` }}
          aria-hidden="true"
        >
          <span className={cx("absolute bottom-0 top-0 w-[1.5px] rounded-full", markerClass)} />
          <span
            className={cx("absolute -top-1 size-[5px] -translate-x-[1.75px] rounded-full", markerClass)}
          />
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- Sparkbars */

/**
 * A field of thin bars. Used for load across a day: every bar is an hour, its
 * height the number of appointments in it, and `active` marks the hour the
 * clinic is in now.
 */
export function Sparkbars({
  values,
  active,
  className,
  barClass = "bg-ink/15",
  activeClass = "bg-ink",
  labels,
}: {
  values: number[];
  active?: number;
  className?: string;
  barClass?: string;
  activeClass?: string;
  labels?: string[];
}) {
  const peak = Math.max(1, ...values);

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <div className="flex h-full items-end justify-between gap-[2px]">
        {values.map((v, i) => (
          <span
            key={i}
            title={labels?.[i]}
            className={cx(
              "w-[7px] min-w-0 flex-1 rounded-full transition-[height] duration-300",
              "max-w-[9px]",
              i === active ? activeClass : barClass,
            )}
            style={{ height: `${Math.max(3, (v / peak) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Callout */

/**
 * A small annotation: a coloured square, a quiet label, a firm value. The
 * references pin these around a figure with hairlines; here they sit in a row
 * under the thing they describe, which survives a narrow screen.
 */
export function Callout({
  label,
  value,
  swatch = "bg-ink",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  swatch?: string;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      {/* The label wraps rather than truncates: "Pa konfirmuar" clipped to
          "Pa konfir..." is not a label, it is a puzzle. */}
      <div className="flex items-start gap-1.5">
        <span
          className={cx("mt-[5px] size-1.5 shrink-0 rounded-[2px]", swatch)}
          aria-hidden="true"
        />
        {/* Two lines of room, always, so a wrapped label never drops its own
            value out of line with the ones beside it. */}
        <span className="min-h-[2.2em] text-[11px] font-medium leading-tight text-ink-3">
          {label}
        </span>
      </div>
      <div className="mt-1 text-[15px] font-semibold tracking-tight text-ink">{value}</div>
    </div>
  );
}

/* --------------------------------------------------------------- Bloom */

export type BloomPalette = "amber" | "rose" | "green" | "blue" | "violet" | "quiet";

/**
 * The card shell for a light field. `focal` moves the light source, so a row
 * of tiles never blooms from the same spot twice.
 */
export function Bloom({
  palette,
  focal = [50, 64],
  className,
  children,
  as: Tag = "div",
}: {
  palette: BloomPalette;
  focal?: [number, number];
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cx("bloom", `bloom-${palette}`, className)}
      style={
        {
          "--b-x": `${focal[0]}%`,
          "--b-y": `${focal[1]}%`,
        } as Record<string, string>
      }
    >
      {children}
    </Tag>
  );
}
