"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Marble: cream and charcoal marble veins swirling together.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpMarblePreset = {
  speed: 2,
  shape: "edge",
  colors: ["#f5f3ee", "#c9c3b8", "#2b2b2b"],
  proportion: 0.3,
  softness: 0.4,
  distortion: 0.25,
  swirl: 0.9,
  swirlIterations: 10,
  shapeScale: 0.8,
} satisfies ShaderWarpProps;

export function ShaderWarpMarble({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpMarblePreset}
      {...props}
      speed={shaderWarpMarblePreset.speed * speed}
    />
  );
}
