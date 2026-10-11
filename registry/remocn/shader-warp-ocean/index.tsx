"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Ocean: glossy aqua currents traced with dark ink edges.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpOceanPreset = {
  speed: 2,
  shape: "stripes",
  colors: ["#00111f", "#0077b6", "#90e0ef", "#caf0f8"],
  proportion: 0.5,
  softness: 0.8,
  distortion: 0.3,
  swirl: 0.5,
  swirlIterations: 6,
  shapeScale: 0.6,
  rotation: 30,
} satisfies ShaderWarpProps;

export function ShaderWarpOcean({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpOceanPreset}
      {...props}
      speed={shaderWarpOceanPreset.speed * speed}
    />
  );
}
