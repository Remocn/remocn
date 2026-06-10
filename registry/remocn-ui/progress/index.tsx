"use client";

import { clamp01, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

// ===========================================================================
// Progress visual — the COMPLETE animated look for a moment in time. The animated
// channel here is numeric (the fill value), the accepted value-channel deviation
// from the string-`state` atoms (STYLE-GUIDE §0): `useProgressTransition` feeds an
// interpolated `ProgressStyle` straight through, exactly like `style` on a state
// atom, while the snap path is the `value` prop. The component never reads the
// frame.
// ===========================================================================

export interface ProgressStyle {
  /** Fill percentage 0–100 (clamped by the renderer). */
  value: number;
}

export interface ProgressProps {
  /**
   * Fill percentage 0–100 (snap path). Clamped to [0,100]. Ignored when `style`
   * is supplied.
   */
  value?: number;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `value` — feed it an interpolated `ProgressStyle` from `useProgressTransition`.
   */
  style?: ProgressStyle;
  /** Track width in px. */
  width?: number;
  /** Show the floored percentage to the right of the track. */
  showLabel?: boolean;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

/** Track height (px) — shadcn `h-3`. */
const TRACK_HEIGHT = 12;

/** Clamp a 0–100 value to [0,100]. Reuses core clamp01 on the normalized value. */
function clampValue(value: number): number {
  return clamp01(value / 100) * 100;
}

/**
 * A deterministic progress bar. Pure renderer of whatever value it receives — it
 * reads no frame, holds no state, runs no effects. Snap (`value`) and smooth
 * (`style`) share one render path. Placement is the caller's job; the bar renders
 * inline.
 */
export function Progress({
  value = 0,
  style,
  width = 320,
  showLabel = false,
  theme: themeOverride,
  mode,
  className,
}: ProgressProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const v = clampValue(style ? style.value : value);

  const track = theme.muted;
  const indicator = theme.primary;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Track — muted rail; the indicator fills it left-to-right by `value%`. */}
      <div
        style={{
          position: "relative",
          width,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          background: track,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${v}%`,
            borderRadius: TRACK_HEIGHT / 2,
            background: indicator,
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            color: theme.mutedForeground,
            minWidth: "3ch",
            textAlign: "right",
          }}
        >
          {Math.floor(v)}%
        </span>
      )}
    </div>
  );
}
