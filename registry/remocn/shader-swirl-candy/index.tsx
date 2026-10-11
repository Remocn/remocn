"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Candy: pastel pink, lilac and sky-blue spiral, soft and sweet.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlCandyPreset = {
  speed: 1,
  colorBack: "#ffe3f1",
  colors: ["#ff8fc7", "#b69cff", "#7fd6ff"],
  bandCount: 3,
  twist: 0.15,
  softness: 1,
  noise: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlCandy({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlCandyPreset}
      {...props}
      speed={shaderSwirlCandyPreset.speed * speed}
    />
  );
}
