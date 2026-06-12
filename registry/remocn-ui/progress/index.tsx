"use client";

import { clamp01, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export interface ProgressStyle {
  value: number;
}

export interface ProgressProps {
  value?: number;
  style?: ProgressStyle;
  width?: number;
  showLabel?: boolean;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const TRACK_HEIGHT = 12;

function clampValue(value: number): number {
  return clamp01(value / 100) * 100;
}

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
      {}
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
