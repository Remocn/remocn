"use client";

import { useEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A woven substrate — warp and weft threads crossing on a domain-warped grid,
// interlacing over/under like real cloth, with a slow sheen of light travelling
// across the fabric rather than the grid scrolling. The metaphor: the base a
// component is woven from. Written for the remocn registry as a custom WebGL
// shader (not a paper-design wrapper): frame-driven, deterministic, no
// wall-clock time anywhere.
//
// `accent` / `accentAmount` run a coloured thread through the weave — the tint
// lives mostly IN the threads, so raising `accentAmount` mid-video reads as a
// violet thread lighting up across the whole cloth (a natural carrier for a
// "new base" story). The grid itself never moves; only the light does.

export interface ShaderWeaveProps {
  /** Palette: fabric-shadow, fabric-mid, fabric-warm, thread-highlight. 4 stops. */
  colors?: [string, string, string, string];
  /** Tint carried by the threads. */
  accent?: string;
  /** 0..1 — how much accent the threads take. */
  accentAmount?: number;
  /** Thread density across the frame height. */
  scale?: number;
  /** Domain-warp amount — how hand-woven the threads bend (fractions of frame). */
  warp?: number;
  /** Global time multiplier (drives only the sheen, never the grid position). */
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
uniform float u_warp;
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

// A thin ridge line at every integer of x — the profile of one thread.
float thread(float x, float sharp) {
  float f = fract(x);
  float d = min(f, 1.0 - f);
  return smoothstep(sharp, 0.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  // Domain warp — bend the weave so it reads hand-made, not a CSS grid. The
  // warp field drifts very slowly; the grid lattice itself stays put.
  vec2 q = uv + u_warp * vec2(
    fbm(uv * 3.0 + vec2(u_time * 0.03, 0.0)) - 0.5,
    fbm(uv * 3.0 + vec2(7.3, -u_time * 0.02)) - 0.5
  );

  float qx = q.x * u_scale * aspect;
  float qy = q.y * u_scale;

  float tw = thread(qx, 0.09); // warp (vertical threads)
  float tf = thread(qy, 0.09); // weft (horizontal threads)

  // Interlace: per cell, one direction sits over the other.
  float over = mod(floor(qx) + floor(qy), 2.0);
  float warpB = tw * (over < 0.5 ? 1.0 : 0.5);
  float weftB = tf * (over < 0.5 ? 0.5 : 1.0);
  float weave = max(warpB, weftB);

  // Sheen — light travelling across a still cloth (this is the only motion).
  float sheen = fbm(q * 1.7 + vec2(u_time * 0.05, u_time * 0.028));
  weave *= 0.3 + 0.95 * sheen;

  // Fabric ground: near-black, faintly breathing between the shadow stops.
  vec3 base = mix(u_c0, u_c1, smoothstep(0.15, 0.8, sheen));
  base = mix(base, u_c2, smoothstep(0.62, 1.0, sheen) * 0.5);

  // Threads sit a touch above the ground.
  vec3 col = mix(base, u_c3, clamp(weave, 0.0, 1.0) * 0.55);

  // The accent runs through the threads — a violet thread across the cloth.
  float amt = clamp(u_accentAmt, 0.0, 1.0);
  col = mix(col, u_accent, amt * (0.08 + 0.34 * weave));
  col += u_accent * amt * 0.015;

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

export function ShaderWeave({
  colors = ["#050506", "#0a0a0c", "#111015", "#1b1a22"],
  accent = "#6733FF",
  accentAmount = 0,
  scale = 22,
  warp = 0.03,
  speed = 1,
  className,
}: ShaderWeaveProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GlState | null>(null);
  const [handle] = useState(() => delayRender("shader-weave"));
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
      "u_warp",
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
    gl.uniform1f(uniforms.u_scale, scale);
    gl.uniform1f(uniforms.u_warp, warp);
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
  }, [frame, fps, speed, scale, warp, colors, accent, accentAmount, handle]);

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
