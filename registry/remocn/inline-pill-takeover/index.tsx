"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type InlinePillTakeoverElementId,
  inlinePillTakeoverTimeline,
} from "./timeline";

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
  /**
   * Moves, trims or stretches the pill opening and growing, the words fading
   * and the camera push and cut, by the ids in `./timeline`. Frames on the
   * scene timeline, after `speed`.
   */
  timing?: Timing<InlinePillTakeoverElementId>;
}

const PRE_CUT_CAMERA_SCALE = 1.25;
const CAMERA_CUT_ENTRY_PROGRESS = 0.86;
const expandEasing = Easing.out(Easing.quad);
const pillGrowEasing = Easing.inOut(Easing.quad);
const fadeEasing = Easing.in(Easing.cubic);
const preCutEasing = Easing.out(Easing.quad);
const takeoverSettleEasing = Easing.out(Easing.cubic);

export function InlinePillTakeover(props: InlinePillTakeoverProps) {
  const {
    before,
    insert,
    after,
    fontSize = 52,
    color = "#fff3df",
    fontWeight = 400,
    pillWidth = 260,
    pillColor = "#fffaf0",
    pillTextColor = "#1c1210",
    pillRevealHeightScale = 0.35,
    pillGrowWidthScale = 1.08,
    pillGrowHeightScale = 1.16,
    takeoverScale = 2.15,
    blur = 12,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    inlinePillTakeoverTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const expandEl = tl.get("expand");
  const fade = tl.get("fade");
  const grow = tl.get("grow");
  const push = tl.get("push");
  const cut = tl.get("cut");
  const dashWidth = fontSize * 0.72;
  const pillHeight = fontSize * 1.22;
  const cutEntryScale = takeoverScale * CAMERA_CUT_ENTRY_PROGRESS;

  const expand = interpolate(frame, [expandEl.start, expandEl.end], [0, 1], {
    easing: expandEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillGrowProgress = interpolate(frame, [grow.start, grow.end], [0, 1], {
    easing: pillGrowEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outerExit = interpolate(frame, [fade.start, fade.end], [0, 1], {
    easing: fadeEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillTextOpacity =
    frame >= expandEl.start + expandEl.beat("text") ? 1 : 0;
  const cameraAt = (f: number) =>
    f < cut.start
      ? interpolate(f, [push.start, push.end - 1], [1, PRE_CUT_CAMERA_SCALE], {
          easing: preCutEasing,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(f, [cut.start, cut.end], [cutEntryScale, takeoverScale], {
          easing: takeoverSettleEasing,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const cameraScale = cameraAt(frame);
  const cameraMoving =
    Math.abs(cameraAt(frame + speed) - cameraScale) > 1e-6 ||
    Math.abs(cameraScale - cameraAt(frame - speed)) > 1e-6;
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
          transform: `scale(${cameraScale})${glide(cameraMoving)}`,
          transformOrigin: "center",
        }}
      >
        {/* The row is as tall as a line of text and the growing pill spills
            out of it evenly: a row that grew with the pill would re-centre
            the words around it by layout, a whole pixel at a time. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: fontSize,
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
