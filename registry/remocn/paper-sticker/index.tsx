"use client";

import type React from "react";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import {
  DEFAULT_STEP,
  hashRange,
  paperJitter,
  steppedRamp,
} from "@/lib/remocn/stop-motion";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type PaperStickerElementId, paperStickerTimeline } from "./timeline";

export interface PaperStickerProps {
  children: React.ReactNode;
  at?: number;
  seed?: string;
  padding?: string;
  background?: string;
  borderColor?: string;
  maxTilt?: number;
  step?: number;
  /**
   * Moves, trims or stretches the slap, by the ids in `./timeline`.
   * Frames on the scene timeline.
   */
  timing?: Timing<PaperStickerElementId>;
}

export function PaperSticker(props: PaperStickerProps) {
  const {
    children,
    seed = "sticker",
    padding = "10px 16px",
    background = "#fbfaf6",
    borderColor = "rgba(38,36,44,0.55)",
    maxTilt = 2.6,
    step = DEFAULT_STEP,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(paperStickerTimeline, props, durationInFrames, timing);
  const slap = tl.get("slap");
  const progress = steppedRamp(frame, slap.start, slap.end, { step });
  if (progress === 0) return null;

  const tilt = hashRange(`${seed}:rot`, -maxTilt, maxTilt);
  const jitter = paperJitter(frame, `sticker:${seed}`, {
    amp: 0.7,
    rotAmp: 0.2,
    step,
  });

  return (
    <div
      style={{
        display: "inline-block",
        padding,
        background,
        border: `1px solid ${borderColor}`,
        borderRadius: 3,
        boxShadow: "0 2px 5px rgba(38,36,44,0.14)",
        translate: `${jitter.x}px ${jitter.y}px`,
        rotate: `${tilt + jitter.rot}deg`,
        scale: `${progress < 1 ? 1.12 : 1}`,
      }}
    >
      {children}
    </div>
  );
}
