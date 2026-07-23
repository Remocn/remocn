"use client";

import { useEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A field of refracted light — caustics. The web of bright filaments light
// makes when it passes through a surface and lands on the floor beneath.
// Written for the remocn registry as a custom WebGL shader (not a
// paper-design wrapper): frame-driven, deterministic, no wall-clock time.
//
// The filaments are slightly denser and brighter toward the bottom of the
// frame — the light lands on the base — which makes it a natural carrier for
// foundation stories. `accent` / `accentAmount` tint the filaments themselves
// (not the floor), so an undertone can arrive mid-video by animating
// `accentAmount` from the master timeline and stay in the light afterwards.

export interface ShaderCausticsProps {
  /** [floor color, filament light color]. */
  colors?: [string, string];
  /** Tint mixed into the bright filaments. */
  accent?: string;
  /** 0..1 — how much of the accent the filaments take. */
  accentAmount?: number;
  /** Spatial frequency of the light web. */
  scale?: number;
  /** Overall brightness of the filaments. */
  intensity?: number;
  /** Global time multiplier. */
  speed?: number;
  className?: string;
}

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_scale;
uniform float u_intensity;
uniform vec3 u_floor;
uniform vec3 u_light;
uniform vec3 u_accent;
uniform float u_accentAmt;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * u_scale;

  // Iterative trigonometric warp: each pass bends the sample point by the
  // previous pass, and the reciprocal distance to the warped axes
  // accumulates into the caustic web.
  float t = u_time * 0.35;
  vec2 i = p;
  float c = 0.0;
  for (int n = 0; n < 4; n++) {
    float phase = t * (1.0 - 3.2 / float(n + 2));
    i = p + vec2(
      cos(phase - i.x) + sin(phase + i.y),
      sin(phase - i.y) + cos(phase + i.x)
    );
    c += 1.0 / length(vec2(
      p.x / (sin(i.x + phase) * 90.0),
      p.y / (cos(i.y + phase) * 90.0)
    ));
  }
  c /= 4.0;
  c = 1.24 - pow(abs(c), 1.35);
  // |c| collapses to zero along thin branching veins — that zero-crossing
  // set IS the caustic web. Light the veins with an exponential falloff
  // (sharp core + a soft halo) and leave everything else near-black.
  float web = exp(-abs(c) * 0.5) + 0.22 * exp(-abs(c) * 0.12);
  web = web / (1.0 + 0.6 * web);

  // The light lands on the base: filaments read stronger low in the frame.
  float ground = mix(1.25, 0.55, uv.y);
  web *= ground * u_intensity;

  // Vignette keeps the corners quiet so type always wins.
  vec2 v = uv - 0.5;
  float vig = 1.0 - dot(v, v) * 1.1;
  web *= clamp(vig, 0.0, 1.0);

  vec3 filament = mix(u_light, u_accent, clamp(u_accentAmt, 0.0, 1.0));
  vec3 col = u_floor + filament * web;

  // A whisper of living grain, time-derived so it stays deterministic.
  col += (hash(gl_FragCoord.xy + floor(u_time * 9.0)) - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

type GlState = {
  gl: WebGLRenderingContext;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

export function ShaderCaustics({
  colors = ["#0a0a0a", "#2e2e33"],
  accent = "#7F57FF",
  accentAmount = 0,
  scale = 5.2,
  intensity = 1,
  speed = 1,
  className,
}: ShaderCausticsProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GlState | null>(null);
  const [handle] = useState(() => delayRender("shader-caustics"));
  const continuedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uniforms: GlState["uniforms"] = {};
    for (const name of [
      "u_res",
      "u_time",
      "u_scale",
      "u_intensity",
      "u_floor",
      "u_light",
      "u_accent",
      "u_accentAmt",
    ]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    stateRef.current = { gl, uniforms };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;
    const { gl, uniforms } = state;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time, (frame / fps) * speed);
    gl.uniform1f(uniforms.u_scale, scale);
    gl.uniform1f(uniforms.u_intensity, intensity);
    gl.uniform3fv(uniforms.u_floor, hexToRgb(colors[0]));
    gl.uniform3fv(uniforms.u_light, hexToRgb(colors[1]));
    gl.uniform3fv(uniforms.u_accent, hexToRgb(accent));
    gl.uniform1f(uniforms.u_accentAmt, accentAmount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!continuedRef.current) {
      continuedRef.current = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => continueRender(handle)),
      );
    }
  }, [
    frame,
    fps,
    speed,
    scale,
    intensity,
    colors,
    accent,
    accentAmount,
    handle,
  ]);

  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
