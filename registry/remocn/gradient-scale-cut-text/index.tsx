"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface GradientScaleCutTextProps {
  text?: string;
  giantFontSize?: number;
  compactFontSize?: number;
  fontWeight?: number;
  gradientStart?: string;
  gradientEnd?: string;
  ghostColor?: string;
  backgroundColor?: string;
  anchorOffsetX?: number;
  giantTravel?: number;
  settleTravel?: number;
  cutFrame?: number;
  revealSoftness?: number;
  compactBlur?: number;
  speed?: number;
  className?: string;
}

export const gradientScaleCutTextLength = 36;

const REVEAL_END = 33;
const SETTLE_FRAMES = 8;
const GIANT_Y = -28;
const GIANT_X_CORRECTION = -48;
const COMPACT_Y = 5;
const COMPACT_X_SCALE = 0.87;
const COMPACT_START_X_CORRECTION = 28;
const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

interface TextLayerProps {
  text: string;
  fontSize: number;
  fontWeight: number;
  gradientStart: string;
  gradientEnd: string;
  ghostColor: string;
  maskImage: string;
}

function TextLayer({
  text,
  fontSize,
  fontWeight,
  gradientStart,
  gradientEnd,
  ghostColor,
  maskImage,
}: TextLayerProps) {
  const textStyle = {
    display: "block",
    fontFamily: FONT_FAMILY,
    fontSize,
    fontWeight,
    letterSpacing: 0,
    lineHeight: 1.12,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ position: "relative" }}>
      <span style={{ ...textStyle, color: ghostColor }}>{text}</span>
      <span
        style={{
          ...textStyle,
          position: "absolute",
          inset: 0,
          color: "transparent",
          backgroundImage: `linear-gradient(90deg, ${gradientStart} 0%, ${gradientStart} 4%, ${gradientEnd} 26%, ${gradientEnd} 100%)`,
          backgroundClip: "text",
          maskImage,
          maskRepeat: "no-repeat",
          opacity: 1,
          WebkitBackgroundClip: "text",
          WebkitMaskImage: maskImage,
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function GradientScaleCutText({
  text = "Introducing",
  giantFontSize = 520,
  compactFontSize = 132,
  fontWeight = 700,
  gradientStart = "#f04a14",
  gradientEnd = "#f3f1f1",
  ghostColor = "#170b0a",
  backgroundColor = "#000000",
  anchorOffsetX = -16,
  giantTravel = 400,
  settleTravel = 160,
  cutFrame = 13,
  revealSoftness = 14,
  compactBlur = 12,
  speed = 1,
  className,
}: GradientScaleCutTextProps) {
  const frame = useCurrentFrame() * Math.max(speed, 0);
  const safeCutFrame = Math.max(cutFrame, 1);
  const safeGiantFontSize = Math.max(giantFontSize, 1);
  const safeCompactFontSize = Math.max(compactFontSize, 1);
  const safeSoftness = Math.max(revealSoftness, 0);
  const safeBlur = Math.max(compactBlur, 0);
  const revealProgress = interpolate(frame, [0, REVEAL_END], [0.02, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 0.74, 0.24, 1),
  });
  const revealEdge = revealProgress * (100 + safeSoftness / 2);
  const revealSolid = Math.max(0, revealEdge - safeSoftness / 2);
  const revealFade = revealEdge + safeSoftness / 2;
  const maskImage = `linear-gradient(90deg, #000 0%, #000 ${revealSolid}%, transparent ${revealFade}%, transparent ${revealFade}%)`;
  const giantProgress = interpolate(
    frame,
    [0, Math.max(safeCutFrame - 1, 1)],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const settleProgress = interpolate(
    frame,
    [safeCutFrame, safeCutFrame + SETTLE_FRAMES],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const moveProgress = interpolate(
    frame,
    [
      safeCutFrame + 1,
      safeCutFrame + 2,
      safeCutFrame + 4,
      safeCutFrame + SETTLE_FRAMES,
    ],
    [0, 0.58, 0.875, 1],
    clamp,
  );
  const showGiant = frame < safeCutFrame;
  const compactX =
    interpolate(moveProgress, [0, 1], [settleTravel, 0], clamp) +
    COMPACT_START_X_CORRECTION * (1 - moveProgress);
  const compactBlurValue = safeBlur * (1 - settleProgress);

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
      {showGiant ? (
        <div
          style={{
            position: "absolute",
            top: `calc(50% + ${GIANT_Y}px)`,
            left: `calc(50% + ${anchorOffsetX + GIANT_X_CORRECTION - giantTravel * giantProgress}px)`,
            opacity: 1,
            transform: "translate3d(0, -50%, 0)",
          }}
        >
          <TextLayer
            text={text}
            fontSize={safeGiantFontSize}
            fontWeight={fontWeight}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            ghostColor={ghostColor}
            maskImage={maskImage}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: `calc(50% + ${COMPACT_Y}px)`,
            left: `calc(50% + ${anchorOffsetX + compactX}px)`,
            filter: `blur(${compactBlurValue}px)`,
            opacity: 1,
            transform: `translate3d(-50%, -50%, 0) scaleX(${COMPACT_X_SCALE})`,
            transformOrigin: "center",
          }}
        >
          <TextLayer
            text={text}
            fontSize={safeCompactFontSize}
            fontWeight={fontWeight}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            ghostColor={ghostColor}
            maskImage={maskImage}
          />
        </div>
      )}
    </div>
  );
}
