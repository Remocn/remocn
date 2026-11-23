"use client";

import type React from "react";
import { AbsoluteFill } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";

export type UnderwaterRippleProps = {
  amplitude?: number;
  scale?: number;
  speed?: number;
  dispersion?: number;
};

const DEFAULTS = {
  amplitude: 7,
  scale: 1,
  speed: 2,
  dispersion: 1,
};

type NormalizedProps = {
  amplitude: number;
  scale: number;
  phase: number;
  dispersion: number;
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform float u_aspect;
uniform float u_phase;
uniform float u_amplitude;
uniform float u_scale;
uniform float u_dispersion;

in vec2 v_uv;
out vec4 outColor;

vec2 fieldGradient(vec2 p, float phase) {
  float scale = max(u_scale, 0.05);
  vec2 k1 = vec2(1.0, 0.35);
  vec2 k2 = vec2(-0.42, 1.0);
  vec2 k3 = vec2(0.78, -0.63);
  float f1 = 6.1 * scale;
  float f2 = 8.7 * scale;
  float f3 = 12.3 * scale;

  vec2 g = vec2(0.0);
  g += cos(dot(p, k1) * f1 + phase) * f1 * k1;
  g += cos(dot(p, k2) * f2 - phase * 2.0) * f2 * k2;
  g += cos(dot(p, k3) * f3 + phase * 3.0) * f3 * k3;

  return g / (3.0 * f2);
}

void main() {
  vec2 p = vec2(v_uv.x * u_aspect, v_uv.y);
  vec2 grad = fieldGradient(p, u_phase);

  vec2 offset = grad * u_amplitude;
  float strength = length(grad);
  vec2 direction = strength > 0.0001 ? grad / strength : vec2(0.0);
  float spread = u_dispersion * u_amplitude * 0.3 * min(strength, 2.0);

  vec2 base = v_uv + vec2(offset.x / u_aspect, offset.y);
  vec2 lead = vec2(direction.x / u_aspect, direction.y) * spread;

  vec4 center = texture(u_scene, base);
  float r = texture(u_scene, base + lead).r;
  float b = texture(u_scene, base - lead).b;

  outColor = vec4(r, center.g, b, center.a);
}`;

const shader = makeFilterShader<NormalizedProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const { amplitude, scale, phase, dispersion } = passedProps;
    gl.uniform1f(uniform("u_amplitude"), amplitude);
    gl.uniform1f(uniform("u_scale"), scale);
    gl.uniform1f(uniform("u_phase"), phase);
    gl.uniform1f(uniform("u_dispersion"), dispersion);
  },
);

const UnderwaterRippleFallback: React.FC<
  NormalizedProps & CanvasFilterProps
> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;

const UnderwaterRippleCanvas = makeCanvasFilter<NormalizedProps>({
  shader,
  fallback: UnderwaterRippleFallback,
});

export const UnderwaterRipple: React.FC<
  UnderwaterRippleProps & CanvasFilterProps
> = ({
  amplitude = DEFAULTS.amplitude,
  scale = DEFAULTS.scale,
  speed = DEFAULTS.speed,
  dispersion = DEFAULTS.dispersion,
  children,
}) => {
  const frame = useSceneFrame();
  const { height, durationInFrames } = useSceneConfig();
  const cycle = Math.max(durationInFrames, 1);

  return (
    <UnderwaterRippleCanvas
      amplitude={amplitude / height}
      scale={scale}
      phase={(frame / cycle) * speed * Math.PI * 2}
      dispersion={dispersion}
    >
      {children}
    </UnderwaterRippleCanvas>
  );
};
