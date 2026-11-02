"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Ink: monochrome ink folds in charcoal and silver with grain.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientInkPreset = {
  speed: 1,
  colors: ["#0b0b0f", "#f4f4f5", "#6b6b76"],
  distortion: 1,
  swirl: 0.25,
  grainOverlay: 0.15,
  rotation: 90,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientInk({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientInkPreset}
      {...props}
      speed={shaderMeshGradientInkPreset.speed * speed}
    />
  );
}
