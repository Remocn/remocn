"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Arcade: retro grainy dots in orange, yellow and green on black.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientArcadePreset = {
  speed: 1,
  shape: "dots",
  colorBack: "#111111",
  colors: ["#ff5e3a", "#ffd23f", "#3bceac", "#0ead69"],
  softness: 0.8,
  intensity: 0.6,
  noise: 0.35,
  scale: 0.6,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientArcade({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientArcadePreset}
      {...props}
      speed={shaderGrainGradientArcadePreset.speed * speed}
    />
  );
}
