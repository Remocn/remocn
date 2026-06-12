"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type DialogState = "opened" | "closed";

export interface DialogProps {
  state?: DialogState;
  style?: DialogStyle;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const POPUP_WIDTH = 440;
const MAX_OVERLAY_ALPHA = 0.5;

export interface DialogStyle {
  overlayOpacity: number;
  popupOpacity: number;
  popupScale: number;
  popupTranslateY: number;
}

export interface DialogStyleContext {
  popoverBg: string;
  popoverFg: string;
  mutedFg: string;
  border: string;
  radius: number;
  actionBg: string;
  actionFg: string;
  cancelFg: string;
}

export function dialogStyleContext(theme: RemocnTheme): DialogStyleContext {
  return {
    popoverBg: theme.popover,
    popoverFg: theme.popoverForeground,
    mutedFg: theme.mutedForeground,
    border: theme.border,
    radius: theme.radius,
    actionBg: theme.primary,
    actionFg: theme.primaryForeground,
    cancelFg: theme.foreground,
  };
}

export function dialogStyle(
  state: DialogState,
  _ctx: DialogStyleContext,
): DialogStyle {
  switch (state) {
    case "opened":
      return {
        overlayOpacity: 1,
        popupOpacity: 1,
        popupScale: 1,
        popupTranslateY: 0,
      };
    default:
      return {
        overlayOpacity: 0,
        popupOpacity: 0,
        popupScale: 0.95,
        popupTranslateY: 8,
      };
  }
}

export function Dialog({
  state = "closed",
  style,
  title = "Edit profile",
  description = "Make changes to your profile here. Click save when you're done.",
  actionLabel = "Save changes",
  cancelLabel = "Cancel",
  theme: themeOverride,
  mode,
  className,
}: DialogProps) {
  const theme = useRemocnTheme(themeOverride, mode);

  const ctx = dialogStyleContext(theme);
  const v = style ?? dialogStyle(state, ctx);

  const buttonBase: React.CSSProperties = {
    height: 40,
    padding: "0 20px",
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    borderRadius: ctx.radius,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0, 0, 0, ${MAX_OVERLAY_ALPHA * v.overlayOpacity})`,
        }}
      />
      <div
        className={className}
        style={{
          position: "relative",
          width: POPUP_WIDTH,
          transform: `translateY(${v.popupTranslateY}px) scale(${v.popupScale})`,
          opacity: v.popupOpacity,
          background: ctx.popoverBg,
          color: ctx.popoverFg,
          border: `1px solid ${ctx.border}`,
          borderRadius: ctx.radius + 6,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25)",
        }}
      >
        {}
        <button
          type="button"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: ctx.radius,
            color: ctx.mutedFg,
            cursor: "pointer",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6 6 18 M6 6 18 18"
              stroke={ctx.mutedFg}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            paddingRight: 28,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: ctx.mutedFg }}>
          {description}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          {}
          <button
            type="button"
            style={{
              ...buttonBase,
              background: "transparent",
              color: ctx.cancelFg,
              border: `1px solid ${ctx.border}`,
            }}
          >
            {cancelLabel}
          </button>
          {}
          <button
            type="button"
            style={{
              ...buttonBase,
              background: ctx.actionBg,
              color: ctx.actionFg,
              border: "1px solid transparent",
            }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
