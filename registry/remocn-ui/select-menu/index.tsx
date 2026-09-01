"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type SelectMenuState = string;

export type SelectMenuVariant = "soft" | "solid";

export interface SelectMenuProps {
  options?: string[];
  selectedIndex?: number;
  state?: SelectMenuState;
  style?: SelectMenuStyle;
  variant?: SelectMenuVariant;
  align?: "start" | "center" | "end";
  theme?: Partial<RemocnTheme>;
  className?: string;
}

const WIDTH = 300;
const PAD = 4;
const ROW_HEIGHT = 44;
const ROW_GAP = 6;
const ACCENT_BAR = 3;
const LABEL_L_PAD = 18;
const CHECK_SIZE = 18;
const PRESS_DIP = 0.03;
const PRESS_TINT = 0.05;

function justify(align: "start" | "center" | "end"): string {
  return align === "start"
    ? "flex-start"
    : align === "end"
      ? "flex-end"
      : "center";
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

const DEFAULT_OPTIONS: string[] = ["New Game", "Continue", "Settings", "Quit"];

export interface SelectMenuStyle {
  indicatorOffset: number;
  press: number;
  selectProgress: number;
}

export interface SelectMenuStyleContext {
  options: string[];
  variant: SelectMenuVariant;
  highlightBg: string;
  highlightFg: string;
  accent: string;
  inactiveFg: string;
  border: string;
  radius: number;
  foreground: string;
}

export function selectMenuStyleContext(
  options: string[],
  variant: SelectMenuVariant,
  theme: RemocnTheme,
): SelectMenuStyleContext {
  const soft = variant === "soft";
  return {
    options,
    variant,
    highlightBg: soft ? theme.accent : theme.primary,
    highlightFg: soft ? theme.foreground : theme.primaryForeground,
    accent: soft ? theme.primary : theme.primaryForeground,
    inactiveFg: theme.mutedForeground,
    border: theme.border,
    radius: theme.radius,
    foreground: theme.foreground,
  };
}

export function selectMenuStyle(
  selectedIndex: number,
  ctx: SelectMenuStyleContext,
): SelectMenuStyle {
  return {
    indicatorOffset: Math.max(
      0,
      Math.min(ctx.options.length - 1, selectedIndex),
    ),
    press: 0,
    selectProgress: 1,
  };
}

export function SelectMenu({
  options = DEFAULT_OPTIONS,
  selectedIndex,
  state,
  style,
  variant = "soft",
  align = "center",
  theme: themeOverride,
  className,
}: SelectMenuProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const ctx = selectMenuStyleContext(options, variant, theme);

  const snapIndex =
    selectedIndex !== undefined
      ? selectedIndex
      : state !== undefined
        ? options.indexOf(state)
        : 0;
  const v = style ?? selectMenuStyle(snapIndex, ctx);

  const pressDepth = clamp01(v.press ?? 0);
  const selectProgress = clamp01(v.selectProgress ?? 0);

  const listHeight =
    PAD * 2 + options.length * ROW_HEIGHT + (options.length - 1) * ROW_GAP;
  const step = ROW_HEIGHT + ROW_GAP;

  const highlightTop = PAD + v.indicatorOffset * step;
  const highlightInset = PAD;

  const isSoft = ctx.variant === "soft";
  const highlightBackground = mixOklch(
    ctx.highlightBg,
    ctx.foreground,
    PRESS_TINT * pressDepth,
  );

  return (
    <div
      className={className}
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
      <div
        style={{
          position: "relative",
          width: WIDTH,
          height: listHeight,
          boxSizing: "border-box",
        }}
      >
        {/* Outer track — an outline panel for the soft product look. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: ctx.radius,
            border: isSoft ? `1px solid ${ctx.border}` : "none",
          }}
        />
        {/* Sliding highlight: background + left accent bar */}
        <div
          style={{
            position: "absolute",
            top: highlightTop,
            left: highlightInset,
            width: WIDTH - highlightInset * 2,
            height: ROW_HEIGHT,
            boxSizing: "border-box",
            borderRadius: Math.max(2, ctx.radius - 2),
            background: highlightBackground,
            border: isSoft ? `1px solid ${ctx.border}` : "none",
            overflow: "hidden",
          }}
        >
          {/* Left accent bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: ACCENT_BAR,
              background: ctx.accent,
            }}
          />
        </div>

        {/* Rows */}
        {options.map((option, i) => {

          const proximity = Math.max(0, 1 - Math.abs(i - v.indicatorOffset));
          const onRow = proximity >= 0.65 ? 1 : 0;
          const scale = 1 - PRESS_DIP * pressDepth * proximity;
          const proxGate = clamp01((proximity - 0.85) / 0.15);
          const checkOpacity = selectProgress * proxGate;
          return (
            <div
              key={option}
              style={{
                position: "absolute",
                top: PAD + i * step,
                left: highlightInset,
                width: WIDTH - highlightInset * 2,
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingLeft: LABEL_L_PAD,
                paddingRight: 12,
                boxSizing: "border-box",
                transform: `scale(${scale})`,
                transformOrigin: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: onRow ? 600 : 500,
                  letterSpacing: "0.01em",
                  color: mixOklch(ctx.inactiveFg, ctx.highlightFg, proximity),
                }}
              >
                {option}
              </span>
              <svg
                width={CHECK_SIZE}
                height={CHECK_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                style={{ flexShrink: 0, opacity: checkOpacity }}
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke={ctx.highlightFg}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
