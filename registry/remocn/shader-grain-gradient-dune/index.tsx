"use client";

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

// Dune: sandy grain wave in tan, caramel and rust.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientDunePreset = {
  speed: 1,
  shape: "wave",
  colorBack: "#2b1a0e",
  colors: ["#a0522d", "#d9a066", "#f3d9b1"],
  softness: 1,
  intensity: 0.35,
  noise: 0.45,
  rotation: 90,
  scale: 0.8,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientDune({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientDunePreset}
      {...props}
      speed={shaderGrainGradientDunePreset.speed * speed}
    />
  );
}
