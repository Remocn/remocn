"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Neon: neon teal, purple and pink vortex around a dark core.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlNeonPreset = {
  speed: 1,
  colorBack: "#07001a",
  colors: ["#00f5d4", "#9b5de5", "#f15bb5"],
  bandCount: 4,
  twist: 0.25,
  softness: 0.6,
  noise: 0.2,
  center: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlNeon({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlNeonPreset}
      {...props}
      speed={shaderSwirlNeonPreset.speed * speed}
    />
  );
}
