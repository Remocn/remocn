"use client";

import { clamp01, mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export interface StepperStyle {
  position: number;
}

export type StepperOrientation = "horizontal" | "vertical";

export interface StepperProps {
  steps?: string[];
  activeIndex?: number;
  style?: StepperStyle;
  orientation?: StepperOrientation;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const DEFAULT_STEPS = ["Account", "Plan", "Done"];

const CIRCLE = 36;
const CHECK_PATH_LENGTH = 14;

export interface StepperStyleContext {
  primary: string;
  primaryFg: string;
  mutedBg: string;
  border: string;
  mutedFg: string;
  foreground: string;
}

export function stepperStyleContext(theme: RemocnTheme): StepperStyleContext {
  return {
    primary: theme.primary,
    primaryFg: theme.primaryForeground,
    mutedBg: theme.muted,
    border: theme.border,
    mutedFg: theme.mutedForeground,
    foreground: theme.foreground,
  };
}

export function stepperStyle(activeIndex: number): StepperStyle {
  return { position: activeIndex };
}

export function stepCircleAt(i: number, position: number): {
  fill: number;
  checkDraw: number;
  active: boolean;
} {
  const fill = clamp01(position - i);
  const checkDraw = fill;
  const active = Math.floor(position) === i && fill < 1;
  return { fill, checkDraw, active };
}

export function connectorFillAt(i: number, position: number): number {
  return clamp01(position - i);
}

export function Stepper({
  steps = DEFAULT_STEPS,
  activeIndex = 0,
  style,
  orientation: _orientation = "horizontal",
  theme: themeOverride,
  mode,
  className,
}: StepperProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const ctx = stepperStyleContext(theme);
  const v = style ?? stepperStyle(activeIndex);
  const position = v.position;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {steps.map((label, i) => {
          const { fill, checkDraw, active } = stepCircleAt(i, position);
          const completed = fill >= 1;
          const circleBg = mixOklch(ctx.mutedBg, ctx.primary, fill);
          const circleBorder = mixOklch(ctx.border, ctx.primary, fill);
          const numberOpacity = 1 - checkDraw;
          const numberColor = active || completed ? ctx.foreground : ctx.mutedFg;
          const isLast = i === steps.length - 1;
          return (
            <div
              key={label}
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              {}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  width: CIRCLE + 24,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: "50%",
                    background: circleBg,
                    border: `2px solid ${active ? ctx.primary : circleBorder}`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {}
                  <span
                    style={{
                      position: "absolute",
                      fontSize: 14,
                      fontWeight: 600,
                      color: numberColor,
                      opacity: numberOpacity,
                    }}
                  >
                    {i + 1}
                  </span>
                  {}
                  <svg width={CIRCLE} height={CIRCLE} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      stroke={ctx.primaryFg}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={CHECK_PATH_LENGTH}
                      strokeDasharray={CHECK_PATH_LENGTH}
                      strokeDashoffset={CHECK_PATH_LENGTH * (1 - checkDraw)}
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: active || completed ? ctx.foreground : ctx.mutedFg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
              {}
              {!isLast && (
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 2,
                    marginTop: CIRCLE / 2 - 1,
                    background: ctx.border,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${connectorFillAt(i, position) * 100}%`,
                      background: ctx.primary,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
