"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type CheckboxState = "unchecked" | "checked";

type CheckboxSize = "sm" | "default" | "lg";

export interface CheckboxProps {
  state?: CheckboxState;
  style?: CheckboxStyle;
  label?: string;
  size?: CheckboxSize;
  theme?: Partial<RemocnTheme>;
  primary?: string;
  align?: "start" | "center" | "end";
  className?: string;
}

function justify(align: "start" | "center" | "end"): string {
  return align === "start"
    ? "flex-start"
    : align === "end"
      ? "flex-end"
      : "center";
}

const CHECK_PATH_LENGTH = 14;

const SIZE_STYLES: Record<
  CheckboxSize,
  { box: number; fontSize: number; gap: number }
> = {
  sm: { box: 16, fontSize: 13, gap: 8 },
  default: { box: 20, fontSize: 15, gap: 10 },
  lg: { box: 24, fontSize: 17, gap: 12 },
};

export interface CheckboxStyle {
  boxBackground: string;
  boxBorderColor: string;
  checkOpacity: number;
  checkScale: number;
  checkDraw: number;
}

export interface CheckboxStyleContext {
  uncheckedBg: string;
  checkedBg: string;
  uncheckedBorder: string;
  checkedBorder: string;
  checkColor: string;
}

export function checkboxStyleContext(theme: RemocnTheme): CheckboxStyleContext {
  return {
    uncheckedBg: theme.background,
    checkedBg: theme.primary,
    uncheckedBorder: theme.border,
    checkedBorder: theme.primary,
    checkColor: theme.primaryForeground,
  };
}

export function checkboxStyle(
  state: CheckboxState,
  ctx: CheckboxStyleContext,
): CheckboxStyle {
  switch (state) {
    case "checked":
      return {
        boxBackground: ctx.checkedBg,
        boxBorderColor: ctx.checkedBorder,
        checkOpacity: 1,
        checkScale: 1,
        checkDraw: 1,
      };
    default:
      return {
        boxBackground: ctx.uncheckedBg,
        boxBorderColor: ctx.uncheckedBorder,
        checkOpacity: 0,
        checkScale: 0.6,
        checkDraw: 0,
      };
  }
}

export function Checkbox({
  state = "unchecked",
  style,
  label,
  size = "default",
  theme: themeOverride,
  primary,
  align = "center",
  className,
}: CheckboxProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    "light",
  );

  const sizeStyle = SIZE_STYLES[size];
  const ctx = checkboxStyleContext(theme);
  const v = style ?? checkboxStyle(state, ctx);
  const boxSize = sizeStyle.box;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: justify(align),
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
            borderRadius: Math.round(boxSize * 0.28),
            border: `1px solid ${v.boxBorderColor}`,
            background: v.boxBackground,
          }}
        >
          <svg
            width={boxSize}
            height={boxSize}
            viewBox="0 0 24 24"
            fill="none"
            style={{
              opacity: v.checkOpacity,
              transform: `scale(${v.checkScale})`,
            }}
          >
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke={ctx.checkColor}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={CHECK_PATH_LENGTH}
              strokeDasharray={CHECK_PATH_LENGTH}
              strokeDashoffset={CHECK_PATH_LENGTH * (1 - v.checkDraw)}
            />
          </svg>
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
