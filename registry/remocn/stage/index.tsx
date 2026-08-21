"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP, SETTLE_SOFT } from "@/lib/remocn/scene-motion";

export interface StageProps {
  children: ReactNode;
  backdrop?: string;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  scale?: number;
  radius?: number;
  reflection?: number;
  shadow?: number;
  light?: number;
  className?: string;
}

const clampStrength = (value: number) => Math.min(1, Math.max(0, value));

export function Stage({
  children,
  backdrop = "linear-gradient(145deg, #17181d 0%, #09090b 72%)",
  rotateX = 8,
  rotateY = -12,
  perspective = 1400,
  scale = 0.82,
  radius = 1.4,
  reflection = 0.24,
  shadow = 0.7,
  light = 0.55,
  className,
}: StageProps) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const settle = interpolate(frame, [0, 24], [0, 1], {
    ...CLAMP,
    easing: SETTLE_SOFT,
  });
  const opacity = interpolate(frame, [0, 9], [0, 1], CLAMP);
  const radiusPx = (radius / 100) * width;
  const reflectionStrength = clampStrength(reflection);
  const shadowStrength = clampStrength(shadow);
  const lightStrength = clampStrength(light);

  const currentScale = interpolate(settle, [0, 1], [scale * 0.92, scale]);
  const currentRotateX = interpolate(settle, [0, 1], [rotateX + 9, rotateX]);
  const currentRotateY = interpolate(settle, [0, 1], [rotateY - 6, rotateY]);
  const currentY = interpolate(settle, [0, 1], [70, 0]);
  const subjectTransform = `translate3d(0, ${currentY}px, 0) scale(${currentScale}) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;

  const planeStyle: CSSProperties = {
    position: "absolute",
    left: "8%",
    top: "11%",
    width: "84%",
    height: "67%",
    overflow: "hidden",
    borderRadius: radiusPx,
    transform: subjectTransform,
    transformOrigin: "center center",
    backfaceVisibility: "hidden",
  };
  const subjectStyle: CSSProperties & { WebkitBoxReflect?: string } = {
    ...planeStyle,
    pointerEvents: "auto",
    WebkitBoxReflect: `below 0 linear-gradient(to bottom, rgba(255,255,255,${reflectionStrength * 0.62}), transparent 38%)`,
  };

  return (
    <AbsoluteFill
      className={className}
      style={{ overflow: "hidden", background: backdrop }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "17%",
          top: "73%",
          width: "66%",
          height: "24%",
          opacity: reflectionStrength * opacity,
          background:
            "linear-gradient(to bottom, rgba(188,181,255,0.34), rgba(91,81,145,0.12) 34%, transparent 76%)",
          clipPath: "polygon(7% 0, 93% 0, 78% 100%, 22% 100%)",
          filter: "blur(16px)",
          transform: `perspective(700px) rotateX(54deg) translateY(${currentY * 0.35}px) scaleX(${0.9 + settle * 0.1})`,
          transformOrigin: "center top",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "20%",
          top: "72%",
          width: "60%",
          height: "9%",
          borderRadius: "50%",
          background: `rgba(0, 0, 0, ${0.52 * shadowStrength * opacity})`,
          filter: `blur(${18 + 28 * shadowStrength}px)`,
          transform: `translateY(${currentY * 0.45}px) scaleX(${0.9 + settle * 0.1})`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          perspective,
          perspectiveOrigin: "50% 42%",
          opacity,
          pointerEvents: "none",
        }}
      >
        <div style={subjectStyle}>{children}</div>
      </AbsoluteFill>

      <AbsoluteFill
        aria-hidden
        style={{
          pointerEvents: "none",
          opacity: lightStrength,
          background:
            "radial-gradient(ellipse at 42% 10%, rgba(255,255,255,0.2), transparent 38%), linear-gradient(115deg, rgba(255,255,255,0.08), transparent 38%, rgba(255,255,255,0.02) 68%, rgba(0,0,0,0.24))",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
}
