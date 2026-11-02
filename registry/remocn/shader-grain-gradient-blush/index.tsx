"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Blush: pastel pink and apricot blob morphing on warm off-white.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientBlushPreset = {
  speed: 1,
  shape: "blob",
  colorBack: "#fff4ef",
  colors: ["#ffb3c6", "#ffd6a5", "#cdb4ff"],
  softness: 0.9,
  intensity: 0.2,
  noise: 0.12,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientBlush({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientBlushPreset}
      {...props}
      speed={shaderGrainGradientBlushPreset.speed * speed}
    />
  );
}
