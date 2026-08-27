"use client";

import type { CSSProperties } from "react";
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
  shadowColor = "#000008",
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
  const enterOffset = `calc(${enterProgress * 100}% + ${
    enterProgress * safeSoftness
  }px)`;
  const remainingExit = 1 - exitProgress;
  const exitOffset = `calc(${-remainingExit * 100}% - ${
    remainingExit * safeSoftness
  }px)`;
  const shadowOffset = safeSoftness * 0.45;
  const shadowBlur = safeSoftness * 0.55;
  const shadowSpread = safeSoftness * 0.08;
  const occluderStyle: CSSProperties = {
    position: "absolute",
    inset: "-0.45em -0.8em",
    backgroundColor,
    pointerEvents: "none",
  };

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
          color,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize,
          fontWeight,
          letterSpacing: 0,
          lineHeight: 1,
          opacity: 1,
          transform: `translate3d(${x}px, ${y}px, 0)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}

        <div
          style={{
            ...occluderStyle,
            boxShadow: `${-shadowOffset}px 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
            display: frame < ENTER_END ? "block" : "none",
            transform: `translate3d(${enterOffset}, 0, 0)`,
          }}
        />
        <div
          style={{
            ...occluderStyle,
            boxShadow: `${shadowOffset}px 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
            display: frame >= EXIT_START ? "block" : "none",
            transform: `translate3d(${exitOffset}, 0, 0)`,
          }}
        />
      </div>
    </div>
  );
}
