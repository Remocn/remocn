"use client";

import { useCurrentFrame } from "remotion";

export interface PerspectiveMarqueeProps {
  items?: string[];
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  pixelsPerFrame?: number;
  rotateY?: number;
  rotateX?: number;
  perspective?: number;
  fadeColor?: string;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const DEFAULT_ITEMS = [
  "Vercel",
  "Linear",
  "Stripe",
  "Figma",
  "Notion",
  "Raycast",
  "Arc",
  "Cursor",
];

export function PerspectiveMarquee({
  items = DEFAULT_ITEMS,
  fontSize = 84,
  color = "#fafafa",
  fontWeight = 700,
  pixelsPerFrame = 2,
  rotateY = -28,
  rotateX = 8,
  perspective = 1200,
  fadeColor = "#050505",
  speed = 1,
  className,
}: PerspectiveMarqueeProps) {
  const frame = useCurrentFrame() * speed;

  // Approximate width of one full item set so the modulo wraps cleanly.
  const itemPadding = fontSize * 0.9;
  const approxItemWidth = items.reduce(
    (acc, item) => acc + item.length * fontSize * 0.6 + itemPadding,
    0,
  );

  const offset = -((frame * pixelsPerFrame) % approxItemWidth);

  // Render the row 3x so the loop is seamless even when rotated in 3D.
  const rendered = [...items, ...items, ...items];

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        perspective: `${perspective}px`,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            transform: `translateX(${offset}px)`,
          }}
        >
          {rendered.map((item, i) => {
            // Approximate this item's center X (relative to the marquee row,
            // including the rolling offset). Used to dial in depth-of-field blur
            // and opacity by horizontal position on screen.
            const itemCenter =
              i * (approxItemWidth / items.length) +
              approxItemWidth / items.length / 2 +
              offset;
            // Normalize roughly to [-1, 1] across a 1280px viewport.
            const norm = (itemCenter - 640) / 640;
            const distance = Math.min(1, Math.abs(norm));
            const blurPx = distance * 6;
            const opacity = 1 - distance * 0.4;

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: FONT_FAMILY,
                  fontSize,
                  fontWeight,
                  color,
                  letterSpacing: "-0.03em",
                  paddingRight: itemPadding,
                  filter: `blur(${blurPx}px)`,
                  opacity,
                }}
              >
                {item}
              </span>
            );
          })}
        </div>
      </div>

      {/* Vignette to fade marquee edges into background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(90deg, ${fadeColor} 0%, transparent 18%, transparent 82%, ${fadeColor} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(180deg, ${fadeColor} 0%, transparent 25%, transparent 75%, ${fadeColor} 100%)`,
        }}
      />
    </div>
  );
}
