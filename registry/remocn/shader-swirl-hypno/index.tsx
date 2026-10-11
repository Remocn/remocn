"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Hypno: high-contrast black and white hypnotic spiral.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlHypnoPreset = {
  speed: 1,
  colorBack: "#0b0b0b",
  colors: ["#f5f5f5"],
  bandCount: 6,
  twist: 0.25,
  softness: 0,
  noise: 0,
  center: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlHypno({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlHypnoPreset}
      {...props}
      speed={shaderSwirlHypnoPreset.speed * speed}
    />
  );
}
