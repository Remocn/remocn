"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Horizon: peach horizon band rolling between navy and pale sky.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientHorizonPreset = {
  speed: 1,
  shape: "wave",
  colorBack: "#0b1d3a",
  colors: ["#ff8a5b", "#ffcf87", "#9ad0ff"],
  softness: 0.9,
  intensity: 0.15,
  noise: 0.25,
  rotation: 180,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientHorizon({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientHorizonPreset}
      {...props}
      speed={shaderGrainGradientHorizonPreset.speed * speed}
    />
  );
}
