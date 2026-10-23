"use client";

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type InflateProps = {
  /** Wordmark revealed beside the mark once it settles. */
  children?: React.ReactNode;
  backgroundColor?: string;
  /** Body color of the mark. */
  color?: string;
  /** Specular highlight color. */
  highlight?: string;
  /** Dot inside the mark. */
  dotColor?: string;
  speed?: number;
};

export const inflateDefaults = {
  backgroundColor: "#111111",
  color: "#E5322D",
  highlight: "#FFFFFF",
  dotColor: "#111111",
  speed: 1,
};

const PUFF = 3;
const WOBBLE = 10;
const DOT = 15;
const SLIDE = 22;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function Inflate(props: InflateProps) {
  const { children, backgroundColor, color, highlight, dotColor, speed } = {
    ...inflateDefaults,
    ...props,
  };
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const size = Math.round(Math.min(width, height) * 0.22);

  // Main puff: an underdamped spring overshoots the final size.
  const puff = spring({
    frame: t - PUFF,
    fps,
    config: { damping: 8, stiffness: 150, mass: 0.6 },
  });
  // After the peak the body squashes wide and rings out like a balloon.
  const w0 = t - WOBBLE;
  const wobble =
    w0 > 0 ? 0.2 * Math.exp(-w0 / 6) * Math.sin((w0 / 9) * Math.PI * 2) : 0;

  const grow = Math.max(0, puff);
  const sliverW = interpolate(t, [0, PUFF], [0.7, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const bodyH = size * (0.05 + 0.95 * grow) * (1 - wobble);
  const bodyW = size * (sliverW + (Math.max(1, grow) - 1) * 0.8) * (1 + wobble);
  const roundness = interpolate(t, [PUFF, PUFF + 7, 26], [0.5, 0.46, 0.27], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const radius = Math.min(bodyW, bodyH) * roundness;
  const gloss = interpolate(t, [PUFF + 2, PUFF + 9], [0, 1], clamp);
  const appear = interpolate(t, [0, 2], [0, 1], clamp);

  const dot = spring({
    frame: t - DOT,
    fps,
    config: { damping: 10, stiffness: 220, mass: 0.5 },
  });
  const slide = interpolate(t, [SLIDE, SLIDE + 11], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const reveal = interpolate(t, [SLIDE + 2, SLIDE + 13], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: size * 0.24,
          transform: `translateX(calc((50% - ${size / 2}px) * ${children ? 1 - slide : 0}))`,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flexShrink: 0,
              width: bodyW,
              height: bodyH,
              borderRadius: radius,
              backgroundColor: color,
              opacity: appear,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `inset ${-size * 0.06}px ${-size * 0.08}px ${size * 0.14}px rgba(0,0,0,${0.28 * gloss})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "14%",
                top: "10%",
                width: "46%",
                height: "28%",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at 45% 40%, ${highlight} 0%, transparent 70%)`,
                opacity: 0.55 * gloss,
                transform: "rotate(-18deg)",
              }}
            />
            <div
              style={{
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: "50%",
                backgroundColor: dotColor,
                transform: `scale(${dot})`,
              }}
            />
          </div>
        </div>
        {children && (
          <div
            style={{
              opacity: reveal,
              clipPath: `inset(-30% ${(1 - reveal) * 100}% -30% -5%)`,
              transform: `translateX(${(1 - reveal) * -size * 0.3}px)`,
            }}
          >
            {children}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
