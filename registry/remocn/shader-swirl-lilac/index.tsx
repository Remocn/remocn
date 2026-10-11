"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Lilac: dreamy lilac and baby-blue swirl around a dark eye.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlLilacPreset = {
  speed: 1,
  colorBack: "#2e1a47",
  colors: ["#e0c3fc", "#8ec5fc"],
  bandCount: 2,
  twist: 0.1,
  softness: 1,
  noise: 0.15,
} satisfies ShaderSwirlProps;

export function ShaderSwirlLilac({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlLilacPreset}
      {...props}
      speed={shaderSwirlLilacPreset.speed * speed}
    />
  );
}
