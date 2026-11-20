"use client";

import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

export interface DriftProps {
  children: React.ReactNode;
  grow?: number;
}

export function Drift({ children, grow = 0.035 }: DriftProps) {
  const glide = useGlide();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1 + grow]);
  // The drift never rests, so the text under it is always marked as moving.
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})${glide(true)}` }}>
      {children}
    </AbsoluteFill>
  );
}
