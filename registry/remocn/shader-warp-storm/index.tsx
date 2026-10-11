"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Storm: deep violet and lavender storm of marbled fluid.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpStormPreset = {
  speed: 3,
  shape: "edge",
  colors: ["#0b0620", "#3b1d8f", "#8f5cff", "#e0d4ff"],
  proportion: 0.5,
  softness: 1,
  distortion: 0.3,
  swirl: 1,
  swirlIterations: 10,
  shapeScale: 0.4,
} satisfies ShaderWarpProps;

export function ShaderWarpStorm({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpStormPreset}
      {...props}
      speed={shaderWarpStormPreset.speed * speed}
    />
  );
}
