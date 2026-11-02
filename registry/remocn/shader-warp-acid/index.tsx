"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Acid: loud lime and cyan fluid swirling over black.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpAcidPreset = {
  speed: 3,
  shape: "checks",
  colors: ["#0a0a0a", "#c6ff00", "#00e5ff"],
  proportion: 0.5,
  softness: 0.3,
  distortion: 0.2,
  swirl: 0.7,
  swirlIterations: 8,
  shapeScale: 0.3,
} satisfies ShaderWarpProps;

export function ShaderWarpAcid({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpAcidPreset}
      {...props}
      speed={shaderWarpAcidPreset.speed * speed}
    />
  );
}
