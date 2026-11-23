"use client";

import type React from "react";
import { AbsoluteFill } from "remotion";
import {
  type CanvasFilterProps,
  makeCanvasFilter,
  makeFilterShader,
} from "@/lib/remocn/canvas-presentation";
import { useSceneConfig } from "@/lib/remocn/frame-rate";

export type AsciiRenderProps = {
  glyphSize?: number;
  charset?: string;
  colored?: boolean;
  ink?: string;
  intensity?: number;
};

const DEFAULTS = {
  glyphSize: 26,
  charset: " .:-=+*#%@",
  colored: false,
  ink: "#9dff9d",
  intensity: 1,
};

const GLYPH_ASPECT = 0.545;
const ATLAS_CELL_W = 24;
const ATLAS_CELL_H = 44;
const ATLAS_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

type NormalizedProps = {
  cellX: number;
  cellY: number;
  charset: string;
  colored: boolean;
  ink: string;
  intensity: number;
};

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_atlas;
uniform vec2 u_cell;
uniform float u_glyph_count;
uniform float u_colored;
uniform vec3 u_ink;
uniform float u_intensity;

in vec2 v_uv;
out vec4 outColor;

const int TAPS = 3;

vec4 cellAverage(vec2 center, vec2 cell) {
  vec4 sum = vec4(0.0);
  for (int y = 0; y < TAPS; y++) {
    for (int x = 0; x < TAPS; x++) {
      vec2 offset = (vec2(float(x), float(y)) + 0.5) / float(TAPS) - 0.5;
      sum += texture(u_scene, center + offset * cell);
    }
  }
  return sum / float(TAPS * TAPS);
}

void main() {
  vec2 cell = max(u_cell, vec2(0.001));
  vec2 origin = floor(v_uv / cell) * cell;
  vec4 sampled = cellAverage(origin + cell * 0.5, cell);

  float luma = dot(sampled.rgb, vec3(0.299, 0.587, 0.114));
  float index = min(floor(luma * u_glyph_count), u_glyph_count - 1.0);

  vec2 local = clamp((v_uv - origin) / cell, 0.008, 0.992);
  float mask =
    texture(u_atlas, vec2((index + local.x) / u_glyph_count, local.y)).r;

  vec3 glyph = mix(u_ink, sampled.rgb, u_colored) * mask;
  vec4 source = texture(u_scene, v_uv);
  float amount = clamp(u_intensity, 0.0, 1.0);

  outColor = vec4(
    mix(source.rgb, glyph, amount),
    mix(source.a, max(mask, sampled.a), amount)
  );
}`;

type Atlas = { charset: string; texture: WebGLTexture };

const atlases = new WeakMap<WebGL2RenderingContext, Atlas>();

function drawAtlas(charset: string): OffscreenCanvas {
  const canvas = new OffscreenCanvas(
    ATLAS_CELL_W * charset.length,
    ATLAS_CELL_H,
  );
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("ascii-render: failed to acquire a 2D context");
  }
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = `${Math.round(ATLAS_CELL_H * 0.74)}px ${ATLAS_FONT}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let i = 0; i < charset.length; i++) {
    context.fillText(
      charset[i],
      i * ATLAS_CELL_W + ATLAS_CELL_W / 2,
      ATLAS_CELL_H / 2,
    );
  }
  return canvas;
}

function bindAtlas(gl: WebGL2RenderingContext, charset: string): void {
  gl.activeTexture(gl.TEXTURE1);

  let atlas = atlases.get(gl);
  if (!atlas) {
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("ascii-render: failed to create the glyph atlas");
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    atlas = { charset: "", texture };
    atlases.set(gl, atlas);
  } else {
    gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
  }

  if (atlas.charset !== charset) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      drawAtlas(charset),
    );
    atlas.charset = charset;
  }
}

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

const shader = makeFilterShader<NormalizedProps>(
  FRAGMENT_SHADER,
  ({ gl, uniform, passedProps }) => {
    const { cellX, cellY, charset, colored, ink, intensity } = passedProps;
    bindAtlas(gl, charset);
    gl.uniform1i(uniform("u_atlas"), 1);
    gl.uniform1f(uniform("u_glyph_count"), charset.length);
    gl.uniform2f(uniform("u_cell"), cellX, cellY);
    gl.uniform1f(uniform("u_colored"), colored ? 1 : 0);
    gl.uniform3fv(uniform("u_ink"), toRgb(ink));
    gl.uniform1f(uniform("u_intensity"), intensity);
  },
);

const AsciiRenderFallback: React.FC<NormalizedProps & CanvasFilterProps> = ({
  children,
}) => <AbsoluteFill>{children}</AbsoluteFill>;

const AsciiRenderCanvas = makeCanvasFilter<NormalizedProps>({
  shader,
  fallback: AsciiRenderFallback,
});

export const AsciiRender: React.FC<AsciiRenderProps & CanvasFilterProps> = ({
  glyphSize = DEFAULTS.glyphSize,
  charset = DEFAULTS.charset,
  colored = DEFAULTS.colored,
  ink = DEFAULTS.ink,
  intensity = DEFAULTS.intensity,
  children,
}) => {
  const { width, height } = useSceneConfig();
  const resolved = charset.length > 0 ? charset : DEFAULTS.charset;

  return (
    <AsciiRenderCanvas
      cellX={(glyphSize * GLYPH_ASPECT) / width}
      cellY={glyphSize / height}
      charset={resolved}
      colored={colored}
      ink={ink}
      intensity={intensity}
    >
      {children}
    </AsciiRenderCanvas>
  );
};
