"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Aurora: cyan and violet ribbons swirling out of a near-black sky.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientAuroraPreset = {
  speed: 1,
  colors: ["#020617", "#0ea5a4", "#22d3ee", "#7c3aed", "#020617"],
  distortion: 1,
  swirl: 0.8,
  rotation: 270,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientAurora({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientAuroraPreset}
      {...props}
      speed={shaderMeshGradientAuroraPreset.speed * speed}
    />
  );
}
