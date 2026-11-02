"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Citrus: juicy yellow, pink and green bands spiralling on cream.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlCitrusPreset = {
  speed: 1,
  colorBack: "#fff8e1",
  colors: ["#ffd166", "#ef476f", "#06d6a0"],
  bandCount: 3,
  twist: 0.25,
  softness: 0.4,
  noise: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlCitrus({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlCitrusPreset}
      {...props}
      speed={shaderSwirlCitrusPreset.speed * speed}
    />
  );
}
