"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type AlertDialogState = "closed" | "opened";

export interface AlertDialogProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: AlertDialogState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `AlertDialogStyle` from `useAlertDialogTransition`.
   */
  style?: AlertDialogStyle;
  /** Headline of the alert. */
  title?: string;
  /** Body copy under the title. */
  description?: string;
  /** Label of the confirming (destructive) action. */
  actionLabel?: string;
  /** Label of the dismissing action. */
  cancelLabel?: string;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

/** Popup card width (px). */
const POPUP_WIDTH = 400;
/** Backdrop dim at full reveal — the overlay opacity scales up to this alpha. */
const MAX_OVERLAY_ALPHA = 0.5;

// ===========================================================================
// Alert-dialog visual — the COMPLETE animated look for a moment in time. A
// `state` is a named preset of this visual (`alertDialogStyle`); the smooth
// path feeds an interpolated `AlertDialogStyle` straight through. The component
// is a pure renderer of whichever `AlertDialogStyle` it receives.
// ===========================================================================

export interface AlertDialogStyle {
  /** Backdrop dim reveal 0→1 (scales `MAX_OVERLAY_ALPHA`). */
  overlayOpacity: number;
  /** Popup fade 0→1. */
  popupOpacity: number;
  /** Popup zoom 0.95→1. */
  popupScale: number;
  /** Popup lift 8→0 (px). */
  popupTranslateY: number;
}

/** Concrete colors for the active theme, resolved once per render. */
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

/**
 * Derive the concrete colors for a theme. Pure — call it once and reuse the
 * result for every `alertDialogStyle(state, ctx)` preset.
 */
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

/**
 * The COMPLETE resting visual for a state — a pure `(state, ctx) => AlertDialogStyle`
 * map. To change how a state looks, edit one entry.
 */
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
  mode,
  className,
}: AlertDialogProps) {
  const theme = useRemocnTheme(themeOverride, mode);

  const ctx = alertDialogStyleContext(theme);
  const v = style ?? alertDialogStyle(state, ctx);

  // Shared base for the two footer buttons. These are plain inline `<button>`s,
  // not the remocn `Button` component — that renders a full-frame scene wrapper
  // (absolute inset) and so can't nest inline here; the sizing mirrors its
  // `default` size.
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
    // The wrapper is TRANSPARENT — unlike button/accordion (which paint an
    // opaque `theme.background`), this atom is a modal layer meant to compose
    // OVER another scene, so it must not blanket the frame with a background.
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
      {/* Backdrop dim — fades in as the dialog opens. */}
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
          {/* Cancel — outline variant. */}
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
          {/* Action — destructive variant. */}
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
