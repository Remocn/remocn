"use client";

import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";

export type TvPowerOffProps = {
  durationInFrames?: number;
  delay?: number;
  gain?: number;
  afterglow?: number;
  phosphor?: string;
};

const DEFAULTS = {
  durationInFrames: 18,
  delay: 0,
  gain: 1,
  afterglow: 1,
  phosphor: "#d8ecff",
};

const COLLAPSE_END = 0.6;
const PINCH_END = 0.82;
const MIN_SQUASH = 0.0055;
const MIN_PINCH = 0.004;
const CONCENTRATION = 0.3;
const DECAY_CURVE = 2.6;
const BLACKOUT_IN = 0.06;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_aspect;
uniform float u_progress;
uniform float u_gain;
uniform float u_afterglow;
uniform vec3 u_phosphor;

in vec2 v_uv;
out vec4 outColor;

const int TAPS = 32;
const int COLUMN_TAPS = 8;
const float GOLDEN = 0.6180339887;
const float COLLAPSE_END = ${COLLAPSE_END.toFixed(4)};
const float PINCH_END = ${PINCH_END.toFixed(4)};
const float MIN_SQUASH = ${MIN_SQUASH.toFixed(5)};
const float MIN_PINCH = ${MIN_PINCH.toFixed(5)};
const float CONCENTRATION = ${CONCENTRATION.toFixed(4)};
const float DECAY_CURVE = ${DECAY_CURVE.toFixed(4)};
const float BLACKOUT_IN = ${BLACKOUT_IN.toFixed(4)};

void main() {
  float p = u_progress;

  if (p <= 0.0) {
    outColor = texture(u_scene, v_uv);
    return;
  }
  if (p >= 1.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float collapse = clamp(p / COLLAPSE_END, 0.0, 1.0);
  float pinch = clamp((p - COLLAPSE_END) / (PINCH_END - COLLAPSE_END), 0.0, 1.0);
  float decayed = clamp((p - PINCH_END) / (1.0 - PINCH_END), 0.0, 1.0);

  vec2 scale = vec2(pow(MIN_PINCH, pinch), pow(MIN_SQUASH, collapse));
  vec2 centered = (v_uv - 0.5) / scale + 0.5;
  vec2 span = 1.0 / (scale * u_resolution);

  vec3 sum = vec3(0.0);
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i);
    vec2 at = centered + vec2(
      (fract(fi * GOLDEN + 0.5) - 0.5) * span.x,
      ((fi + 0.5) / float(TAPS) - 0.5) * span.y
    );
    vec2 inside = step(vec2(0.0), at) * step(at, vec2(1.0));
    sum += texture(u_scene, at).rgb * inside.x * inside.y;
  }

  float concentrate = pow(1.0 / (scale.x * scale.y), CONCENTRATION);
  vec3 light =
    (sum / float(TAPS)) * (1.0 + (concentrate - 1.0) * max(u_gain, 0.0));

  float glow = max(u_afterglow, 0.0);
  float bleed = smoothstep(0.2, 0.8, collapse) * (1.0 - pinch) * glow;

  if (bleed > 0.0) {
    vec3 column = vec3(0.0);
    float cx = clamp(centered.x, 0.0, 1.0);
    for (int i = 0; i < COLUMN_TAPS; i++) {
      column +=
        texture(u_scene, vec2(cx, (float(i) + 0.5) / float(COLUMN_TAPS))).rgb;
    }
    column /= float(COLUMN_TAPS);

    float dy = v_uv.y - 0.5;
    float reach = 0.02 + 0.03 * collapse;
    light +=
      column *
      mix(vec3(1.0), u_phosphor, 0.65) *
      exp(-(dy * dy) / (reach * reach)) *
      bleed *
      0.9;
  }

  if (pinch > 0.0) {
    vec2 d = (v_uv - 0.5) * vec2(u_aspect, 1.0);
    float radius = max(0.045 * glow, 0.0005);
    light +=
      u_phosphor *
      exp(-dot(d, d) / (radius * radius)) *
      smoothstep(0.0, 0.5, pinch) *
      1.15;
  }

  light *= pow(max(1.0 - decayed, 0.0001), DECAY_CURVE);

  float blackout = smoothstep(0.0, BLACKOUT_IN, p);
  outColor = vec4(
    clamp(light, 0.0, 1.0),
    mix(texture(u_scene, v_uv).a, 1.0, blackout)
  );
}`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return [1, 1, 1];
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

function powerProgress(props: TvPowerOffProps, frame: number): number {
  const {
    durationInFrames = DEFAULTS.durationInFrames,
    delay = DEFAULTS.delay,
  } = props;
  return clamp((frame - delay) / Math.max(1, durationInFrames), 0, 1);
}

const shader = makeFilterShader<TvPowerOffProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, width, height, frame, passedProps }) => {
    const {
      gain = DEFAULTS.gain,
      afterglow = DEFAULTS.afterglow,
      phosphor = DEFAULTS.phosphor,
    } = passedProps;
    gl.uniform1f(uniform("u_progress"), powerProgress(passedProps, frame));
    gl.uniform2f(uniform("u_resolution"), width, height);
    gl.uniform1f(uniform("u_gain"), gain);
    gl.uniform1f(uniform("u_afterglow"), afterglow);
    gl.uniform3fv(uniform("u_phosphor"), toRgb(phosphor));
  },
);

const TvPowerOffFallback: React.FC<TvPowerOffProps & CanvasFilterProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const {
    children,
    gain = DEFAULTS.gain,
    afterglow = DEFAULTS.afterglow,
    phosphor = DEFAULTS.phosphor,
  } = props;

  const p = powerProgress(props, frame);
  const collapse = clamp(p / COLLAPSE_END, 0, 1);
  const pinch = clamp((p - COLLAPSE_END) / (PINCH_END - COLLAPSE_END), 0, 1);
  const decayed = clamp((p - PINCH_END) / (1 - PINCH_END), 0, 1);

  const squash = MIN_SQUASH ** collapse;
  const pinchX = MIN_PINCH ** pinch;
  const concentrate = (1 / (squash * pinchX)) ** CONCENTRATION;
  const fade = (1 - decayed) ** DECAY_CURVE;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "#000000",
          opacity: clamp(p / BLACKOUT_IN, 0, 1),
        }}
      />
      <AbsoluteFill
        style={{
          scale: `${pinchX} ${squash}`,
          filter: `brightness(${1 + (concentrate - 1) * Math.max(gain, 0)})`,
          opacity: fade,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${phosphor} 0%, transparent 55%)`,
          opacity: clamp(pinch * afterglow, 0, 1) * fade,
        }}
      />
    </AbsoluteFill>
  );
};

export const TvPowerOff = makeCanvasFilter<TvPowerOffProps>({
  shader,
  fallback: TvPowerOffFallback,
});
