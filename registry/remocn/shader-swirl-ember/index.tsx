"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Ember: gold and orange fire bands spinning around a dark core.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlEmberPreset = {
  speed: 1,
  colorBack: "#1a0000",
  colors: ["#ffb703", "#fb8500", "#9d0208"],
  bandCount: 4,
  twist: 0.3,
  softness: 0.8,
  noise: 0.3,
  center: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlEmber({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlEmberPreset}
      {...props}
      speed={shaderSwirlEmberPreset.speed * speed}
    />
  );
}
