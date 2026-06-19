"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type RadioState = "unchecked" | "checked";

type RadioSize = "sm" | "default" | "lg";

export interface RadioProps {
  state?: RadioState;
  style?: RadioStyle;
  label?: string;
  size?: RadioSize;
  theme?: Partial<RemocnTheme>;
  primary?: string;
  className?: string;
}

const SIZE_STYLES: Record<
  RadioSize,
  { box: number; fontSize: number; gap: number }
> = {
  sm: { box: 16, fontSize: 13, gap: 8 },
  default: { box: 20, fontSize: 15, gap: 10 },
  lg: { box: 24, fontSize: 17, gap: 12 },
};

export interface RadioStyle {
  ringBorderColor: string;
  dotOpacity: number;
  dotScale: number;
}

export interface RadioStyleContext {
  uncheckedBorder: string;
  checkedBorder: string;
  dotColor: string;
}

export function radioStyleContext(theme: RemocnTheme): RadioStyleContext {
  return {
    uncheckedBorder: theme.border,
    checkedBorder: theme.primary,
    dotColor: theme.primary,
  };
}

export function radioStyle(
  state: RadioState,
  ctx: RadioStyleContext,
): RadioStyle {
  switch (state) {
    case "checked":
      return {
        ringBorderColor: ctx.checkedBorder,
        dotOpacity: 1,
        dotScale: 1,
      };
    default:
      return {
        ringBorderColor: ctx.uncheckedBorder,
        dotOpacity: 0,
        dotScale: 0.4,
      };
  }
}

export function Radio({
  state = "unchecked",
  style,
  label,
  size = "default",
  theme: themeOverride,
  primary,
  className,
}: RadioProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    "light",
  );

  const sizeStyle = SIZE_STYLES[size];
  const ctx = radioStyleContext(theme);
  const v = style ?? radioStyle(state, ctx);
  const boxSize = sizeStyle.box;

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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: boxSize,
            height: boxSize,
            borderRadius: "50%",
            border: `1px solid ${v.ringBorderColor}`,
            background: theme.background,
          }}
        >
          {}
          <span
            style={{
              width: Math.round(boxSize * 0.45),
              height: Math.round(boxSize * 0.45),
              borderRadius: "50%",
              background: ctx.dotColor,
              opacity: v.dotOpacity,
              transform: `scale(${v.dotScale})`,
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
