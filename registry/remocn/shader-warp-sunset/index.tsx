"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Sunset: marbled coral, peach and wine flowing like warm liquid.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpSunsetPreset = {
  speed: 3,
  shape: "checks",
  colors: ["#2d0b16", "#ff5f6d", "#ffc371"],
  proportion: 0.5,
  softness: 1,
  distortion: 0.2,
  swirl: 0.8,
  swirlIterations: 10,
  shapeScale: 0.2,
} satisfies ShaderWarpProps;

export function ShaderWarpSunset({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpSunsetPreset}
      {...props}
      speed={shaderWarpSunsetPreset.speed * speed}
    />
  );
}
