"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type SwitchState = "unchecked" | "checked";

type SwitchSize = "sm" | "default" | "lg";

export interface SwitchProps {
  state?: SwitchState;
  style?: SwitchStyle;
  label?: string;
  size?: SwitchSize;
  theme?: Partial<RemocnTheme>;
  primary?: string;
  className?: string;
}

const SIZE_STYLES: Record<
  SwitchSize,
  { trackW: number; trackH: number; thumb: number; pad: number; fontSize: number; gap: number }
> = {
  sm:      { trackW: 36, trackH: 20, thumb: 16, pad: 2, fontSize: 13, gap: 8 },
  default: { trackW: 44, trackH: 24, thumb: 20, pad: 2, fontSize: 15, gap: 10 },
  lg:      { trackW: 52, trackH: 28, thumb: 24, pad: 2, fontSize: 17, gap: 12 },
};

export interface SwitchStyle {
  trackBackground: string;
  thumbOffset: number;
}

export interface SwitchStyleContext {
  uncheckedTrack: string;
  checkedTrack: string;
  thumbColor: string;
}

export function switchStyleContext(theme: RemocnTheme): SwitchStyleContext {
  return {
    uncheckedTrack: theme.input,
    checkedTrack: theme.primary,
    thumbColor: theme.background,
  };
}

export function switchStyle(
  state: SwitchState,
  ctx: SwitchStyleContext,
): SwitchStyle {
  switch (state) {
    case "checked":
      return {
        trackBackground: ctx.checkedTrack,
        thumbOffset: 1,
      };
    default:
      return {
        trackBackground: ctx.uncheckedTrack,
        thumbOffset: 0,
      };
  }
}

export function Switch({
  state = "unchecked",
  style,
  label,
  size = "default",
  theme: themeOverride,
  primary,
  className,
}: SwitchProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    "light",
  );

  const sizeStyle = SIZE_STYLES[size];
  const ctx = switchStyleContext(theme);
  const v = style ?? switchStyle(state, ctx);

  const travel = sizeStyle.trackW - sizeStyle.thumb - sizeStyle.pad * 2;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: sizeStyle.gap,
        }}
      >
        {}
        <span
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: sizeStyle.trackW,
            height: sizeStyle.trackH,
            borderRadius: sizeStyle.trackH / 2,
            background: v.trackBackground,
          }}
        >
          {}
          <span
            style={{
              position: "absolute",
              left: sizeStyle.pad,
              width: sizeStyle.thumb,
              height: sizeStyle.thumb,
              borderRadius: "50%",
              background: ctx.thumbColor,
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              transform: `translateX(${v.thumbOffset * travel}px)`,
            }}
          />
        </span>
        {label !== undefined && (
          <span
            style={{
              fontSize: sizeStyle.fontSize,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: theme.foreground,
            }}
          >
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
