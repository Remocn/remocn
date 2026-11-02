"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Tide: teal ripple ring pulsing out of a dark sea-green core.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientTidePreset = {
  speed: 1,
  shape: "ripple",
  colorBack: "#021a1f",
  colors: ["#00c2a8", "#7cf5d9", "#0a6b6b"],
  softness: 0.6,
  intensity: 0.3,
  noise: 0.2,
  scale: 0.7,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientTide({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientTidePreset}
      {...props}
      speed={shaderGrainGradientTidePreset.speed * speed}
    />
  );
}
