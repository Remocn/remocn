"use client";

import { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface OutlineFillTrackTextProps {
  leadText?: string;
  valueText?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  backgroundColor?: string;
  glowColor?: string;
  enterOffset?: number;
  anchorOffsetX?: number;
  trackDistance?: number;
  wordGap?: number;
  fillDuration?: number;
  speed?: number;
  className?: string;
}

export const outlineFillTrackTextLength = 80;

const ENTER_END = 16;
const TRACK_START = 16;
const TRACK_END = 72;
const FILL_START = 34;
const FILL_PREFILL = 10;
const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function estimateTextWidth(
  text: string,
  fontSize: number,
  fontWeight: number,
): number {
  if (typeof document === "undefined") {
    return text.length * fontSize * 0.56;
  }

  const context = document.createElement("canvas").getContext("2d");
  if (!context) return text.length * fontSize * 0.56;
  context.font = `${fontWeight} ${fontSize}px Arial`;
  return context.measureText(text).width;
}

export function OutlineFillTrackText({
  leadText = "Keep",
  valueText = "100%",
  fontSize = 368,
  fontWeight = 700,
  color = "#f4f3f6",
  outlineColor = "#e6e2ed",
  outlineWidth = 3,
  backgroundColor = "#030012",
  glowColor = "#64109a",
  enterOffset = 240,
  anchorOffsetX = -84,
  trackDistance = 0,
  wordGap = 220,
  fillDuration = 38,
  speed = 1,
  className,
}: OutlineFillTrackTextProps) {
  const frame = useCurrentFrame() * Math.max(speed, 0);
  const safeFontSize = Math.max(fontSize, 1);
  const safeFontWeight = Math.max(fontWeight, 1);
  const safeOutlineWidth = Math.max(outlineWidth, 0);
  const safeGap = Math.max(wordGap, 0);
  const safeFillDuration = Math.max(fillDuration, 1);

  const measuredDistance = useMemo(() => {
    const leadWidth = estimateTextWidth(leadText, safeFontSize, safeFontWeight);
    const valueWidth = estimateTextWidth(
      valueText,
      safeFontSize,
      safeFontWeight,
    );
    return leadWidth / 2 + safeGap + valueWidth / 2;
  }, [leadText, safeFontSize, safeFontWeight, safeGap, valueText]);

  const distance = trackDistance > 0 ? trackDistance : measuredDistance;
  const enterProgress = interpolate(frame, [0, ENTER_END], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 0.84, 0.24, 1),
  });
  const trackProgress = interpolate(frame, [TRACK_START, TRACK_END], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const fillProgress = interpolate(
    frame,
    [FILL_START - FILL_PREFILL, FILL_START + safeFillDuration],
    [0, 1],
    clamp,
  );
  const leadY = enterOffset * (1 - enterProgress);
  const revealEdge = enterProgress * 112 - 8;
  const revealSolid = Math.max(0, Math.min(100, revealEdge - 10));
  const revealFade = Math.max(0, Math.min(100, revealEdge + 10));
  const leadMask = `linear-gradient(180deg, #000 0%, #000 ${revealSolid}%, transparent ${revealFade}%, transparent 100%)`;
  const glowOpacity = interpolate(
    enterProgress,
    [0, 0.18, 0.72, 1],
    [0.92, 1, 0.52, 0],
    clamp,
  );
  const fieldY = interpolate(enterProgress, [0, 1], [-42, -210], clamp);
  const textStyle = {
    display: "block",
    fontFamily: FONT_FAMILY,
    fontSize: safeFontSize,
    fontWeight: safeFontWeight,
    letterSpacing: 0,
    lineHeight: 0.86,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 118% 66% at 50% -12%, ${glowColor} 0%, ${glowColor} 14%, transparent 76%)`,
          filter: `blur(${safeFontSize * 0.15}px)`,
          opacity: glowOpacity,
          pointerEvents: "none",
          transform: "translateZ(0)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${anchorOffsetX}px)`,
          transform: `translate3d(${-distance * trackProgress}px, -50%, 0)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            color,
            maskImage: leadMask,
            maskRepeat: "no-repeat",
            opacity: 1,
            transform: `translate3d(-50%, calc(-50% + ${leadY}px), 0)`,
            WebkitMaskImage: leadMask,
            WebkitMaskRepeat: "no-repeat",
            ...textStyle,
          }}
        >
          {leadText}
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: distance,
            transform: "translate3d(-50%, -50%, 0)",
            visibility: frame < FILL_START ? "hidden" : "visible",
          }}
        >
          <span
            style={{
              ...textStyle,
              color: "transparent",
              paintOrder: "stroke fill",
              WebkitTextStroke: `${safeOutlineWidth}px ${outlineColor}`,
            }}
          >
            {valueText}
          </span>
          <span
            style={{
              ...textStyle,
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${100 - fillProgress * 100}% 0 0)`,
              color,
              opacity: 1,
            }}
          >
            {valueText}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            top: fieldY,
            left: 0,
            width: safeFontSize * 2.8,
            height: safeFontSize * 0.72,
            background: `radial-gradient(ellipse at center, ${backgroundColor} 0%, ${backgroundColor} 18%, transparent 74%)`,
            filter: `blur(${safeFontSize * 0.07}px)`,
            opacity: glowOpacity,
            pointerEvents: "none",
            transform: "translate3d(-50%, -50%, 0)",
          }}
        />
      </div>
    </div>
  );
}
