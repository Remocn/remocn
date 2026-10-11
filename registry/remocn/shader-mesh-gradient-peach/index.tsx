"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Peach: warm peach and cream glow with a whisper of film grain.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientPeachPreset = {
  speed: 1,
  colors: ["#fff1e6", "#ffb38a", "#ff7a59", "#f9d5a7"],
  distortion: 0.6,
  swirl: 0.15,
  grainOverlay: 0.08,
  rotation: 45,
  scale: 1.2,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientPeach({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientPeachPreset}
      {...props}
      speed={shaderMeshGradientPeachPreset.speed * speed}
    />
  );
}
