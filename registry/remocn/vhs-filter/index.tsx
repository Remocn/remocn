"use client";

import type React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";

export type VhsFilterProps = {
  bleed?: number;
  wobble?: number;
  noise?: number;
  intensity?: number;
};

const DEFAULTS = {
  bleed: 1,
  wobble: 1,
  noise: 1,
  intensity: 1,
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform float u_frame;
uniform float u_time;
uniform float u_bleed;
uniform float u_wobble;
uniform float u_noise;
uniform float u_intensity;

in vec2 v_uv;
out vec4 outColor;

const float PI = 3.141592653589793;
const float LINES = 486.0;
const int TAPS = 6;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float a = hash(vec2(i, 7.0));
  float b = hash(vec2(i + 1.0, 7.0));
  return mix(a, b, f * f * (3.0 - 2.0 * f));
}

vec3 rgb2yiq(vec3 c) {
  return vec3(
    dot(c, vec3(0.299, 0.587, 0.114)),
    dot(c, vec3(0.5959, -0.2746, -0.3213)),
    dot(c, vec3(0.2115, -0.5227, 0.3112))
  );
}

vec3 yiq2rgb(vec3 c) {
  return vec3(
    c.x + 0.956 * c.y + 0.619 * c.z,
    c.x - 0.272 * c.y - 0.647 * c.z,
    c.x - 1.106 * c.y + 1.703 * c.z
  );
}

void main() {
  float line = floor(v_uv.y * LINES);
  float clock = mod(u_frame, 64.0);

  float drift =
    sin(v_uv.y * 37.0 + u_time * 2.3) * 0.55 +
    sin(v_uv.y * 96.0 - u_time * 1.1) * 0.25;
  float jitter = valueNoise(line * 0.61 + u_time * 24.0) - 0.5;
  float wobble = (drift * 0.35 + jitter * 0.9) * 0.007 * u_wobble * u_intensity;

  float band = smoothstep(0.955, 0.994, v_uv.y);
  float tear = valueNoise(line * 2.7 + u_time * 43.0) - 0.5;
  float headSwitch = band * tear * 0.085 * u_intensity;

  vec2 uv = vec2(v_uv.x + wobble + headSwitch, v_uv.y);
  vec4 base = texture(u_scene, uv);
  float luma = rgb2yiq(base.rgb).x;

  float smear = u_bleed * 0.02 * u_intensity;
  vec2 chroma = vec2(0.0);
  float total = 0.0;
  for (int i = 0; i < TAPS; i++) {
    float t = float(i) / float(TAPS - 1);
    float weight = 1.0 - t * 0.72;
    vec3 tap = texture(u_scene, vec2(uv.x - smear * t, uv.y)).rgb;
    chroma += rgb2yiq(tap).yz * weight;
    total += weight;
  }

  vec3 color = yiq2rgb(vec3(luma, chroma / total));

  float scan = 0.94 + 0.06 * cos(v_uv.y * LINES * PI);
  color *= mix(1.0, scan, u_intensity);

  float grain =
    hash(vec2(v_uv.x * 640.0 + clock * 13.0, line + clock * 5.0)) - 0.5;
  color += grain * 0.07 * u_noise * u_intensity;

  color = mix(color, vec3(luma), band * 0.55 * u_intensity);
  color += band * (hash(vec2(line, clock * 3.0)) - 0.5) * 0.26 * u_intensity;

  outColor = vec4(clamp(color, 0.0, 1.0), base.a);
}`;

const shader = makeFilterShader<VhsFilterProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const {
      bleed = DEFAULTS.bleed,
      wobble = DEFAULTS.wobble,
      noise = DEFAULTS.noise,
      intensity = DEFAULTS.intensity,
    } = passedProps;
    gl.uniform1f(uniform("u_bleed"), bleed);
    gl.uniform1f(uniform("u_wobble"), wobble);
    gl.uniform1f(uniform("u_noise"), noise);
    gl.uniform1f(uniform("u_intensity"), intensity);
  },
);

const VhsFilterFallback: React.FC<VhsFilterProps & CanvasFilterProps> = ({
  children,
  bleed = DEFAULTS.bleed,
  wobble = DEFAULTS.wobble,
  noise = DEFAULTS.noise,
  intensity = DEFAULTS.intensity,
}) => {
  const frame = useCurrentFrame();
  const shift =
    (random(`vhs-wobble-${frame}`) - 0.5) * 3.4 * wobble * intensity;
  const flicker =
    1 + (random(`vhs-flicker-${frame}`) - 0.5) * 0.07 * noise * intensity;
  const smear = 3 + bleed * 5;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          translate: `${shift}px`,
          filter: `saturate(${1 + bleed * 0.3}) contrast(1.04) brightness(${flicker}) blur(${0.3 * intensity}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          translate: `${shift - smear}px`,
          filter: "saturate(2.2) blur(1.4px)",
          mixBlendMode: "screen",
          opacity: 0.24 * bleed * intensity,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0px, rgba(0, 0, 0, 0.22) 1px, transparent 1px, transparent 3px)",
          opacity: intensity,
        }}
      />
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height: "3.6%",
          translate: `${shift * 3}px`,
          background: `rgba(228, 228, 228, ${0.13 * intensity})`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const VhsFilter = makeCanvasFilter<VhsFilterProps>({
  shader,
  fallback: VhsFilterFallback,
});
