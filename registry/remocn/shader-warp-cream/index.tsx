"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Cream: soft peach-to-coral cream gradient with a gentle drift.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpCreamPreset = {
  speed: 2,
  shape: "edge",
  colors: ["#fff3e8", "#ffb199", "#ff6f61"],
  proportion: 0.55,
  softness: 1.5,
  distortion: 0.1,
  swirl: 0.4,
  swirlIterations: 5,
  shapeScale: 0.7,
} satisfies ShaderWarpProps;

export function ShaderWarpCream({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpCreamPreset}
      {...props}
      speed={shaderWarpCreamPreset.speed * speed}
    />
  );
}
