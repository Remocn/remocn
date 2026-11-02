"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Tide: silky blue bands twisting into a deep navy whirlpool.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlTidePreset = {
  speed: 1,
  colorBack: "#012a4a",
  colors: ["#a9d6e5", "#61a5c2", "#2c7da0"],
  bandCount: 5,
  twist: 0.2,
  softness: 1,
  noise: 0.3,
  noiseFrequency: 0.4,
} satisfies ShaderSwirlProps;

export function ShaderSwirlTide({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlTidePreset}
      {...props}
      speed={shaderSwirlTidePreset.speed * speed}
    />
  );
}
