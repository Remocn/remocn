"use client";

import { useEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A field of fine horizontal sediment layers — strata. Each layer's edge is
// displaced by fbm noise and drifts at its own depth speed, so the stack reads
// as a living foundation rather than a gradient. Written for the remocn
// registry as a custom WebGL shader (not a paper-design wrapper): frame-driven,
// deterministic, no wall-clock time anywhere.
//
// `accent` / `accentAmount` tint the DEEP strata (the bottom of the frame) —
// the layers everything else stands on — which is what makes it a natural
// carrier for "base" stories: the undertone can arrive mid-video by animating
// `accentAmount` with the master timeline.

export interface ShaderStrataProps {
  /** Palette from the deepest layer to the surface layer. Exactly 4 stops. */
  colors?: [string, string, string, string];
  /** Tint mixed into the deep strata. */
  accent?: string;
  /** 0..1 — how much of the accent the deep strata take. */
  accentAmount?: number;
  /** Number of strata bands across the frame height. */
  layers?: number;
  /** Edge waviness of each layer, in fractions of the frame height. */
  amplitude?: number;
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
uniform float u_layers;
uniform float u_amp;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_accent;
uniform float u_accentAmt;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  // Deeper layers drift faster — parallax without per-band recursion.
  float drift = u_time * (0.012 + 0.05 * (1.0 - uv.y));
  float w = fbm(vec2(uv.x * 2.6 * aspect + drift, uv.y * 2.2 - u_time * 0.01));

  float yd = uv.y + (w - 0.5) * u_amp;
  float band = yd * u_layers;
  float idx = floor(band);
  float f = fract(band);

  // Per-band value jitter + a soft sediment shadow at each band's lower edge.
  float j = hash(vec2(idx, 7.0));
  float edge = smoothstep(0.0, 0.4, f) * (1.0 - 0.3 * smoothstep(0.8, 1.0, f));

  float depth = clamp(idx / u_layers, 0.0, 1.0);
  vec3 col = mix(u_c0, u_c1, smoothstep(0.0, 0.4, depth));
  col = mix(col, u_c2, smoothstep(0.35, 0.75, depth));
  col = mix(col, u_c3, smoothstep(0.7, 1.0, depth));
  col *= 0.84 + 0.16 * j;
  col *= 0.92 + 0.08 * edge;

  // The accent rises from the deep strata and thins toward the surface.
  float mask = (1.0 - uv.y);
  mask *= mask;
  col = mix(col, u_accent, clamp(u_accentAmt, 0.0, 1.0) * mask * 0.38);

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

export function ShaderStrata({
  colors = ["#050507", "#0a0a0d", "#111014", "#17161b"],
  accent = "#6733FF",
  accentAmount = 0,
  layers = 14,
  amplitude = 0.16,
  speed = 1,
  className,
}: ShaderStrataProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GlState | null>(null);
  const [handle] = useState(() => delayRender("shader-strata"));
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
      "u_layers",
      "u_amp",
      "u_c0",
      "u_c1",
      "u_c2",
      "u_c3",
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
    gl.uniform1f(uniforms.u_layers, layers);
    gl.uniform1f(uniforms.u_amp, amplitude);
    gl.uniform3fv(uniforms.u_c0, hexToRgb(colors[0]));
    gl.uniform3fv(uniforms.u_c1, hexToRgb(colors[1]));
    gl.uniform3fv(uniforms.u_c2, hexToRgb(colors[2]));
    gl.uniform3fv(uniforms.u_c3, hexToRgb(colors[3]));
    gl.uniform3fv(uniforms.u_accent, hexToRgb(accent));
    gl.uniform1f(uniforms.u_accentAmt, accentAmount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!continuedRef.current) {
      continuedRef.current = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => continueRender(handle)),
      );
    }
  }, [frame, fps, speed, layers, amplitude, colors, accent, accentAmount, handle]);

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
