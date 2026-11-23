"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  ACCEL,
  type CenteredWordBuildElementId,
  centeredWordBuildTimeline,
  EXIT_AT,
  EXIT_FRAMES,
  revealFrame,
  SETTLE_FRAMES,
  WORD_GAP,
} from "./timeline";

export interface CenteredWordBuildProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  accel?: number;
  rise?: number;
  zoomStep?: number;
  settleFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words and the exit, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<CenteredWordBuildElementId>;
}

export function centeredWordBuildLength(
  text: string,
  wordGap = WORD_GAP,
  accel = ACCEL,
  settleFrames = SETTLE_FRAMES,
  exitAt = EXIT_AT,
  exitFrames = EXIT_FRAMES,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  const lastReveal = revealFrame(words.length - 1, wordGap, accel);
  return Math.max(lastReveal + settleFrames, exitAt + exitFrames);
}

const settleEasing = Easing.bezier(0.16, 1, 0.3, 1);

export function CenteredWordBuild(props: CenteredWordBuildProps) {
  const {
    text,
    fontSize = 52,
    color = "#fff3df",
    fontWeight = 400,
    rise = 0.18,
    zoomStep = 0.035,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    centeredWordBuildTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return null;

  const landings = words.map((_, index) => tl.get(`word:${index}`));
  const shown = (index: number) => frame >= landings[index].start;
  let cameraScale = 1;
  // Zooms overlap, so the camera moves while any one of them is midway.
  let cameraMoving = false;
  for (let index = 1; index < words.length; index++) {
    if (!shown(index)) continue;
    const { start, end } = landings[index];
    const zoom = interpolate(frame, [start, end], [0, 1], {
      easing: settleEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cameraScale += zoomStep * zoom;
    if (zoom > 0 && zoom < 1) cameraMoving = true;
  }
  const exit = tl.get("exit");
  const exitProgress = interpolate(frame, [exit.start, exit.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeStart = -35 + exitProgress * 135;
  const fadeEnd = fadeStart + 35;
  const exitMask = `linear-gradient(90deg, transparent ${fadeStart}%, black ${fadeEnd}%)`;

  return (
    <div
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
      <span
        className={className}
        style={{
          color,
          display: "inline-block",
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
          fontSize,
          fontWeight,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          // The camera is a transform so it can carry the mark.
          transform: `scale(${cameraScale})${glide(cameraMoving)}`,
          opacity: exitProgress >= 1 ? 0 : 1,
          maskImage: exitProgress > 0 ? exitMask : undefined,
          WebkitMaskImage: exitProgress > 0 ? exitMask : undefined,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {words.map((word, index) => {
          if (!shown(index)) return null;
          const { start, end } = landings[index];
          const y = interpolate(frame, [start, end], [rise * fontSize, 0], {
            easing: settleEasing,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                marginLeft: index > 0 ? "0.25em" : undefined,
                transform: `translateY(${y}px)${glide(y > 0)}`,
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    </div>
  );
}
