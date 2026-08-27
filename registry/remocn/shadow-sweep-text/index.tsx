"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface ShadowSweepTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  backgroundColor?: string;
  shadowColor?: string;
  shadowSoftness?: number;
  rise?: number;
  driftLeft?: number;
  speed?: number;
  className?: string;
}

export const shadowSweepTextLength = 37;

const ENTER_END = 23;
const EXIT_START = 26;
const EXIT_END = shadowSweepTextLength - 1;
const REST_X = -20;
const REST_Y = 9;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function ShadowSweepText({
  text,
  fontSize = 96,
  color = "#aaa6b5",
  fontWeight = 700,
  backgroundColor = "#030012",
  shadowColor = backgroundColor,
  shadowSoftness = 130,
  rise = 96,
  driftLeft = 16,
  speed = 1,
  className,
}: ShadowSweepTextProps) {
  const frame = useCurrentFrame() * speed;
  const safeSoftness = Math.max(shadowSoftness, 0);
  const travelProgress = interpolate(
    frame,
    [0, shadowSweepTextLength - 1],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const enterProgress = interpolate(frame, [-3, ENTER_END], [0, 1], clamp);
  const exitProgress = interpolate(
    frame,
    [EXIT_START, EXIT_END],
    [0, 1],
    clamp,
  );
  const x = REST_X + driftLeft * (1 - travelProgress);
  const y = REST_Y + rise * (1 - travelProgress);
  const isEntering = frame < ENTER_END;
  const isExiting = frame >= EXIT_START;
  const sweepProgress = isEntering
    ? enterProgress
    : isExiting
      ? exitProgress
      : null;
  const edgeOffset =
    sweepProgress === null ? 0 : (sweepProgress * 2 - 1) * (safeSoftness / 2);
  const edgePosition =
    sweepProgress === null
      ? "50%"
      : `calc(${sweepProgress * 100}% + ${edgeOffset}px)`;
  const maskStart =
    sweepProgress === null
      ? "50%"
      : `calc(${sweepProgress * 100}% + ${edgeOffset - safeSoftness / 2}px)`;
  const maskEnd =
    sweepProgress === null
      ? "50%"
      : `calc(${sweepProgress * 100}% + ${edgeOffset + safeSoftness / 2}px)`;
  const textMask = isEntering
    ? `linear-gradient(90deg, #000 0, #000 ${maskStart}, transparent ${maskEnd}, transparent 100%)`
    : isExiting
      ? `linear-gradient(90deg, transparent 0, transparent ${maskStart}, #000 ${maskEnd}, #000 100%)`
      : undefined;
  const fieldOpacity =
    sweepProgress === null
      ? 0
      : interpolate(sweepProgress, [0, 0.08, 0.82, 1], [0, 1, 1, 0], clamp);
  const fieldWidth = Math.max(safeSoftness * 3, 1);
  const fieldHeight = Math.max(fontSize * 2.6, safeSoftness * 1.8, 1);

  if (text.length === 0) {
    return (
      <div
        className={className}
        style={{ position: "absolute", inset: 0, backgroundColor }}
      />
    );
  }

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
        backgroundColor,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          transform: `translate3d(${x}px, ${y}px, 0)`,
        }}
      >
        <span
          style={{
            color,
            display: "inline-block",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize,
            fontWeight,
            letterSpacing: 0,
            lineHeight: 1,
            maskImage: textMask,
            maskRepeat: "no-repeat",
            opacity: 1,
            WebkitMaskImage: textMask,
            WebkitMaskRepeat: "no-repeat",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: edgePosition,
            width: fieldWidth,
            height: fieldHeight,
            background: `radial-gradient(ellipse at center, ${shadowColor} 0%, ${shadowColor} 14%, transparent 72%)`,
            filter: `blur(${safeSoftness * 0.08}px)`,
            opacity: fieldOpacity,
            pointerEvents: "none",
            transform: "translate3d(-50%, -50%, 0)",
          }}
        />
      </div>
    </div>
  );
}
