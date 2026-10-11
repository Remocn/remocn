"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Sunburst: retro cream and orange bands sweeping in from above.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlSunburstPreset = {
  speed: 1,
  colorBack: "#ff7a3d",
  colors: ["#fff4d6", "#ffc98b", "#ff7a3d"],
  bandCount: 2,
  twist: 0.3,
  center: 0.2,
  softness: 0.2,
  noise: 0,
  offsetY: 0.9,
} satisfies ShaderSwirlProps;

export function ShaderSwirlSunburst({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlSunburstPreset}
      {...props}
      speed={shaderSwirlSunburstPreset.speed * speed}
    />
  );
}
