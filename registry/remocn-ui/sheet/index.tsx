"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type SheetState = "opened" | "closed";

export interface SheetProps {
  state?: SheetState;
  style?: SheetStyle;
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

const SHEET_WIDTH = 400;
const MAX_OVERLAY_ALPHA = 0.5;

export interface SheetStyle {
  overlayOpacity: number;
  panelOpacity: number;
  panelTranslateX: number;
}

export interface SheetStyleContext {
  popoverBg: string;
  popoverFg: string;
  mutedFg: string;
  border: string;
  radius: number;
  actionBg: string;
  actionFg: string;
  cancelFg: string;
}

export function sheetStyleContext(theme: RemocnTheme): SheetStyleContext {
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

export function sheetStyle(
  state: SheetState,
  _ctx: SheetStyleContext,
): SheetStyle {
  switch (state) {
    case "opened":
      return {
        overlayOpacity: 1,
        panelOpacity: 1,
        panelTranslateX: 0,
      };
    default:
      return {
        overlayOpacity: 0,
        panelOpacity: 0,
        panelTranslateX: SHEET_WIDTH,
      };
  }
}

export function Sheet({
  state = "closed",
  style,
  title = "Edit profile",
  description = "Make changes to your profile here. Click save when you're done.",
  actionLabel = "Save changes",
  cancelLabel = "Cancel",
  theme: themeOverride,
  mode,
  className,
}: SheetProps) {
  const theme = useRemocnTheme(themeOverride, mode);

  const ctx = sheetStyleContext(theme);
  const v = style ?? sheetStyle(state, ctx);

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
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: SHEET_WIDTH,
          transform: `translateX(${v.panelTranslateX}px)`,
          opacity: v.panelOpacity,
          background: ctx.popoverBg,
          color: ctx.popoverFg,
          borderLeft: `1px solid ${ctx.border}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "-24px 0 48px -12px rgba(0,0,0,0.25)",
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
            marginTop: "auto",
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
