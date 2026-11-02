"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Sunrise: grainy wave of coral and gold rising over a plum night.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientSunrisePreset = {
  speed: 1,
  shape: "wave",
  colorBack: "#1b0b2e",
  colors: ["#ff6b6b", "#ffb36b", "#ffe29a"],
  softness: 0.8,
  intensity: 0.2,
  noise: 0.2,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientSunrise({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientSunrisePreset}
      {...props}
      speed={shaderGrainGradientSunrisePreset.speed * speed}
    />
  );
}
