"use client";

import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface SpotlightCardProps {
  title?: string;
  body?: string;
  cardWidth?: number;
  cardHeight?: number;
  glowSize?: number;
  glowOpacity?: number;
  cardColor?: string;
  textColor?: string;
  mutedColor?: string;
  speed?: number;
  className?: string;
  children?: ReactNode;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Smooth synthetic cursor path: a slow Lissajous figure-8 that tours the
 * card surface so the spotlight is always moving but never repeats jerkily.
 * Returns coordinates in card-local space (0..cardWidth, 0..cardHeight).
 */
function cursorAt(
  frame: number,
  cardWidth: number,
  cardHeight: number,
  durationInFrames: number,
) {
  const t = (frame / durationInFrames) * Math.PI * 2;
  const x = cardWidth / 2 + Math.sin(t) * (cardWidth * 0.42);
  const y = cardHeight / 2 + Math.sin(t * 2) * (cardHeight * 0.32);
  return { x, y };
}

export function SpotlightCard({
  title = "Spotlight Card",
  body = "Soft radial light follows the cursor, picking out the microborder.",
  cardWidth = 520,
  cardHeight = 320,
  glowSize = 600,
  glowOpacity = 0.08,
  cardColor = "#0a0a0a",
  textColor = "#fafafa",
  mutedColor = "#71717a",
  speed = 1,
  className,
  children,
}: SpotlightCardProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  // 1-frame inertia: spotlight lags the cursor by a frame for organic feel.
  const cursor = cursorAt(
    Math.max(0, frame - 1),
    cardWidth,
    cardHeight,
    durationInFrames,
  );

  // Card fades up briefly at the start so the preview has a clean entrance.
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const surfaceGlow = `radial-gradient(${glowSize}px circle at ${cursor.x}px ${cursor.y}px, rgba(255,255,255,${glowOpacity}), transparent 40%)`;
  const borderGlow = `radial-gradient(${glowSize * 0.6}px circle at ${cursor.x}px ${cursor.y}px, rgba(255,255,255,0.35), transparent 40%)`;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Border glow wrapper — 1px padding + masked radial gradient. */}
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          borderRadius: 20,
          padding: 1,
          background: borderGlow,
          opacity: cardOpacity,
        }}
      >
        {/* Card surface */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 19,
            background: cardColor,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Surface glow underlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: surfaceGlow,
              pointerEvents: "none",
            }}
          />

          {/* Card content */}
          <div
            style={{
              position: "relative",
              padding: 36,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            {children ?? (
              <>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: textColor,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: mutedColor,
                    maxWidth: 360,
                  }}
                >
                  {body}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
