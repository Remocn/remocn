"use client";

import type { CSSProperties, ReactNode } from "react";

export type BlurInState = "hidden" | "revealed";
export type BlurInDirection = "up" | "down" | "left" | "right";

export interface BlurInStyle {
  blur: number;
  opacity: number;
  translateX: number;
  translateY: number;
}

export interface BlurInStyleContext {
  blur: number;
  distance: number;
  axis: "x" | "y";
  sign: 1 | -1;
}

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
  state?: BlurInState;
  style?: BlurInStyle;
  children: ReactNode;
  blur?: number;
  direction?: BlurInDirection;
  distance?: number;
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
  const v =
    style ?? blurInStyle(state, blurInStyleContext(blur, direction, distance));
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
