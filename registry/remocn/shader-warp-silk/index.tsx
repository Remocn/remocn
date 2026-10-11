"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Silk: violet and pink liquid silk folding in slow waves.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpSilkPreset = {
  speed: 2,
  shape: "edge",
  colors: ["#1b1033", "#6d3bd8", "#f5a3ff", "#fde7ff"],
  proportion: 0.45,
  softness: 1,
  distortion: 0.15,
  swirl: 0.6,
  swirlIterations: 8,
  shapeScale: 0.5,
} satisfies ShaderWarpProps;

export function ShaderWarpSilk({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpSilkPreset}
      {...props}
      speed={shaderWarpSilkPreset.speed * speed}
    />
  );
}
