"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type AlertDialogState = "closed" | "opened";

export interface AlertDialogProps {
  state?: AlertDialogState;
  style?: AlertDialogStyle;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

const POPUP_WIDTH = 400;
const MAX_OVERLAY_ALPHA = 0.5;

export interface AlertDialogStyle {
  overlayOpacity: number;
  popupOpacity: number;
  popupScale: number;
  popupTranslateY: number;
}

export interface AlertDialogStyleContext {
  popoverBg: string;
  popoverFg: string;
  mutedFg: string;
  border: string;
  radius: number;
  actionBg: string;
  actionFg: string;
  cancelFg: string;
}

export function alertDialogStyleContext(
  theme: RemocnTheme,
): AlertDialogStyleContext {
  return {
    popoverBg: theme.popover,
    popoverFg: theme.popoverForeground,
    mutedFg: theme.mutedForeground,
    border: theme.border,
    radius: theme.radius,
    actionBg: theme.destructive,
    actionFg: theme.destructiveForeground,
    cancelFg: theme.foreground,
  };
}

export function alertDialogStyle(
  state: AlertDialogState,
  _ctx: AlertDialogStyleContext,
): AlertDialogStyle {
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

export function AlertDialog({
  state = "closed",
  style,
  title = "Delete account?",
  description = "This action cannot be undone. This will permanently remove your data from our servers.",
  actionLabel = "Delete",
  cancelLabel = "Cancel",
  theme: themeOverride,
  className,
}: AlertDialogProps) {
  const theme = useRemocnTheme(themeOverride, "light");

  const ctx = alertDialogStyleContext(theme);
  const v = style ?? alertDialogStyle(state, ctx);

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
        <div
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}
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
