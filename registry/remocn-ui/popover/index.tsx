"use client";

import type { ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type PopoverState = "opened" | "closed";

export type PopoverSide = "top" | "bottom" | "left" | "right";

export interface PopoverProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: PopoverState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `PopoverStyle` from `usePopoverTransition`.
   */
  style?: PopoverStyle;
  /** Card heading. */
  title?: string;
  /** Body copy under the title. */
  description?: string;
  /**
   * Arbitrary content. Rendered after the title/description (or on its own when
   * neither is given) — covers the hover-card scenario.
   */
  children?: ReactNode;
  /**
   * Which side of the anchor the card sits on. STATIC — it sets the enter
   * translate axis/sign (the card lifts in toward the anchor). Not animated.
   */
  side?: PopoverSide;
  /** Card width in px. */
  width?: number;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

// ===========================================================================
// Popover visual — the COMPLETE animated look for a moment in time. A `state` is
// a named preset of this visual (`popoverStyle`); the smooth path feeds an
// interpolated `PopoverStyle` straight through. The component is a pure renderer
// of whichever `PopoverStyle` it receives. `translate` is a single magnitude in
// px; the component applies it on the axis/sign chosen by `side`.
// ===========================================================================

export interface PopoverStyle {
  /** Whole-card opacity 0→1. */
  opacity: number;
  /** Enter zoom 0.97→1. */
  scale: number;
  /**
   * Enter offset MAGNITUDE in px (6 closed → 0 opened). The component turns this
   * into a translateX/Y with the sign that lifts the card in toward the anchor
   * for the active `side`.
   */
  translate: number;
}

/**
 * The COMPLETE resting visual for a state — a pure `(state) => PopoverStyle` map.
 * Both presets are full keyframes; the card enters from 6px offset at 0.97 scale
 * and rests at 0/1. To change how a state looks, edit one entry.
 */
export function popoverStyle(state: PopoverState): PopoverStyle {
  switch (state) {
    case "opened":
      return { opacity: 1, scale: 1, translate: 0 };
    default:
      return { opacity: 0, scale: 0.97, translate: 6 };
  }
}

/**
 * Resolve the `translate` magnitude into a CSS transform offset for a side. The
 * card starts `translate` px on its OWN side away from the anchor and lifts back
 * toward it: side "top" (card above) enters moving up (+Y → 0), etc.
 */
function offsetFor(side: PopoverSide, translate: number): { x: number; y: number } {
  switch (side) {
    case "bottom":
      return { x: 0, y: -translate };
    case "left":
      return { x: translate, y: 0 };
    case "right":
      return { x: -translate, y: 0 };
    default: // top
      return { x: 0, y: translate };
  }
}

export function Popover({
  state = "closed",
  style,
  title,
  description,
  children,
  side = "bottom",
  width = 288,
  theme: themeOverride,
  mode,
  className,
}: PopoverProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const v = style ?? popoverStyle(state);
  const { x, y } = offsetFor(side, v.translate);

  const hasHeader = title !== undefined || description !== undefined;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        opacity: v.opacity,
        transform: `translate(${x}px, ${y}px) scale(${v.scale})`,
        transformOrigin: "center",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 16,
          background: theme.popover,
          color: theme.popoverForeground,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
          textAlign: "left",
        }}
      >
        {title !== undefined && (
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
        )}
        {description !== undefined && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: theme.mutedForeground,
            }}
          >
            {description}
          </div>
        )}
        {/* Arbitrary content sits after the header (or alone). The small top gap
            is dropped when there's no header so custom content owns the box. */}
        {children !== undefined && (
          <div style={{ marginTop: hasHeader ? 4 : 0 }}>{children}</div>
        )}
      </div>
    </div>
  );
}
