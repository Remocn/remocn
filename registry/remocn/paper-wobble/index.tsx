"use client";

import type React from "react";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { DEFAULT_STEP, paperJitter } from "@/lib/remocn/stop-motion";

export interface PaperWobbleProps {
  children: React.ReactNode;
  seed?: string;
  amp?: number;
  rotAmp?: number;
  step?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PaperWobble({
  children,
  seed = "wobble",
  amp = 1.4,
  rotAmp = 0.35,
  step = DEFAULT_STEP,
  className,
  style,
}: PaperWobbleProps) {
  const glide = useGlide();
  const frame = useSceneFrame();
  const pose = (f: number) => {
    const j = paperJitter(f, seed, { amp, rotAmp, step });
    return `translate(${j.x}px, ${j.y}px) rotate(${j.rot}deg)`;
  };
  // A pose that lands close to level would put the text back on whole
  // pixels for its hold and snap it there; the mark keeps it off the grid.
  const here = pose(frame);
  const moving = here !== pose(frame - 1) || here !== pose(frame + 1);
  const wobble = `${here}${glide(moving)}`;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        ...style,
        transform: style?.transform ? `${style.transform} ${wobble}` : wobble,
      }}
    >
      {children}
    </div>
  );
}
