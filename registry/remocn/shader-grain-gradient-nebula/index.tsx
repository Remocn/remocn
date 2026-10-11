"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Nebula: magenta and cyan glow blooming from the corners of deep space.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientNebulaPreset = {
  speed: 1,
  shape: "corners",
  colorBack: "#05010f",
  colors: ["#7a2cff", "#ff4ecd", "#2ec5ff"],
  softness: 1,
  intensity: 0.7,
  noise: 0.2,
  scale: 0.6,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientNebula({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientNebulaPreset}
      {...props}
      speed={shaderGrainGradientNebulaPreset.speed * speed}
    />
  );
}
