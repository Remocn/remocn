"use client";

import type React from "react";
import { useCurrentFrame } from "remotion";
import {
  DEFAULT_STEP,
  hashRange,
  paperJitter,
  steppedRamp,
} from "@/lib/remocn/stop-motion";

export interface PaperStickerProps {
  children: React.ReactNode;
  at?: number;
  seed?: string;
  padding?: string;
  background?: string;
  borderColor?: string;
  maxTilt?: number;
  step?: number;
}

export function PaperSticker({
  children,
  at = 0,
  seed = "sticker",
  padding = "10px 16px",
  background = "#fbfaf6",
  borderColor = "rgba(38,36,44,0.55)",
  maxTilt = 2.6,
  step = DEFAULT_STEP,
}: PaperStickerProps) {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, at, at + 2 * step, { step });
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
        transform: `translate(${jitter.x}px, ${jitter.y}px) rotate(${tilt + jitter.rot}deg) scale(${progress < 1 ? 1.12 : 1})`,
      }}
    >
      {children}
    </div>
  );
}
