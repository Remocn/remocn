"use client";

import {
  ShaderSwirl,
  type ShaderSwirlProps,
} from "@/components/remocn/shader-swirl";

// Retro: seventies spiral in orange, sand and teal.
// A preset of ShaderSwirl. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderSwirlRetroPreset = {
  speed: 1,
  colorBack: "#f4e9d8",
  colors: ["#e76f51", "#f4a261", "#2a9d8f", "#264653"],
  bandCount: 4,
  twist: 0.2,
  softness: 0,
  noise: 0,
} satisfies ShaderSwirlProps;

export function ShaderSwirlRetro({ speed = 1, ...props }: ShaderSwirlProps) {
  return (
    <ShaderSwirl
      {...shaderSwirlRetroPreset}
      {...props}
      speed={shaderSwirlRetroPreset.speed * speed}
    />
  );
}
