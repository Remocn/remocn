"use client";

import type { ReactNode } from "react";
import { clamp01, mixOklch, type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type ResizableHandleState = "idle" | "hover" | "press";

export type ResizableDirection = "horizontal" | "vertical";

export interface ResizableStyle {
  ratio: number;
  handleScale: number;
  handleRingOpacity: number;
}

export interface ResizableProps {
  first?: ReactNode;
  second?: ReactNode;
  direction?: ResizableDirection;
  ratio?: number;
  handleState?: ResizableHandleState;
  style?: ResizableStyle;
  minRatio?: number;
  maxRatio?: number;
  width?: number;
  height?: number;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

const DIVIDER = 1;
const GRIP_LONG = 24;
const GRIP_SHORT = 4;
const RING_WIDTH = 4;

function clampRatio(ratio: number, minRatio: number, maxRatio: number): number {
  return Math.min(maxRatio, Math.max(minRatio, ratio));
}

export function resizableHandleStyle(handleState: ResizableHandleState): {
  handleScale: number;
  handleRingOpacity: number;
} {
  switch (handleState) {
    case "hover":
      return { handleScale: 1.15, handleRingOpacity: 1 };
    case "press":
      return { handleScale: 1.25, handleRingOpacity: 1 };
    default:
      return { handleScale: 1, handleRingOpacity: 0 };
  }
}

export interface ResizableStyleContext {
  containerBg: string;
  border: string;
  panelBg: string;
  grip: string;
  ring: string;
  placeholderFg: string;
  radius: number;
}

export function resizableStyleContext(theme: RemocnTheme): ResizableStyleContext {
  return {
    containerBg: theme.background,
    border: theme.border,
    panelBg: theme.muted,
    grip: theme.border,
    ring: mixOklch(theme.ring, theme.background, 0.6),
    placeholderFg: theme.mutedForeground,
    radius: theme.radius,
  };
}

export function resizableStyle(
  ratio: number,
  handleState: ResizableHandleState,
): ResizableStyle {
  const handle = resizableHandleStyle(handleState);
  return {
    ratio,
    handleScale: handle.handleScale,
    handleRingOpacity: handle.handleRingOpacity,
  };
}

function Placeholder({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color,
      }}
    >
      {label}
    </div>
  );
}

export function Resizable({
  first,
  second,
  direction = "horizontal",
  ratio = 0.5,
  handleState = "idle",
  style,
  minRatio = 0.15,
  maxRatio = 0.85,
  width = 440,
  height = 240,
  theme: themeOverride,
  className,
}: ResizableProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const ctx = resizableStyleContext(theme);

  const v = style ?? resizableStyle(ratio, handleState);
  const pct = clampRatio(v.ratio, minRatio, maxRatio) * 100;
  const isHorizontal = direction === "horizontal";

  const gripW = isHorizontal ? GRIP_SHORT : GRIP_LONG;
  const gripH = isHorizontal ? GRIP_LONG : GRIP_SHORT;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          background: ctx.containerBg,
          border: `1px solid ${ctx.border}`,
          borderRadius: ctx.radius,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {}
        <div
          style={{
            flex: "none",
            [isHorizontal ? "width" : "height"]: `${pct}%`,
            background: ctx.panelBg,
            overflow: "hidden",
          }}
        >
          {first ?? <Placeholder label="Panel one" color={ctx.placeholderFg} />}
        </div>
        {}
        <div
          style={{
            position: "relative",
            flex: "none",
            [isHorizontal ? "width" : "height"]: DIVIDER,
            background: ctx.border,
          }}
        >
          {}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: gripW + RING_WIDTH * 2,
              height: gripH + RING_WIDTH * 2,
              transform: `translate(-50%, -50%) scale(${v.handleScale})`,
              borderRadius: 999,
              background: ctx.ring,
              opacity: v.handleRingOpacity,
            }}
          />
          {}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: gripW,
              height: gripH,
              transform: `translate(-50%, -50%) scale(${v.handleScale})`,
              borderRadius: 999,
              background: ctx.grip,
            }}
          />
        </div>
        {}
        <div
          style={{
            flex: "1 1 0",
            background: ctx.panelBg,
            overflow: "hidden",
          }}
        >
          {second ?? <Placeholder label="Panel two" color={ctx.placeholderFg} />}
        </div>
      </div>
    </div>
  );
}
