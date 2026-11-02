"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Deep Sea: diagonal teal bands rippling through midnight blue.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpDeepSeaPreset = {
  speed: 4,
  shape: "stripes",
  colors: ["#020617", "#0f3d5e", "#1fb5a5"],
  proportion: 0.6,
  softness: 1,
  distortion: 0.15,
  swirl: 0.3,
  swirlIterations: 4,
  shapeScale: 1,
  rotation: 60,
} satisfies ShaderWarpProps;

export function ShaderWarpDeepSea({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpDeepSeaPreset}
      {...props}
      speed={shaderWarpDeepSeaPreset.speed * speed}
    />
  );
}
