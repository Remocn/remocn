"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  SHADOW_SWEEP_TEXT_LENGTH,
  type ShadowSweepTextElementId,
  shadowSweepTextTimeline,
} from "./timeline";

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
  /**
   * Moves, trims or stretches the drift and the two sweeps, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<ShadowSweepTextElementId>;
}

export const shadowSweepTextLength = SHADOW_SWEEP_TEXT_LENGTH;

const REST_X = -20;
const REST_Y = 9;
const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function ShadowSweepText(props: ShadowSweepTextProps) {
  const {
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
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    shadowSweepTextTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const travel = tl.get("travel");
  const enter = tl.get("enter");
  const exit = tl.get("exit");
  const safeSoftness = Math.max(shadowSoftness, 0);
  const travelProgress = interpolate(
    frame,
    [travel.start, travel.end],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
  const enterProgress = interpolate(
    frame,
    [enter.start + enter.beat("lead"), enter.end],
    [0, 1],
    clamp,
  );
  const exitProgress = interpolate(
    frame,
    [exit.start, exit.end],
    [0, 1],
    clamp,
  );
  const x = REST_X + driftLeft * (1 - travelProgress);
  const y = REST_Y + rise * (1 - travelProgress);
  const isEntering = frame < enter.end;
  const isExiting = frame >= exit.start;
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
          transform: `translate3d(${x}px, ${y}px, 0)${glide(midway(travelProgress))}`,
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
