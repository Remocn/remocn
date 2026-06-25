"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export type TooltipState = "hidden" | "visible";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  state?: TooltipState;
  style?: TooltipStyle;
  label: string;
  side?: TooltipSide;
  theme?: Partial<RemocnTheme>;
  className?: string;
}

const ARROW = 10;

export interface TooltipStyle {
  opacity: number;
  scale: number;
  translate: number;
}

export function tooltipStyle(state: TooltipState): TooltipStyle {
  switch (state) {
    case "visible":
      return { opacity: 1, scale: 1, translate: 0 };
    default:
      return { opacity: 0, scale: 0.96, translate: 4 };
  }
}

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
    default:
      return { x: 0, y: translate };
  }
}

export function Tooltip({
  state = "hidden",
  style,
  label,
  side = "top",
  theme: themeOverride,
  className,
}: TooltipProps) {
  const theme = useRemocnTheme(themeOverride, "light");
  const v = style ?? tooltipStyle(state);

  const bg = theme.foreground;
  const fg = theme.background;
  const { x, y } = offsetFor(side, v.translate);

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: ARROW,
    height: ARROW,
    background: bg,
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
          borderRadius: theme.radius + 4,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.25)",
        }}
      >
        {label}
        {}
        <span style={arrowStyle} />
      </div>
    </div>
  );
}
