"use client";

import { clamp01, mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type SliderThumbState = "idle" | "hover" | "press";

export interface SliderStyle {
  value: number;
  thumbScale: number;
  ringOpacity: number;
}

export interface SliderProps {
  value?: number;
  thumbState?: SliderThumbState;
  style?: SliderStyle;
  width?: number;
  showValue?: boolean;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const TRACK_HEIGHT = 8;
const THUMB_HEIGHT = 16;
const THUMB_WIDTH = 24;
const THUMB_RADIUS = THUMB_HEIGHT / 2;
const RING_WIDTH = 4;

function clampValue(value: number): number {
  return clamp01(value / 100) * 100;
}

export function sliderThumbStyle(thumbState: SliderThumbState): {
  thumbScale: number;
  ringOpacity: number;
} {
  switch (thumbState) {
    case "hover":
      return { thumbScale: 1.1, ringOpacity: 1 };
    case "press":
      return { thumbScale: 1.15, ringOpacity: 1 };
    default:
      return { thumbScale: 1, ringOpacity: 0 };
  }
}

export interface SliderStyleContext {
  track: string;
  range: string;
  thumbBg: string;
  thumbRing: string;
  ring: string;
  valueText: string;
}

export function sliderStyleContext(theme: RemocnTheme): SliderStyleContext {
  return {
    track: mixOklch(theme.input, theme.background, 0.1),
    range: theme.primary,
    thumbBg: "oklch(1 0 0)",
    thumbRing: "rgba(0, 0, 0, 0.1)",
    ring: mixOklch(theme.ring, theme.background, 0.7),
    valueText: theme.foreground,
  };
}

export function Slider({
  value = 0,
  thumbState = "idle",
  style,
  width = 320,
  showValue = false,
  theme: themeOverride,
  mode,
  className,
}: SliderProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = sliderStyleContext(theme);

  const thumb = sliderThumbStyle(thumbState);
  const v: SliderStyle = style ?? {
    value,
    thumbScale: thumb.thumbScale,
    ringOpacity: thumb.ringOpacity,
  };
  const pct = clampValue(v.value);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width,
        height: THUMB_HEIGHT,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          background: ctx.track,
        }}
      >
        {}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: TRACK_HEIGHT / 2,
            background: ctx.range,
          }}
        />
      </div>
      {}
      <div
        style={{
          position: "absolute",
          left: `${pct}%`,
          top: "50%",
          transform: `translate(-50%, -50%) scale(${v.thumbScale})`,
        }}
      >
        {}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: THUMB_WIDTH + RING_WIDTH * 2,
            height: THUMB_HEIGHT + RING_WIDTH * 2,
            transform: "translate(-50%, -50%)",
            borderRadius: THUMB_RADIUS + RING_WIDTH,
            background: ctx.ring,
            opacity: v.ringOpacity,
          }}
        />
        {}
        <div
          style={{
            position: "relative",
            width: THUMB_WIDTH,
            height: THUMB_HEIGHT,
            borderRadius: THUMB_RADIUS,
            background: ctx.thumbBg,
            boxShadow: `0 0 0 1px ${ctx.thumbRing}, 0 2px 4px rgba(0,0,0,0.18)`,
          }}
        />
        {showValue && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: "100%",
              marginBottom: 8,
              transform: "translateX(-50%)",
              fontSize: 12,
              fontWeight: 500,
              fontVariantNumeric: "tabular-nums",
              color: ctx.valueText,
            }}
          >
            {Math.round(pct)}
          </span>
        )}
      </div>
    </div>
  );
}
