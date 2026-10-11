"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Ultraviolet: electric magenta and blue blob morphing on ultraviolet black.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientUltravioletPreset = {
  speed: 1,
  shape: "blob",
  colorBack: "#0d0221",
  colors: ["#2b2bff", "#ff2bd6", "#00f0ff"],
  softness: 0.5,
  intensity: 0.45,
  noise: 0.25,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientUltraviolet({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientUltravioletPreset}
      {...props}
      speed={shaderGrainGradientUltravioletPreset.speed * speed}
    />
  );
}
