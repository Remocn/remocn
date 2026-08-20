"use client";

import type React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";

export type SustainedGlitchProps = {
  intensity?: number;
  frequency?: number;
  slices?: number;
  seed?: number;
};

const DEFAULTS = {
  intensity: 1,
  frequency: 1,
  slices: 24,
  seed: 1,
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform float u_frame;
uniform float u_intensity;
uniform float u_frequency;
uniform float u_slices;
uniform float u_seed;

in vec2 v_uv;
out vec4 outColor;

const float BLOCK_COLUMNS = 16.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec4 sampleSplit(vec2 uv, float split) {
  vec4 center = texture(u_scene, uv);
  float r = texture(u_scene, fract(vec2(uv.x + split, uv.y))).r;
  float b = texture(u_scene, fract(vec2(uv.x - split, uv.y))).b;
  return vec4(r, center.g, b, center.a);
}

void main() {
  float slotLength = max(30.0 / max(u_frequency, 0.1), 4.0);
  float slot = floor(u_frame / slotLength);
  float local = u_frame - slot * slotLength;

  float burstLength = 2.0 + floor(hash(vec2(slot, u_seed + 2.0)) * 4.0);
  float start =
    floor(hash(vec2(slot, u_seed + 1.0)) * max(slotLength - burstLength, 1.0));
  float fires = step(0.25, hash(vec2(slot, u_seed + 3.0)));

  float age = local - start;
  float live = fires * step(0.0, age) * step(age, burstLength - 1.0);
  float energy =
    max(u_intensity, 0.0) * live * (1.0 - age / burstLength);

  if (energy <= 0.0) {
    outColor = texture(u_scene, v_uv);
    return;
  }

  float clock = mod(u_frame, 512.0) + u_seed;
  float row = floor(v_uv.y * max(u_slices, 2.0));
  float torn = step(0.45, hash(vec2(row, clock)));
  float amount = hash(vec2(row + 17.0, clock * 1.7 + 3.0)) - 0.5;
  float sliceShift = amount * 0.28 * energy * torn;

  vec2 block = vec2(floor(v_uv.x * BLOCK_COLUMNS), row);
  float corrupt = step(1.0 - 0.45 * min(energy, 1.0), hash(block + clock * 7.3));
  vec2 jump =
    vec2(
      hash(block + clock * 3.1 + 5.0) - 0.5,
      hash(block + clock * 9.7 + 11.0) - 0.5
    ) *
    vec2(0.62, 0.34) *
    corrupt;

  vec2 uv = fract(v_uv + vec2(sliceShift, 0.0) + jump);
  float split = 0.02 * energy * (0.35 + abs(amount));

  vec4 color = sampleSplit(uv, split);
  color.rgb +=
    vec3(0.05, 0.015, 0.09) *
    energy *
    torn *
    hash(vec2(row, clock + 41.0)) *
    color.a;

  outColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
}`;

const shader = makeFilterShader<SustainedGlitchProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const {
      intensity = DEFAULTS.intensity,
      frequency = DEFAULTS.frequency,
      slices = DEFAULTS.slices,
      seed = DEFAULTS.seed,
    } = passedProps;
    gl.uniform1f(uniform("u_intensity"), intensity);
    gl.uniform1f(uniform("u_frequency"), frequency);
    gl.uniform1f(uniform("u_slices"), slices);
    gl.uniform1f(uniform("u_seed"), seed);
  },
);

function burstEnergy(
  frame: number,
  intensity: number,
  frequency: number,
  seed: number,
): number {
  const slotLength = Math.max(30 / Math.max(frequency, 0.1), 4);
  const slot = Math.floor(frame / slotLength);
  const local = frame - slot * slotLength;

  const burstLength = 2 + Math.floor(random(`glitch-len-${seed}-${slot}`) * 4);
  const start = Math.floor(
    random(`glitch-start-${seed}-${slot}`) *
      Math.max(slotLength - burstLength, 1),
  );
  if (random(`glitch-fire-${seed}-${slot}`) < 0.25) return 0;

  const age = local - start;
  if (age < 0 || age > burstLength - 1) return 0;
  return Math.max(intensity, 0) * (1 - age / burstLength);
}

const SustainedGlitchFallback: React.FC<
  SustainedGlitchProps & CanvasFilterProps
> = ({
  children,
  intensity = DEFAULTS.intensity,
  frequency = DEFAULTS.frequency,
  slices = DEFAULTS.slices,
  seed = DEFAULTS.seed,
}) => {
  const frame = useCurrentFrame();
  const energy = burstEnergy(frame, intensity, frequency, seed);

  if (energy <= 0) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const bands = Math.max(2, Math.min(6, Math.round(slices / 5)));
  const height = 100 / bands;

  return (
    <AbsoluteFill>
      {Array.from({ length: bands }, (_, band) => {
        const shift =
          (random(`glitch-shift-${seed}-${frame}-${band}`) - 0.5) * 46 * energy;
        const tint = band % 2 === 0 ? "rgb(255, 42, 90)" : "rgb(0, 224, 255)";
        return (
          <AbsoluteFill
            key={band}
            style={{
              clipPath: `inset(${band * height}% 0 ${100 - (band + 1) * height}% 0)`,
              translate: `${shift}px`,
            }}
          >
            {children}
            <AbsoluteFill
              style={{
                background: tint,
                mixBlendMode: "screen",
                opacity:
                  0.18 *
                  energy *
                  random(`glitch-tint-${seed}-${frame}-${band}`),
              }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const SustainedGlitch = makeCanvasFilter<SustainedGlitchProps>({
  shader,
  fallback: SustainedGlitchFallback,
});
