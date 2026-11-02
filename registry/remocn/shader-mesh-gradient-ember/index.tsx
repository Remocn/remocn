"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Ember: molten orange and amber pooling in dark oxblood.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientEmberPreset = {
  speed: 1,
  colors: ["#120404", "#5c0f0f", "#e8410c", "#ffb347"],
  distortion: 0.8,
  swirl: 0.5,
  rotation: 320,
  scale: 0.8,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientEmber({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientEmberPreset}
      {...props}
      speed={shaderMeshGradientEmberPreset.speed * speed}
    />
  );
}
