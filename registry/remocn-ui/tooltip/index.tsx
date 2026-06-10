"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type TooltipState = "hidden" | "visible";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: TooltipState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `TooltipStyle` from `useTooltipTransition`.
   */
  style?: TooltipStyle;
  /** Tooltip text. */
  label: string;
  /**
   * Which side of the anchor the tooltip sits on. STATIC — it sets the enter
   * translate axis/sign (the bubble slides in toward the anchor) and which edge
   * the arrow points from. Not animated.
   */
  side?: TooltipSide;
  theme?: Partial<RemocnTheme>;
  mode?: "light" | "dark";
  className?: string;
}

/** Arrow half-size (px); the diamond is `ARROW` square, rotated 45°. */
const ARROW = 10;

// ===========================================================================
// Tooltip visual — the COMPLETE animated look for a moment in time. A `state` is
// a named preset of this visual (`tooltipStyle`); the smooth path feeds an
// interpolated `TooltipStyle` straight through. The component is a pure renderer
// of whichever `TooltipStyle` it receives. `translate` is a single magnitude in
// px; the component applies it on the axis/sign chosen by `side`.
// ===========================================================================

export interface TooltipStyle {
  /** Whole-tooltip opacity 0→1. */
  opacity: number;
  /** Enter zoom 0.96→1. */
  scale: number;
  /**
   * Enter offset MAGNITUDE in px (4 hidden → 0 visible). The component turns
   * this into a translateX/Y with the sign that slides the bubble in toward the
   * anchor for the active `side`.
   */
  translate: number;
}

/**
 * The COMPLETE resting visual for a state — a pure `(state) => TooltipStyle` map.
 * Both presets are full keyframes; the tooltip enters from 4px offset at 0.96
 * scale and rests at 0/1. To change how a state looks, edit one entry.
 */
export function tooltipStyle(state: TooltipState): TooltipStyle {
  switch (state) {
    case "visible":
      return { opacity: 1, scale: 1, translate: 0 };
    default:
      return { opacity: 0, scale: 0.96, translate: 4 };
  }
}

/**
 * Resolve the `translate` magnitude into a CSS transform offset for a side. The
 * bubble starts `translate` px on its OWN side away from the anchor and slides
 * back toward it: side "top" (bubble above) enters moving up (+Y → 0), etc.
 */
function offsetFor(
  side: TooltipSide,
  translate: number,
): {
  x: number;
  y: number;
} {
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

export function Tooltip({
  state = "hidden",
  style,
  label,
  side = "top",
  theme: themeOverride,
  mode,
  className,
}: TooltipProps) {
  const theme = useRemocnTheme(themeOverride, mode);
  const v = style ?? tooltipStyle(state);

  // Actual current shadcn tooltip look: an INVERTED bubble — `bg-foreground` +
  // `text-background` (dark-on-light in light mode), not the primary accent.
  const bg = theme.foreground;
  const fg = theme.background;
  const { x, y } = offsetFor(side, v.translate);

  // The arrow diamond is centered on the edge facing the anchor. We position it
  // by the side opposite to `side` (top tooltip → arrow on its bottom edge).
  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: ARROW,
    height: ARROW,
    background: bg,
    // shadcn arrow is a rotated square with softly rounded corners (rounded-[2px]).
    borderRadius: 2,
    transform: "rotate(45deg)",
    ...(side === "top" && {
      bottom: -ARROW / 2,
      left: "50%",
      marginLeft: -ARROW / 2,
    }),
    ...(side === "bottom" && {
      top: -ARROW / 2,
      left: "50%",
      marginLeft: -ARROW / 2,
    }),
    ...(side === "left" && {
      right: -ARROW / 2,
      top: "50%",
      marginTop: -ARROW / 2,
    }),
    ...(side === "right" && {
      left: -ARROW / 2,
      top: "50%",
      marginTop: -ARROW / 2,
    }),
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        opacity: v.opacity,
        transform: `translate(${x}px, ${y}px) scale(${v.scale})`,
        transformOrigin: "center",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "6px 12px",
          background: bg,
          color: fg,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          // shadcn `rounded-xl` ≈ theme.radius + 4 (repo radius ~8 → ~12).
          borderRadius: theme.radius + 4,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.25)",
        }}
      >
        {label}
        {/* The arrow sits OUTSIDE the bubble's rounded box but behind its text;
            it is clipped to a small diamond and shares the bubble background. */}
        <span style={arrowStyle} />
      </div>
    </div>
  );
}
