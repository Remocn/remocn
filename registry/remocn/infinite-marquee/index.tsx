"use client";

import { useCurrentFrame } from "remotion";

export interface InfiniteMarqueeProps {
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  pixelsPerFrame?: number;
  stroke?: boolean;
  strokeColor?: string;
  speed?: number;
  className?: string;
}

export function InfiniteMarquee({
  text = "ship · build · animate · ",
  fontSize = 120,
  color = "#171717",
  fontWeight = 900,
  pixelsPerFrame = 4,
  stroke = false,
  strokeColor = "#171717",
  speed = 1,
  className,
}: InfiniteMarqueeProps) {
  const frame = useCurrentFrame() * speed;

  const approxWidth = text.length * fontSize * 0.55;
  const offset = -((frame * pixelsPerFrame) % approxWidth);

  const spanStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    color: stroke ? "transparent" : color,
    WebkitTextStroke: stroke ? `2px ${strokeColor}` : undefined,
    paddingRight: "0.4em",
    letterSpacing: "-0.03em",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className={className}
        style={{
          display: "flex",
          whiteSpace: "nowrap",
          transform: `translateX(${offset}px)`,
        }}
      >
        <span style={spanStyle}>{text}</span>
        <span style={spanStyle}>{text}</span>
        <span style={spanStyle}>{text}</span>
      </div>
    </div>
  );
}
