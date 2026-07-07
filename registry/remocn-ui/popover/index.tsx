"use client";

import type { ReactNode } from "react";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type PopoverState = "opened" | "closed";

export type PopoverSide = "top" | "bottom" | "left" | "right";

export interface PopoverProps {
  state?: PopoverState;
  style?: PopoverStyle;
  title?: string;
  description?: string;
  children?: ReactNode;
  side?: PopoverSide;
  width?: number;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

export interface PopoverStyle {
  opacity: number;
  scale: number;
  translate: number;
}

export function popoverStyle(state: PopoverState): PopoverStyle {
  switch (state) {
    case "opened":
      return { opacity: 1, scale: 1, translate: 0 };
    default:
      return { opacity: 0, scale: 0.97, translate: 6 };
  }
}

function offsetFor(
  side: PopoverSide,
  translate: number,
): { x: number; y: number } {
  switch (side) {
    case "bottom":
      return { x: 0, y: -translate };
    case "left":
      return { x: translate, y: 0 };
    case "right":
      return { x: -translate, y: 0 };
    default:
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
  className,
}: PopoverProps) {
  const theme = useRemocnTheme(themeOverride, "light");
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
        {}
        {children !== undefined && (
          <div style={{ marginTop: hasHeader ? 4 : 0 }}>{children}</div>
        )}
      </div>
    </div>
  );
}
