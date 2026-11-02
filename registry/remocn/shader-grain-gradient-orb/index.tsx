"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Orb: large grainy sphere in periwinkle, violet and pink.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientOrbPreset = {
  speed: 1,
  shape: "sphere",
  colorBack: "#0a0a12",
  colors: ["#4f7cff", "#b06bff", "#ffd1f0"],
  softness: 0.6,
  intensity: 0.3,
  noise: 0.15,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientOrb({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientOrbPreset}
      {...props}
      speed={shaderGrainGradientOrbPreset.speed * speed}
    />
  );
}
