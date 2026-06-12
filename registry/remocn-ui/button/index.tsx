"use client";

import { Spinner } from "@/components/remocn/spinner";
import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type ButtonState = "idle" | "hover" | "press" | "loading" | "success";

type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";

type ButtonSize = "sm" | "default" | "lg";

export interface ButtonProps {
  state?: ButtonState;
  style?: ButtonStyle;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: Partial<RemocnTheme>;
  primary?: string;
  mode?: "light" | "dark";
  speed?: number;
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
  ButtonSize,
  { height: number; padding: string; fontSize: number; gap: number }
> = {
  sm: { height: 32, padding: "0 12px", fontSize: 13, gap: 6 },
  default: { height: 40, padding: "0 20px", fontSize: 15, gap: 8 },
  lg: { height: 48, padding: "0 28px", fontSize: 17, gap: 10 },
};

interface VariantTokens {
  bg: string;
  fg: string;
  hoverBg: string;
  border: string;
}

function variantTokens(
  variant: ButtonVariant,
  theme: RemocnTheme,
): VariantTokens {
  const variants = {
    secondary: {
      bg: theme.secondary,
      fg: theme.secondaryForeground,
      hoverBg: mixOklch(theme.secondary, theme.muted, 1),
      border: "transparent",
    },
    destructive: {
      bg: theme.destructive,
      fg: theme.destructiveForeground,
      hoverBg: mixOklch(theme.destructive, theme.foreground, 0.12),
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      fg: theme.foreground,
      hoverBg: theme.accent,
      border: theme.border,
    },
    ghost: {
      bg: "transparent",
      fg: theme.foreground,
      hoverBg: theme.accent,
      border: "transparent",
    },
    default: {
      bg: theme.primary,
      fg: theme.primaryForeground,
      hoverBg: mixOklch(theme.primary, theme.foreground, 0.1),
      border: "transparent",
    },
  };

  return variants[variant] ?? variants.default;
}

export interface ButtonStyle {
  translateY: number;
  scale: number;
  background: string;
  labelOpacity: number;
  spinnerOpacity: number;
  checkOpacity: number;
}

export interface ButtonStyleContext {
  restBg: string;
  hoverBg: string;
  pressBg: string;
  primary: string;
}

export function buttonStyleContext(
  variant: ButtonVariant,
  theme: RemocnTheme,
): ButtonStyleContext {
  const tokens = variantTokens(variant, theme);
  const restBg = tokens.bg === "transparent" ? theme.background : tokens.bg;
  return {
    restBg,
    hoverBg: tokens.hoverBg,
    pressBg:
      tokens.bg === "transparent"
        ? tokens.hoverBg
        : mixOklch(tokens.hoverBg, theme.foreground, 0.08),
    primary: theme.primary,
  };
}

export function buttonStyle(
  state: ButtonState,
  ctx: ButtonStyleContext,
): ButtonStyle {
  switch (state) {
    case "hover":
      return {
        translateY: -1,
        scale: 1,
        background: ctx.hoverBg,
        labelOpacity: 1,
        spinnerOpacity: 0,
        checkOpacity: 0,
      };
    case "press":
      return {
        translateY: -1,
        scale: 0.97,
        background: ctx.pressBg,
        labelOpacity: 1,
        spinnerOpacity: 0,
        checkOpacity: 0,
      };
    case "loading":
      return {
        translateY: -1,
        scale: 1,
        background: ctx.hoverBg,
        labelOpacity: 0,
        spinnerOpacity: 1,
        checkOpacity: 0,
      };
    case "success":
      return {
        translateY: -1,
        scale: 1,
        background: ctx.primary,
        labelOpacity: 0,
        spinnerOpacity: 0,
        checkOpacity: 1,
      };
    default:
      return {
        translateY: 0,
        scale: 1,
        background: ctx.restBg,
        labelOpacity: 1,
        spinnerOpacity: 0,
        checkOpacity: 0,
      };
  }
}

export function Button({
  state = "idle",
  style,
  label = "Continue",
  variant = "default",
  size = "default",
  theme: themeOverride,
  primary,
  mode,
  speed = 1,
  align = "center",
  className,
}: ButtonProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    mode,
  );

  const sizeStyle = SIZE_STYLES[size];
  const tokens = variantTokens(variant, theme);

  const ctx = buttonStyleContext(variant, theme);
  const v = style ?? buttonStyle(state, ctx);
  const iconSize = Math.round(sizeStyle.fontSize * 1.1);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: justify(align),
        background: theme.background,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <button
        type="button"
        className={className}
        style={{
          position: "relative",
          transform: `translateY(${v.translateY}px) scale(${v.scale})`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: sizeStyle.gap,
          height: sizeStyle.height,
          padding: sizeStyle.padding,
          fontSize: sizeStyle.fontSize,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: tokens.fg,
          background: v.background,
          border:
            variant === "outline"
              ? `1px solid ${tokens.border}`
              : "1px solid transparent",
          borderRadius: theme.radius,
          cursor: "pointer",
        }}
      >
        {}
        <span style={{ position: "relative", display: "inline-flex" }}>
          <span style={{ opacity: v.labelOpacity }}>{label}</span>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: v.spinnerOpacity,
            }}
          >
            <Spinner color={tokens.fg} speed={speed} size={iconSize} />
          </span>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: v.checkOpacity,
            }}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke={tokens.fg}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_PATH_LENGTH}
                strokeDashoffset={0}
                pathLength={CHECK_PATH_LENGTH}
              />
            </svg>
          </span>
        </span>
      </button>
    </div>
  );
}
