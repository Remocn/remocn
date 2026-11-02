"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Dusk: violet dusk with coral and peach light drifting through deep indigo.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientDuskPreset = {
  speed: 1,
  colors: ["#1a1446", "#5b2a86", "#f2709c", "#ff9472", "#2b1e5c"],
  distortion: 0.9,
  swirl: 0.3,
  rotation: 200,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientDusk({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientDuskPreset}
      {...props}
      speed={shaderMeshGradientDuskPreset.speed * speed}
    />
  );
}
