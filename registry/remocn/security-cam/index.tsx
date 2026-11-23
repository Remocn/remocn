"use client";

import type React from "react";
import { AbsoluteFill } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";
import { useSceneConfig } from "@/lib/remocn/frame-rate";

export type SecurityCamProps = {
  compression?: number;
  blockSize?: number;
  noise?: number;
  intensity?: number;
};

const DEFAULTS = {
  compression: 0.7,
  blockSize: 10,
  noise: 0.6,
  intensity: 1,
};

type NormalizedProps = {
  compression: number;
  cellX: number;
  cellY: number;
  noise: number;
  intensity: number;
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform float u_frame;
uniform vec2 u_cell;
uniform float u_compression;
uniform float u_noise;
uniform float u_intensity;

in vec2 v_uv;
out vec4 outColor;

const float PI = 3.141592653589793;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

float lumaOf(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec2 chromaOf(vec3 c) {
  return vec2(c.b - lumaOf(c), c.r - lumaOf(c));
}

vec3 fromLumaChroma(float y, vec2 cbcr) {
  return vec3(y + cbcr.y, y - 0.194 * cbcr.x - 0.509 * cbcr.y, y + cbcr.x);
}

vec3 blockMean(vec2 origin, vec2 cell) {
  vec3 total = vec3(0.0);
  for (int y = 0; y < 2; y++) {
    for (int x = 0; x < 2; x++) {
      vec2 at = origin + (vec2(float(x), float(y)) + 0.5) * cell * 0.5;
      total += texture(u_scene, at).rgb;
    }
  }
  return total * 0.25;
}

void main() {
  vec4 src = texture(u_scene, v_uv);
  float amount = clamp(u_intensity, 0.0, 1.0);

  if (!(amount > 0.001)) {
    outColor = src;
    return;
  }

  vec2 cell = max(u_cell, vec2(0.0008));
  vec2 wide = cell * 2.0;

  vec3 lumaBlock = blockMean(floor(v_uv / cell) * cell, cell);
  vec3 chromaBlock = blockMean(floor(v_uv / wide) * wide, wide);

  float squeeze = clamp(u_compression, 0.0, 1.0) * amount;

  float y = mix(lumaOf(src.rgb), lumaOf(lumaBlock), squeeze * 0.8);
  float levels = mix(255.0, 20.0, squeeze);
  y = floor(y * levels + 0.5) / levels;

  vec2 cbcr = mix(chromaOf(src.rgb), chromaOf(chromaBlock), squeeze);
  cbcr *= mix(1.0, 0.62, amount);

  vec3 color = fromLumaChroma(y, cbcr);

  float pump = 1.0 + 0.03 * sin(u_frame * PI / 45.0) * amount;
  color = clamp((color * pump - 0.05 * amount) / (1.0 - 0.14 * amount), 0.0, 1.0);

  float clock = mod(u_frame, 64.0);
  float shadow = 1.0 - smoothstep(0.0, 0.55, y);
  float grain =
    hash(v_uv + vec2(clock * 0.017, clock * 0.029)) - 0.5;
  color += grain * 0.16 * u_noise * amount * (0.25 + shadow);

  outColor = vec4(clamp(color, 0.0, 1.0), src.a);
}`;

const shader = makeFilterShader<NormalizedProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const { compression, cellX, cellY, noise, intensity } = passedProps;
    gl.uniform1f(uniform("u_compression"), compression);
    gl.uniform2f(uniform("u_cell"), cellX, cellY);
    gl.uniform1f(uniform("u_noise"), noise);
    gl.uniform1f(uniform("u_intensity"), intensity);
  },
);

const SecurityCamFallback: React.FC<NormalizedProps & CanvasFilterProps> = ({
  children,
  intensity,
}) => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        filter: `saturate(${1 - 0.38 * intensity}) contrast(${1 + 0.22 * intensity}) brightness(${1 - 0.05 * intensity})`,
      }}
    >
      {children}
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 82% 80% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.55) 100%)",
        opacity: intensity,
      }}
    />
  </AbsoluteFill>
);

const SecurityCamCanvas = makeCanvasFilter<NormalizedProps>({
  shader,
  fallback: SecurityCamFallback,
});

export const SecurityCam: React.FC<SecurityCamProps & CanvasFilterProps> = ({
  compression = DEFAULTS.compression,
  blockSize = DEFAULTS.blockSize,
  noise = DEFAULTS.noise,
  intensity = DEFAULTS.intensity,
  children,
}) => {
  const { width, height } = useSceneConfig();

  return (
    <SecurityCamCanvas
      compression={compression}
      cellX={Math.max(blockSize, 1) / width}
      cellY={Math.max(blockSize, 1) / height}
      noise={noise}
      intensity={intensity}
    >
      {children}
    </SecurityCamCanvas>
  );
};
