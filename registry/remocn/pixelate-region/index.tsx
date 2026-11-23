"use client";

import type React from "react";
import { AbsoluteFill } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";
import { useSceneConfig } from "@/lib/remocn/frame-rate";

export type PixelateRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PixelateRegionProps = {
  regions: PixelateRect[];
  cellSize?: number;
};

const MAX_REGIONS = 8;

const DEFAULTS = {
  cellSize: 24,
};

type NormalizedProps = {
  rects: PixelateRect[];
  cellX: number;
  cellY: number;
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform vec4 u_regions[${MAX_REGIONS}];
uniform int u_region_count;
uniform vec2 u_cell;

in vec2 v_uv;
out vec4 outColor;

const int TAPS = 3;

vec4 cellAverage(vec2 center, vec2 cell) {
  vec4 sum = vec4(0.0);
  for (int y = 0; y < TAPS; y++) {
    for (int x = 0; x < TAPS; x++) {
      vec2 offset =
        (vec2(float(x), float(y)) + 0.5) / float(TAPS) - 0.5;
      sum += texture(u_scene, center + offset * cell);
    }
  }
  return sum / float(TAPS * TAPS);
}

void main() {
  vec4 result = texture(u_scene, v_uv);
  vec2 cell = max(u_cell, vec2(0.0005));

  for (int i = 0; i < ${MAX_REGIONS}; i++) {
    if (i >= u_region_count) {
      continue;
    }
    vec4 region = u_regions[i];
    vec2 lo = region.xy;
    vec2 hi = region.xy + region.zw;
    vec2 hit = step(lo, v_uv) * step(v_uv, hi);
    if (hit.x * hit.y < 0.5) {
      continue;
    }
    vec2 center = lo + (floor((v_uv - lo) / cell) + 0.5) * cell;
    result = vec4(cellAverage(center, cell).rgb, 1.0);
  }

  outColor = result;
}`;

const shader = makeFilterShader<NormalizedProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const { rects, cellX, cellY } = passedProps;
    const packed = new Float32Array(MAX_REGIONS * 4);
    const count = Math.min(rects.length, MAX_REGIONS);
    for (let i = 0; i < count; i++) {
      const rect = rects[i];
      packed[i * 4] = rect.x;
      packed[i * 4 + 1] = rect.y;
      packed[i * 4 + 2] = rect.width;
      packed[i * 4 + 3] = rect.height;
    }
    gl.uniform4fv(uniform("u_regions[0]"), packed);
    gl.uniform1i(uniform("u_region_count"), count);
    gl.uniform2f(uniform("u_cell"), cellX, cellY);
  },
);

const PixelateRegionFallback: React.FC<NormalizedProps & CanvasFilterProps> = ({
  children,
  rects,
}) => (
  <AbsoluteFill>
    {children}
    {rects.map((rect) => (
      <div
        key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}`}
        style={{
          position: "absolute",
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.width * 100}%`,
          height: `${rect.height * 100}%`,
          background: "#14161c",
        }}
      />
    ))}
  </AbsoluteFill>
);

const PixelateRegionCanvas = makeCanvasFilter<NormalizedProps>({
  shader,
  fallback: PixelateRegionFallback,
});

export const PixelateRegion: React.FC<
  PixelateRegionProps & CanvasFilterProps
> = ({ regions, cellSize = DEFAULTS.cellSize, children }) => {
  const { width, height } = useSceneConfig();

  if (regions.length > MAX_REGIONS) {
    throw new Error(
      `pixelate-region: at most ${MAX_REGIONS} regions can be covered at once, received ${regions.length}. Dropping any of them would leave what it covered visible, so nest a second PixelateRegion instead.`,
    );
  }

  const rects = regions.map((region) => ({
    x: region.x / width,
    y: region.y / height,
    width: region.width / width,
    height: region.height / height,
  }));

  return (
    <PixelateRegionCanvas
      rects={rects}
      cellX={cellSize / width}
      cellY={cellSize / height}
    >
      {children}
    </PixelateRegionCanvas>
  );
};
