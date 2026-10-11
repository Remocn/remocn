"use client";

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "@/components/remocn/shader-mesh-gradient";

// Mint: airy mint and sky-blue pastel wash around a deeper green core.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientMintPreset = {
  speed: 1,
  colors: ["#f2fff8", "#9ff2c8", "#3dd6a0", "#c7f0ff", "#1fae8c"],
  distortion: 0.8,
  swirl: 0.2,
  rotation: 180,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientMint({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientMintPreset}
      {...props}
      speed={shaderMeshGradientMintPreset.speed * speed}
    />
  );
}
