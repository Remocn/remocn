"use client";

import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/components/remocn/shader-warp";

// Rose Gold: satin rose-gold folds with a soft sheen.
// A preset of ShaderWarp. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderWarpRoseGoldPreset = {
  speed: 3,
  shape: "checks",
  colors: ["#2a1515", "#b76e79", "#f6d1c1"],
  proportion: 0.5,
  softness: 1,
  distortion: 0.1,
  swirl: 0.9,
  swirlIterations: 6,
  shapeScale: 0.25,
  scale: 2,
} satisfies ShaderWarpProps;

export function ShaderWarpRoseGold({ speed = 1, ...props }: ShaderWarpProps) {
  return (
    <ShaderWarp
      {...shaderWarpRoseGoldPreset}
      {...props}
      speed={shaderWarpRoseGoldPreset.speed * speed}
    />
  );
}
