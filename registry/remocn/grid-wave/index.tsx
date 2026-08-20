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

export type GridWaveDirection = "ripple" | "left" | "right" | "up" | "down";

export type GridWaveProps = {
  tileSize?: number;
  waveWidth?: number;
  lift?: number;
  gap?: number;
  tint?: string;
  direction?: GridWaveDirection;
};

const DEFAULTS = {
  tileSize: 90,
  waveWidth: 0.16,
  lift: 2,
  gap: 0.12,
  tint: "#8fb4ff",
  direction: "ripple" as GridWaveDirection,
};

const AXES: Record<GridWaveDirection, [number, number]> = {
  ripple: [0, 0],
  left: [1, 0],
  right: [-1, 0],
  up: [0, -1],
  down: [0, 1],
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) {
    return [0.56, 0.71, 1];
  }
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform float u_aspect;
uniform vec2 u_grid;
uniform float u_wave;
uniform float u_lift;
uniform float u_gap;
uniform vec3 u_tint;
uniform vec2 u_dir;
uniform float u_radial;

in vec2 v_uv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float waveCoord(vec2 p) {
  vec2 off = (p - 0.5) * vec2(u_aspect, 1.0);
  float ring = length(off) / (0.5 * sqrt(u_aspect * u_aspect + 1.0));
  float sweep = clamp(dot(p - 0.5, u_dir) + 0.5, 0.0, 1.0);
  return mix(sweep, ring, u_radial);
}

void main() {
  float front = u_progress * (1.0 + 6.0 * u_wave) - 3.0 * u_wave;

  float selfPass =
    smoothstep(-u_wave * 0.4, u_wave * 0.4, front - waveCoord(v_uv));
  vec4 base = mix(texture(u_from, v_uv), texture(u_to, v_uv), selfPass);

  float edge = 0.5 - u_gap * 0.5;
  vec2 anchor = floor(v_uv * u_grid);

  vec4 face = vec4(0.0);
  float depth = -1.0;

  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 cell = anchor + vec2(float(ox), float(oy));
      vec2 centre = (cell + 0.5) / u_grid;

      float stagger = (hash(cell) - 0.5) * u_wave * 0.4;
      float w = front - waveCoord(centre) + stagger;
      float band = w / u_wave;
      float pulse = exp(-band * band);
      if (pulse <= depth) {
        continue;
      }

      float rise = pulse * u_lift;
      vec2 lean = centre - 0.5;
      lean = lean / max(length(lean), 0.0001) * rise * 0.15;
      float grow = 1.0 + rise * 0.5;

      vec2 q = (v_uv - centre) * u_grid;
      vec2 top = (q - lean) / grow;
      float onTop = max(abs(top.x), abs(top.y));
      float onFoot = max(abs(q.x), abs(q.y));
      bool lit = onTop <= edge;
      if (!lit && onFoot > edge) {
        continue;
      }
      depth = pulse;

      float pass = smoothstep(-u_wave * 0.4, u_wave * 0.4, w);
      vec2 local = lit ? top : clamp(top, -edge, edge);
      vec2 src = centre + local / u_grid;
      vec4 col = mix(texture(u_from, src), texture(u_to, src), pass);

      if (lit) {
        col.rgb = mix(col.rgb, u_tint, pulse * 0.12);
        col.rgb *= 1.0 + pulse * 0.06;
      } else {
        col.rgb = mix(col.rgb, u_tint, pulse * 0.06);
        col.rgb *= 1.0 - pulse * 0.24;
      }

      face = col;
    }
  }

  outColor = face + base * (1.0 - face.a);
}`;

const shader = makeSceneShader<GridWaveProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, width, height, passedProps }) => {
    const {
      tileSize = DEFAULTS.tileSize,
      waveWidth = DEFAULTS.waveWidth,
      lift = DEFAULTS.lift,
      gap = DEFAULTS.gap,
      tint = DEFAULTS.tint,
      direction = DEFAULTS.direction,
    } = passedProps;
    const size = Math.max(tileSize, 8);
    const axis = AXES[direction] ?? AXES[DEFAULTS.direction];
    const rgb = hexToRgb(tint);
    gl.uniform2f(
      uniform("u_grid"),
      Math.max(Math.round(width / size), 2),
      Math.max(Math.round(height / size), 2),
    );
    gl.uniform1f(uniform("u_wave"), Math.max(waveWidth, 0.02));
    gl.uniform1f(uniform("u_lift"), Math.max(lift, 0) * 0.35);
    gl.uniform1f(uniform("u_gap"), Math.min(Math.max(gap, 0), 0.45));
    gl.uniform3f(uniform("u_tint"), rgb[0], rgb[1], rgb[2]);
    gl.uniform2f(uniform("u_dir"), axis[0], axis[1]);
    gl.uniform1f(uniform("u_radial"), direction === "ripple" ? 1 : 0);
  },
);

const GridWaveFallback: React.FC<
  TransitionPresentationComponentProps<GridWaveProps>
> = ({ children, presentationProgress, presentationDirection }) => {
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const reveal = Math.min(1, Math.max(0, (p - 0.2) / 0.6));

  return (
    <AbsoluteFill
      style={{
        opacity: reveal,
        scale: `${1.04 - reveal * 0.04}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const presentation = makeCanvasPresentation<GridWaveProps>({
  shader,
  fallback: GridWaveFallback,
});

export function gridWave(
  props: GridWaveProps = {},
): TransitionPresentation<GridWaveProps> {
  return presentation(props);
}
