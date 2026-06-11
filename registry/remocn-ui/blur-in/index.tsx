"use client";

import type { CSSProperties, ReactNode } from "react";

export type BlurInState = "hidden" | "revealed";
export type BlurInDirection = "up" | "down" | "left" | "right";

// ===========================================================================
// BlurIn visual — the COMPLETE animated look for a moment in time. A `state`
// is a named preset of this visual (`blurInStyle`); the smooth path feeds an
// interpolated `BlurInStyle` straight through. The component is a pure
// renderer of whichever `BlurInStyle` it receives — it reads NO frame.
//
// THEME-INDEPENDENT (the one deviation from the other state atoms): BlurIn
// carries no colors. It wraps a SINGLE child and reveals it with blur +
// opacity + a directional offset, so its "context" is a MOTION config
// (blur/distance/axis/sign), NOT a theme. There are no theme/mode/primary
// props. The frame is read only by `useBlurInTransition` (caller-side), exactly
// like `input`.
// ===========================================================================

export interface BlurInStyle {
  /** Animated blur radius in px. 0 = sharp. */
  blur: number;
  /** Child opacity 0→1. */
  opacity: number;
  /** Horizontal offset in px (the directional slide-into-place). */
  translateX: number;
  /** Vertical offset in px (the directional slide-into-place). */
  translateY: number;
}

/** The resolved MOTION config — the directional offset for the hidden preset. */
export interface BlurInStyleContext {
  blur: number;
  distance: number;
  axis: "x" | "y";
  sign: 1 | -1;
}

/**
 * Derive the motion config for a direction. Pure — call it once and reuse the
 * result for every `blurInStyle(state, ctx)` preset.
 *
 * `direction` is the way the child travels INTO place: `up` starts BELOW
 * (+Y), `down` starts above (−Y), `left` starts to the right (+X), `right`
 * starts to the left (−X).
 */
export function blurInStyleContext(
  blur: number,
  direction: BlurInDirection,
  distance: number,
): BlurInStyleContext {
  const axis: "x" | "y" =
    direction === "left" || direction === "right" ? "x" : "y";
  const sign: 1 | -1 = direction === "up" || direction === "left" ? 1 : -1;
  return { blur, distance, axis, sign };
}

/**
 * The COMPLETE resting visual for a state — a pure `(state, ctx) => BlurInStyle`
 * map. To change how a state looks, edit one entry.
 */
export function blurInStyle(
  state: BlurInState,
  ctx: BlurInStyleContext,
): BlurInStyle {
  if (state === "revealed")
    return { blur: 0, opacity: 1, translateX: 0, translateY: 0 };
  return {
    blur: ctx.blur,
    opacity: 0,
    translateX: ctx.axis === "x" ? ctx.sign * ctx.distance : 0,
    translateY: ctx.axis === "y" ? ctx.sign * ctx.distance : 0,
  };
}

export interface BlurInProps {
  /** Current visual state (snap path). State changes snap (no enter-tweens). */
  state?: BlurInState;
  /**
   * Resolved animated visual (smooth path). When provided, takes precedence over
   * `state` — feed it an interpolated `BlurInStyle` from `useBlurInTransition`.
   */
  style?: BlurInStyle;
  /** The single element revealed by the blur/opacity/offset. */
  children: ReactNode;
  /** Hidden-state blur radius in px. */
  blur?: number;
  /** Direction the child travels INTO place. */
  direction?: BlurInDirection;
  /** Hidden-state offset distance in px (0 disables the slide). */
  distance?: number;
  /** CSS `display` for the wrapper (inline-block by default so it sizes to the child). */
  display?: CSSProperties["display"];
  className?: string;
}

export function BlurIn({
  state = "hidden",
  style,
  children,
  blur = 8,
  direction = "up",
  distance = 12,
  display = "inline-block",
  className,
}: BlurInProps) {
  const v = style ?? blurInStyle(state, blurInStyleContext(blur, direction, distance));
  return (
    <div
      className={className}
      style={{
        display,
        opacity: v.opacity,
        filter: v.blur > 0 ? `blur(${v.blur}px)` : "none",
        transform: `translate(${v.translateX}px, ${v.translateY}px)`,
      }}
    >
      {children}
    </div>
  );
}
