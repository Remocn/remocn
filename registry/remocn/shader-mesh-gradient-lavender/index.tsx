"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Lavender: soft lilac and pink haze with grain-softened edges.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientLavenderPreset = {
  speed: 1,
  colors: ["#e9e4ff", "#b8a6ff", "#7f6bff", "#ffd6f2"],
  distortion: 0.9,
  swirl: 0.1,
  grainMixer: 0.2,
  rotation: 135,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientLavender({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientLavenderPreset}
      {...props}
      speed={shaderMeshGradientLavenderPreset.speed * speed}
    />
  );
}
