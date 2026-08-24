"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface FogRiseProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  stagger?: number;
  blur?: number;
  tilt?: number;
  depth?: number;
  lift?: number;
  drift?: number;
  exitAt?: number;
  exitAccel?: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  spreadGap?: number;
  tracking?: number;
  resolveFrames?: number;
  fadeFrames?: number;
  speed?: number;
  className?: string;
}

export function fogRiseLength(
  text: string,
  stagger = 5,
  resolveFrames = 22,
): number {
  const chars = Array.from(text);
  if (chars.length === 0) return 0;
  const center = (chars.length - 1) / 2;
  const maxRing = Math.floor(center);
  return maxRing * stagger + resolveFrames;
}

export function FogRise({
  text,
  fontSize = 304,
  color = "#004CFF",
  fontWeight = 400,
  stagger = 5,
  blur = 0.17,
  tilt = 55,
  depth = 5,
  lift = 0.85,
  drift = 0.005,
  exitAt = 60,
  exitAccel = 0.04,
  mass = 1.3,
  stiffness = 60,
  damping = 13,
  spreadGap = 0.07,
  tracking = -0.07,
  resolveFrames = 22,
  fadeFrames = 18,
  speed = 1,
  className,
}: FogRiseProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const chars = Array.from(text);
  const center = (chars.length - 1) / 2;
  const minRing = chars.length % 2 === 0 ? 0.5 : 0;
  const maxRing = Math.floor(center);

  const converge = spring({
    frame,
    fps,
    config: { mass, stiffness, damping },
  });
  const angle = tilt * (1 - converge);
  const liftY = lift * fontSize * (1 - converge);
  const driftY = drift * fontSize * frame;
  const exitT = exitAt > 0 ? Math.max(frame - exitAt, 0) : 0;
  const exitY = 0.5 * exitAccel * exitT * exitT * fontSize;
  const gap = spreadGap * fontSize * (1 - converge);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "6%",
        whiteSpace: "nowrap",
        perspective: `${depth * fontSize}px`,
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          transform: `translateY(${liftY - driftY - exitY}px) rotateX(${-angle}deg)`,
          transformOrigin: "50% 100%",
          fontSize,
          fontWeight,
          color,
          letterSpacing: `${tracking}em`,
          lineHeight: 1.15,
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {chars.map((char, j) => {
          const ring = Math.abs(j - center) - minRing;
          const startAt = ring * stagger;

          const opacity = interpolate(
            frame,
            [startAt, startAt + fadeFrames],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const charBlur =
            blur *
            fontSize *
            interpolate(frame, [0, maxRing * stagger + resolveFrames], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

          return (
            <span
              key={j}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                marginRight: j < chars.length - 1 ? gap : undefined,
                opacity,
                filter: charBlur > 0.05 ? `blur(${charBlur}px)` : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
