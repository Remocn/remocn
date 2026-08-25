"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface InlinePillTakeoverProps {
  before: string;
  insert: string;
  after: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  pillWidth?: number;
  pillColor?: string;
  pillTextColor?: string;
  expandFrames?: number;
  pillRevealHeightScale?: number;
  pillGrowAt?: number;
  pillGrowFrames?: number;
  pillGrowWidthScale?: number;
  pillGrowHeightScale?: number;
  outerExitFrames?: number;
  takeoverAt?: number;
  takeoverScale?: number;
  blur?: number;
  speed?: number;
  className?: string;
}

const PRE_CUT_FRAMES = 12;
const TAKEOVER_SETTLE_FRAMES = 6;
const PRE_CUT_CAMERA_SCALE = 1.25;
const CAMERA_CUT_ENTRY_PROGRESS = 0.86;
const expandEasing = Easing.out(Easing.quad);
const pillGrowEasing = Easing.inOut(Easing.quad);
const fadeEasing = Easing.in(Easing.cubic);
const preCutEasing = Easing.out(Easing.quad);
const takeoverSettleEasing = Easing.out(Easing.cubic);

export function InlinePillTakeover({
  before,
  insert,
  after,
  fontSize = 52,
  color = "#fff3df",
  fontWeight = 400,
  pillWidth = 260,
  pillColor = "#fffaf0",
  pillTextColor = "#1c1210",
  expandFrames = 12,
  pillRevealHeightScale = 0.35,
  pillGrowAt = 12,
  pillGrowFrames = 24,
  pillGrowWidthScale = 1.08,
  pillGrowHeightScale = 1.16,
  outerExitFrames = 18,
  takeoverAt = 12,
  takeoverScale = 2.15,
  blur = 12,
  speed = 1,
  className,
}: InlinePillTakeoverProps) {
  const frame = useCurrentFrame() * speed;
  const safeExpandFrames = Math.max(expandFrames, 0.001);
  const pillGrowEnd = pillGrowAt + Math.max(pillGrowFrames, 0.001);
  const outerExitEnd = Math.max(outerExitFrames, 2.001);
  const dashWidth = fontSize * 0.72;
  const pillHeight = fontSize * 1.22;
  const cutAt = takeoverAt + PRE_CUT_FRAMES;
  const cutEntryScale = takeoverScale * CAMERA_CUT_ENTRY_PROGRESS;

  const expand = interpolate(frame, [0, safeExpandFrames], [0, 1], {
    easing: expandEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillGrowProgress = interpolate(
    frame,
    [pillGrowAt, pillGrowEnd],
    [0, 1],
    {
      easing: pillGrowEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const outerExit = interpolate(frame, [2, outerExitEnd], [0, 1], {
    easing: fadeEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillTextOpacity = frame >= 3 ? 1 : 0;
  const preCutCameraScale = interpolate(
    frame,
    [takeoverAt, cutAt - 1],
    [1, PRE_CUT_CAMERA_SCALE],
    {
      easing: preCutEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const postCutCameraScale = interpolate(
    frame,
    [cutAt, cutAt + TAKEOVER_SETTLE_FRAMES],
    [cutEntryScale, takeoverScale],
    {
      easing: takeoverSettleEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const cameraScale = frame < cutAt ? preCutCameraScale : postCutCameraScale;
  const revealedPillWidth = dashWidth + (pillWidth - dashWidth) * expand;
  const revealedPillHeight =
    pillHeight * (pillRevealHeightScale + (1 - pillRevealHeightScale) * expand);
  const pillWidthGrow = 1 + (pillGrowWidthScale - 1) * pillGrowProgress;
  const pillHeightGrow = 1 + (pillGrowHeightScale - 1) * pillGrowProgress;
  const animatedPillWidth = revealedPillWidth * pillWidthGrow;
  const animatedPillHeight = revealedPillHeight * pillHeightGrow;

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
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${cameraScale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: `${fontSize * 0.16}px`,
            whiteSpace: "nowrap",
            fontFamily:
              "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
            fontSize,
            fontWeight,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              flex: 1,
              textAlign: "right",
              color,
              opacity: 1 - outerExit,
              filter: outerExit > 0 ? `blur(${blur * outerExit}px)` : undefined,
            }}
          >
            {before}
          </span>

          <span
            style={{
              position: "relative",
              display: "inline-block",
              flexShrink: 0,
              width: animatedPillWidth,
              height: animatedPillHeight,
              overflow: "hidden",
              borderRadius: animatedPillHeight / 2,
              background: pillColor,
              color: pillTextColor,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                translate: "-50% -50%",
                fontSize: fontSize * 0.84,
                opacity: pillTextOpacity,
                whiteSpace: "nowrap",
              }}
            >
              {insert}
            </span>
          </span>

          <span
            style={{
              flex: 1,
              textAlign: "left",
              color,
              opacity: 1 - outerExit,
              filter: outerExit > 0 ? `blur(${blur * outerExit}px)` : undefined,
            }}
          >
            {after}
          </span>
        </div>
      </div>
    </div>
  );
}
