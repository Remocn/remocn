"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill } from "remotion";
import {
  makeCanvasPresentation,
  makeSceneShader,
} from "@/lib/remocn/canvas-presentation";

export type DisplacementProps = {
  grid?: number;
  cellAspect?: number;
  shift?: number;
  aberration?: number;
  grain?: number;
  stagger?: number;
};

const DEFAULTS = {
  grid: 60,
  cellAspect: 1,
  shift: 1,
  aberration: 1,
  grain: 0.5,
  stagger: 0.45,
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform float u_aspect;
uniform vec2 u_cells;
uniform float u_shift;
uniform float u_aberration;
uniform float u_grain;
uniform float u_stagger;

in vec2 v_uv;
out vec4 outColor;

const float PI = 3.141592653589793;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 cell = floor(v_uv * u_cells);
  float h1 = hash(cell);
  float h2 = hash(cell + 7.3);
  float h3 = hash(cell + 13.1);

  float delay = h3 * u_stagger;
  float phase =
    clamp((u_progress - delay) / max(1.0 - u_stagger, 0.1), 0.0, 1.0);
  float shear = sin(phase * PI);

  vec2 aim = vec2((h1 - 0.5) * 2.0, (h2 - 0.5) * 0.7);
  vec2 dir = aim / max(length(aim), 0.0001);
  vec2 slide = dir * shear * u_shift * 1.4;
  vec2 off = slide / u_cells;
  vec2 fringe = off * u_aberration * 0.35;

  float swap = smoothstep(0.34, 0.66, phase);

  vec4 mid = mix(
    texture(u_from, v_uv - off),
    texture(u_to, v_uv - off),
    swap
  );
  float red = mix(
    texture(u_from, v_uv - off - fringe).r,
    texture(u_to, v_uv - off - fringe).r,
    swap
  );
  float blue = mix(
    texture(u_from, v_uv - off + fringe).b,
    texture(u_to, v_uv - off + fringe).b,
    swap
  );

  vec4 col = vec4(red, mid.g, blue, mid.a);

  float tick = floor(u_progress * 30.0);
  float speck =
    hash(floor(v_uv * vec2(u_aspect, 1.0) * 460.0) + tick * 1.7) - 0.5;
  col.rgb += vec3(speck * u_grain * shear * 0.5) * col.a;
  col.rgb *= 1.0 - 0.12 * shear;

  outColor = col;
}`;

const shader = makeSceneShader<DisplacementProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, width, height, passedProps }) => {
    const {
      grid = DEFAULTS.grid,
      cellAspect = DEFAULTS.cellAspect,
      shift = DEFAULTS.shift,
      aberration = DEFAULTS.aberration,
      grain = DEFAULTS.grain,
      stagger = DEFAULTS.stagger,
    } = passedProps;
    const across = Math.max(grid, 4);
    const ratio = Math.max(cellAspect, 0.25);
    gl.uniform2f(
      uniform("u_cells"),
      across,
      Math.max((across * ratio * height) / width, 2),
    );
    gl.uniform1f(uniform("u_shift"), shift);
    gl.uniform1f(uniform("u_aberration"), aberration);
    gl.uniform1f(uniform("u_grain"), grain);
    gl.uniform1f(uniform("u_stagger"), Math.min(Math.max(stagger, 0), 0.85));
  },
);

const DisplacementFallback: React.FC<
  TransitionPresentationComponentProps<DisplacementProps>
> = ({ children, presentationProgress, presentationDirection }) => {
  const p = presentationProgress;
  const entering = presentationDirection === "entering";
  const t = entering ? p : 1 - p;
  const settle = Math.min(1, Math.max(0, (t - 0.3) / 0.4));
  const jolt = Math.max(0, Math.sin(t * Math.PI)) * 10;

  return (
    <AbsoluteFill
      style={{
        opacity: settle,
        translate: `${entering ? jolt : -jolt}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const presentation = makeCanvasPresentation<DisplacementProps>({
  shader,
  fallback: DisplacementFallback,
});

export function displacement(
  props: DisplacementProps = {},
): TransitionPresentation<DisplacementProps> {
  return presentation(props);
}
