"use client";

import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type AccordionUnfoldProps = {
  /** Lockup printed across the card. Use a color that reads on `color`. Falls back to a placeholder "remocn" lockup. */
  children?: React.ReactNode;
  /** Number of vertical pleats. */
  panels?: number;
  /** Paper color of the card. */
  color?: string;
  /** Darkness of the panels facing away from the light, 0 to 1. */
  shade?: number;
  backgroundColor?: string;
  /** Fold angle of each pleat at the start, in degrees. */
  foldAngle?: number;
  speed?: number;
};

export const accordionUnfoldDefaults = {
  panels: 6,
  color: "#FFFFFF",
  shade: 0.55,
  backgroundColor: "#111111",
  foldAngle: 82,
  speed: 1,
};

const START = 4;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const PLACEHOLDER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// Neutral lockup shown when no children are passed.
function PlaceholderLockup({
  mark,
  dot,
  text,
  scale = 1,
}: {
  mark: string;
  dot: string;
  text: string;
  scale?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 * scale }}>
      <div
        style={{
          width: 120 * scale,
          height: 120 * scale,
          borderRadius: 32 * scale,
          backgroundColor: mark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: "50%",
            backgroundColor: dot,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: PLACEHOLDER_FONT,
          fontSize: 104 * scale,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
        }}
      >
        remocn
      </span>
    </div>
  );
}

export function AccordionUnfold(props: AccordionUnfoldProps) {
  const { children, panels, color, shade, backgroundColor, foldAngle, speed } =
    { ...accordionUnfoldDefaults, ...props };
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const n = Math.max(2, Math.round(panels));
  const cardW = Math.round(Math.min(width * 0.66, height * 1.3));
  const cardH = Math.round(Math.min(height * 0.4, cardW * 0.4));
  const pw = cardW / n;

  const open = spring({
    frame: t - START,
    fps,
    config: { damping: 15, stiffness: 70, mass: 0.9 },
  });
  const theta = foldAngle * (1 - open);
  const rad = (theta * Math.PI) / 180;
  // Keep the pleated stack centered while its projected width grows.
  const shift = (cardW - cardW * Math.cos(rad)) / 2;
  const lift = interpolate(t, [0, START + 2], [0.92, 1], clamp);
  const appear = interpolate(t, [0, 3], [0, 1], clamp);
  const flat = Math.abs(theta) < 0.3;

  const print = (offset: number) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: -offset,
        width: cardW,
        height: cardH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children ?? (
        <PlaceholderLockup
          mark={backgroundColor}
          dot={color}
          text={backgroundColor}
          scale={0.8}
        />
      )}
    </div>
  );

  const panel = (i: number): React.ReactNode => {
    if (i >= n) return null;
    const angle = i === 0 ? theta : (i % 2 === 1 ? -2 : 2) * theta;
    const facing = i % 2 === 0 ? 1 : -1;
    const tilt = Math.abs(Math.sin(rad));
    const darkness = facing > 0 ? shade * tilt : shade * 0.25 * tilt;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: i === 0 ? 0 : pw,
          width: pw,
          height: cardH,
          transformOrigin: "0% 50%",
          transform: `rotateY(${angle}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            // A hair of bleed hides antialiased seams between pleats.
            width: pw + 1,
            overflow: "hidden",
            backgroundColor: color,
            backfaceVisibility: "hidden",
          }}
        >
          {print(i * pw)}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                facing > 0
                  ? `linear-gradient(90deg, rgba(0,0,0,${darkness * 0.6}), rgba(0,0,0,${darkness}))`
                  : `linear-gradient(90deg, rgba(255,255,255,${0.12 * tilt}), rgba(0,0,0,${darkness}))`,
            }}
          />
        </div>
        {panel(i + 1)}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        perspective: cardW * 1.8,
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardW,
          height: cardH,
          opacity: appear,
          transform: `translateX(${shift}px) scale(${lift})`,
          transformStyle: "preserve-3d",
        }}
      >
        {flat ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: color,
              overflow: "hidden",
            }}
          >
            {print(0)}
          </div>
        ) : (
          panel(0)
        )}
      </div>
    </AbsoluteFill>
  );
}
