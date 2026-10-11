"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Synthwave: night-purple field lit by a warm coral sunset glow.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientSynthwavePreset = {
  speed: 1,
  colors: ["#05030f", "#05030f", "#3a1c71", "#d76d77", "#ffaf7b"],
  distortion: 0.9,
  swirl: 0.3,
  rotation: 160,
  offsetX: -0.2,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientSynthwave({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientSynthwavePreset}
      {...props}
      speed={shaderMeshGradientSynthwavePreset.speed * speed}
    />
  );
}
