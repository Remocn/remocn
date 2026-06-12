"use client";

import { mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type InputState =
  | "idle"
  | "hover"
  | "active"
  | "typing"
  | "blur"
  | "invalid";

type InputSize = "sm" | "default" | "lg";

export interface InputProps {
  state?: InputState;
  style?: InputStyle;
  placeholder?: string;
  value?: string;
  size?: InputSize;
  theme?: Partial<RemocnTheme>;
  primary?: string;
  mode?: "light" | "dark";
  fullWidth?: boolean;
  className?: string;
}

const FIELD_WIDTH = 320;

const SIZE_STYLES: Record<
  InputSize,
  { height: number; padding: number; fontSize: number }
> = {
  sm: { height: 36, padding: 12, fontSize: 13 },
  default: { height: 40, padding: 14, fontSize: 15 },
  lg: { height: 48, padding: 16, fontSize: 17 },
};

export interface InputStyle {
  borderColor: string;
  ringColor: string;
  ringWidth: number;
  background: string;
  caretOpacity: number;
  valueReveal: number;
  placeholderOpacity: number;
}

export interface InputStyleContext {
  idleBorder: string;
  hoverBorder: string;
  activeBorder: string;
  invalidBorder: string;
  ring: string;
  invalidRing: string;
  background: string;
  hoverBackground: string;
  foreground: string;
  mutedForeground: string;
}

export function inputStyleContext(theme: RemocnTheme): InputStyleContext {
  return {
    idleBorder: theme.input,
    hoverBorder: mixOklch(theme.input, theme.foreground, 0.18),
    activeBorder: theme.ring,
    invalidBorder: theme.destructive,
    ring: mixOklch(theme.background, theme.ring, 0.5),
    invalidRing: mixOklch(theme.background, theme.destructive, 0.4),
    background: theme.background,
    hoverBackground: mixOklch(theme.background, theme.muted, 0.4),
    foreground: theme.foreground,
    mutedForeground: theme.mutedForeground,
  };
}

export function inputStyle(
  state: InputState,
  ctx: InputStyleContext,
): InputStyle {
  switch (state) {
    case "hover":
      return {
        borderColor: ctx.hoverBorder,
        ringColor: ctx.ring,
        ringWidth: 0,
        background: ctx.hoverBackground,
        caretOpacity: 0,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
    case "active":
      return {
        borderColor: ctx.activeBorder,
        ringColor: ctx.ring,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 1,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
    case "typing":
      return {
        borderColor: ctx.activeBorder,
        ringColor: ctx.ring,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 1,
        valueReveal: 1,
        placeholderOpacity: 0,
      };
    case "blur":
      return {
        borderColor: ctx.idleBorder,
        ringColor: ctx.ring,
        ringWidth: 0,
        background: ctx.background,
        caretOpacity: 0,
        valueReveal: 1,
        placeholderOpacity: 0,
      };
    case "invalid":
      return {
        borderColor: ctx.invalidBorder,
        ringColor: ctx.invalidRing,
        ringWidth: 3,
        background: ctx.background,
        caretOpacity: 0,
        valueReveal: 1,
        placeholderOpacity: 0,
      };
    default:
      return {
        borderColor: ctx.idleBorder,
        ringColor: ctx.ring,
        ringWidth: 0,
        background: ctx.background,
        caretOpacity: 0,
        valueReveal: 0,
        placeholderOpacity: 1,
      };
  }
}

export function Input({
  state = "idle",
  style,
  placeholder = "you@example.com",
  value = "remotion@remocn.dev",
  size = "default",
  theme: themeOverride,
  primary,
  mode,
  fullWidth = false,
  className,
}: InputProps) {
  const theme = useRemocnTheme(
    { ...themeOverride, ...(primary ? { primary } : {}) },
    mode,
  );

  const sizeStyle = SIZE_STYLES[size];
  const ctx = inputStyleContext(theme);
  const v = style ?? inputStyle(state, ctx);
  const revealed = value.slice(0, Math.round(value.length * v.valueReveal));

  return (
    <div
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
      <div
        className={className}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: fullWidth ? "100%" : FIELD_WIDTH,
          height: sizeStyle.height,
          padding: `0 ${sizeStyle.padding}px`,
          fontSize: sizeStyle.fontSize,
          letterSpacing: "-0.01em",
          background: v.background,
          border: `1px solid ${v.borderColor}`,
          borderRadius: theme.radius,
          boxShadow: `0 0 0 ${v.ringWidth}px ${v.ringColor}`,
        }}
      >
        {}
        <span
          style={{
            position: "absolute",
            left: sizeStyle.padding,
            color: ctx.mutedForeground,
            opacity: v.valueReveal > 0 ? 0 : v.placeholderOpacity,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {placeholder}
        </span>
        {}
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span style={{ whiteSpace: "nowrap", color: ctx.foreground }}>
            {revealed}
          </span>
          <span
            style={{
              flexShrink: 0,
              width: 2,
              height: Math.round(sizeStyle.fontSize * 1.1),
              borderRadius: 1,
              background: ctx.foreground,
              opacity: v.caretOpacity,
              marginLeft: revealed.length > 0 ? 4 : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
