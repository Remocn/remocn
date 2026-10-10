"use client";

import { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";

export type ShaderTextRevealProps = {
  /** Words appear one at a time. Separate phrases with newlines to keep them together. */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  /** Frames per word, including its entrance and exit. The final word stays visible. */
  wordDuration?: number;
  /** Strength of the original hero shader inside the letters, from 0 to 1. */
  intensity?: number;
};

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export function getShaderTextState(
  frame: number,
  wordCount: number,
  wordDuration: number,
) {
  const duration = Math.max(12, Math.round(wordDuration));
  const count = Math.max(1, wordCount);
  const f = Math.max(0, frame);
  const index = Math.min(count - 1, Math.floor(f / duration));
  const local = f - index * duration;
  const enter = clamp((local / duration + 0.16) / 0.76);
  const exit =
    index === count - 1 ? 0 : clamp((local / duration - 0.65) / 0.35);
  return {
    index,
    enter,
    exit: exit * exit * (3 - 2 * exit),
    scale: 1 + 0.12 * (1 - enter) ** 3,
  };
}

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/* @remocn · OpenShaders — https://openshaders.com/@remocn
 * Original hero field and halftone GLSL. Only its clock is driven by Remotion.
 */
const HERO_FIELD = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
out vec4 fragColor;

const float HUE = 0.663466752;
const float HUE_SPREAD = 0.314346701;
const float HUE_TRAVEL = 1.65112376;
const float CHROMA = 0.160295546;
const float LIGHTNESS = 0.537409723;
const float COLOUR_CYCLE = 0.124862425;
const float THETA = 2.12986207;
const float SHEAR = 0.968176901;
const float SHRINK = 0.955401778;
const float LAYERS = 72.0;
const float WARP_FREQ_X = 0.439311415;
const float WARP_FREQ_Y = 2.87923527;
const float WARP_AMP_X = 0.156202048;
const float WARP_AMP_Y = 0.0256033838;
const float ASPECT_X = 2.23183894;
const float ASPECT_Y = 0.15731883;
const float OFFSET_X = 0.375628948;
const float OFFSET_Y = -0.017801486;
const float TILT = 1.63293767;
const float ZOOM = 0.93135649;
const float CENTRE_X = -0.0956316143;
const float CENTRE_Y = -0.520057321;
const float GLOW_SIZE = 0.00201825937;
const float FALLOFF = 0.352821857;
const float VIGNETTE = 0.136085436;
const float FLOW_SPEED = 0.391012281;
const float FLOW_DIRECTION = 1.0;
const float BREATH_RATE = 0.382053256;
const float BREATH_AMOUNT = 0.0873704553;
const float PHASE = 56.3862724;
const float ECHO = 0.0;
const float ECHO_SHIFT = 0.178754866;
const float SOFTNESS = 0.00164903817;
const float LIGHT_SWING = 0.149726808;

const float TAU = 6.28318530718;

vec3 oklchToLinear(float L, float C, float h) {
  float a = C * cos(h), b = C * sin(h);
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  vec3 lms = vec3(l_, m_, s_);
  lms = lms * lms * lms;
  return mat3(4.0767416621, -1.2684380046, -0.0041960863,
              -3.3077115913, 2.6097574011, -0.7034186147,
              0.2309699292, -0.3413193965, 1.7076147010) * lms;
}

float blueNoise(vec2 p, float frame) {
  p += 5.588238 * mod(frame, 64.0);
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

void main() {
  vec2 R = iResolution.xy;
  vec2 pos = (gl_FragCoord.xy - 0.5 * R) / R.y;
  float t = iTime * FLOW_SPEED * FLOW_DIRECTION + PHASE;
  float breath = (-sin(iTime * BREATH_RATE * 1.5) + sin(iTime * BREATH_RATE + 1.0)) * 0.25 + 0.5;

  vec2 u = (pos - vec2(CENTRE_X, CENTRE_Y)) * (ZOOM - breath * BREATH_AMOUNT);
  float ct = cos(TILT), st = sin(TILT);
  u = mat2(ct, st, -st, ct) * u;

  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));

  float hue0 = HUE * TAU;
  float hue1 = hue0 + HUE_SPREAD * TAU;
  vec3 color = vec3(0.0);

  for (float i = 1.0; i <= 96.0; i += 1.0) {
    if (i > LAYERS) break;
    u.x += -sin(u.y * WARP_FREQ_X + t + i * 0.007) * WARP_AMP_X;
    u.y += -sin(u.x * WARP_FREQ_Y - t + i * 0.02) * WARP_AMP_Y;
    u = fold * u * SHRINK;

    vec2 q = u - vec2(OFFSET_X + breath * 0.1, OFFSET_Y);
    vec2 s = vec2(q.x * ASPECT_X, q.y * ASPECT_Y);
    float glow = GLOW_SIZE / (dot(s, s) + SOFTNESS);
#ifndef SKIP_ECHO
    vec2 e = vec2((q.x - ECHO_SHIFT) * ASPECT_X, s.y);
    glow += ECHO * GLOW_SIZE / (dot(e, e) + SOFTNESS);
#endif
    glow *= 0.25 + breath * 0.4;

    float r = length(u);
    float k = sin(i * COLOUR_CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;
    vec3 tint = clamp(oklchToLinear(LIGHTNESS + LIGHT_SWING * k, CHROMA * (0.75 + 0.35 * k), mix(hue0, hue1, k)), 0.0, 1.0);
    color += glow * tint * exp2(-r * FALLOFF);
  }

  vec3 x = max(color, 0.0);
  color = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  color = pow(clamp(color, 0.0, 1.0), vec3(0.85, 0.92, 0.98));

  float edge = smoothstep(0.5, 1.6, length(pos));
  color *= 1.0 - edge * VIGNETTE;

  vec3 dark = uDarkBackground + color * (1.0 - uDarkBackground);
  float strength = max(color.r, max(color.g, color.b));
  vec3 light = uLightBackground * (1.0 - strength) + color * 0.96;
  color = mix(dark, light, uLightMode);

  color += (blueNoise(gl_FragCoord.xy, floor(iTime * 24.0)) - 0.5) / 255.0;
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const HERO_HALFTONE = `#version 300 es
precision highp float;

uniform sampler2D tScene;
uniform vec2 iResolution;
uniform float iTime;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
uniform float uPixelRatio;
out vec4 fragColor;

const float uStrength = 0.797335207;
const float uScale = 0.985214949;
const float uSeed = 0.435611069;

const float TAU = 6.28318530718;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 toInk(vec3 c) { return mix(c - uDarkBackground, uLightBackground - c, uLightMode); }
vec3 fromInk(vec3 ink) { return mix(uDarkBackground + ink, uLightBackground - ink, uLightMode); }
vec3 sceneInk(vec2 uv) { return toInk(texture(tScene, clamp(uv, 0.0, 1.0)).rgb); }

float blueNoise(vec2 p, float frame) {
  p += 5.588238 * mod(frame, 64.0);
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

vec3 halftone(vec2 frag) {
  float cell = max(3.0, uScale * 3.6 * uPixelRatio);
  float angle = 0.26 + uSeed * 0.3;
  mat2 turn = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 rotated = turn * frag;
  vec2 grid = floor(rotated / cell);
  vec2 centre = (grid + 0.5) * cell;
  vec2 source = transpose(turn) * centre;
  vec3 soft = sceneInk(frag / iResolution);
  vec3 ink = sceneInk(source / iResolution);
  float level = clamp(dot(ink, LUMA), 0.0, 1.0);
  float radius = cell * sqrt(pow(level, 0.9) / 3.14159265);
  float dist = length(rotated - centre);
  float aa = 0.7 * uPixelRatio;
  float dot_ = 1.0 - smoothstep(radius - aa, radius + aa, dist);
  vec3 dots = ink * min(0.8 / max(level, 1e-3), 2.2) * dot_;
  float presence = smoothstep(0.03, 0.16, level) * (0.3 + 0.14 * uStrength);
  return mix(soft, dots, presence);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 ink = halftone(frag);
  vec3 color = fromInk(clamp(ink, 0.0, 1.0));
  color += (blueNoise(frag, floor(iTime * 24.0)) - 0.5) / 255.0;
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uText;
uniform sampler2D uHero;
uniform vec2 uResolution;
uniform vec4 uBounds;
uniform float uEnter;
uniform float uExit;
uniform float uScale;
uniform float uTime;
uniform float uIntensity;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution - 0.5) / uScale + 0.5;
  vec2 q = (uv - uBounds.xy) / uBounds.zw;
  float flow = sin(q.x * 7.0 + q.y * 5.0 - uTime * 3.2) * 0.065
    + sin(q.x * 13.0 - q.y * 8.0 + uTime * 2.1) * 0.025;
  float rank = q.x * 0.64 + (1.0 - q.y) * 0.36 + flow;
  float d = rank - mix(-0.15, 1.65, uEnter);
  float edge = exp(-pow((d + 0.1) * 6.0, 2.0));
  // Refraction affects the glyph itself, concentrated inside the wet leading edge.
  vec3 field = texture(uHero, uv).rgb;
  vec2 warp = vec2(field.r - field.b, field.g - field.r);
  vec2 sampleUV = uv + warp * edge * uIntensity * 2.5 / uResolution;
  float glyph = texture(uText, sampleUV).a;
  float appear = 1.0 - smoothstep(-0.025, 0.09, d);
  float exitRank = q.x * 0.65 + (1.0 - q.y) * 0.5 + flow;
  float leave = smoothstep(-0.12, 0.06, exitRank - mix(-0.25, 1.45, uExit));

  vec3 liquid = texture(uHero, sampleUV).rgb;
  vec3 silver = vec3(0.96, 0.925, 1.0);
  float settled = 1.0 - smoothstep(-0.58, -0.16, d);
  vec3 color = mix(liquid, silver, settled);
  color = mix(silver, color, uIntensity);
  float alpha = glyph * appear * leave;
  fragColor = vec4(color * alpha, alpha);
}`;

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
  });
  if (!gl) throw new Error("Shader Text Reveal requires WebGL2.");
  const shaders: WebGLShader[] = [];
  const programs: WebGLProgram[] = [];
  const textures: WebGLTexture[] = [];
  const buffers: WebGLFramebuffer[] = [];
  const dispose = () => {
    for (const shader of shaders) gl.deleteShader(shader);
    for (const program of programs) gl.deleteProgram(program);
    for (const texture of textures) gl.deleteTexture(texture);
    for (const buffer of buffers) gl.deleteFramebuffer(buffer);
  };
  const compile = (fragment: string) => {
    const program = gl.createProgram();
    if (!program) throw new Error("Shader Text Reveal: GPU allocation failed.");
    programs.push(program);
    for (const [type, source] of [
      [gl.VERTEX_SHADER, VERTEX],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader)
        throw new Error("Shader Text Reveal: shader allocation failed.");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(
          gl.getShaderInfoLog(shader) ?? "Shader compilation failed.",
        );
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? "Shader link failed.");
    const locations = new Map<string, WebGLUniformLocation | null>();
    const uniform = (name: string) => {
      if (!locations.has(name))
        locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name) ?? null;
    };
    return {
      uniform,
      begin: (time: number) => {
        gl.useProgram(program);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniform("iResolution"), canvas.width, canvas.height);
        gl.uniform1f(uniform("iTime"), time);
        gl.uniform1f(uniform("uLightMode"), 0);
        gl.uniform3f(uniform("uDarkBackground"), 9 / 255, 9 / 255, 9 / 255);
        gl.uniform3f(uniform("uLightBackground"), 1, 1, 1);
        gl.uniform1f(uniform("uPixelRatio"), 1);
      },
    };
  };
  const texture = () => {
    const value = gl.createTexture();
    if (!value)
      throw new Error("Shader Text Reveal: texture allocation failed.");
    textures.push(value);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, value);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return value;
  };
  const target = () => {
    const value = texture();
    const buffer = gl.createFramebuffer();
    if (!buffer)
      throw new Error("Shader Text Reveal: framebuffer allocation failed.");
    buffers.push(buffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      canvas.width,
      canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      value,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error("Shader Text Reveal: incomplete framebuffer.");
    return { value, buffer };
  };
  const bind = (value: WebGLTexture, unit: number) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, value);
  };
  try {
    const field = compile(HERO_FIELD);
    const halftone = compile(HERO_HALFTONE);
    const composite = compile(FRAGMENT);
    const text = texture();
    const raw = target();
    const hero = target();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    let previous: HTMLCanvasElement | null = null;
    return {
      dispose,
      draw: (
        word: TextTexture,
        state: ReturnType<typeof getShaderTextState>,
        time: number,
        intensity: number,
      ) => {
        if (gl.isContextLost())
          throw new Error("Shader Text Reveal: WebGL context lost.");
        // Render the hero's original field, then its original halftone pass.
        gl.bindFramebuffer(gl.FRAMEBUFFER, raw.buffer);
        field.begin(time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, hero.buffer);
        halftone.begin(time);
        bind(raw.value, 0);
        gl.uniform1i(halftone.uniform("tScene"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        composite.begin(time);
        bind(text, 0);
        if (previous !== word.canvas) {
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            word.canvas,
          );
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          previous = word.canvas;
        }
        bind(hero.value, 1);
        gl.uniform1i(composite.uniform("uText"), 0);
        gl.uniform1i(composite.uniform("uHero"), 1);
        gl.uniform2f(
          composite.uniform("uResolution"),
          canvas.width,
          canvas.height,
        );
        gl.uniform4f(composite.uniform("uBounds"), ...word.bounds);
        gl.uniform1f(composite.uniform("uEnter"), state.enter);
        gl.uniform1f(composite.uniform("uExit"), state.exit);
        gl.uniform1f(composite.uniform("uScale"), state.scale);
        gl.uniform1f(composite.uniform("uTime"), time);
        gl.uniform1f(composite.uniform("uIntensity"), clamp(intensity));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

type TextTexture = {
  canvas: HTMLCanvasElement;
  bounds: [number, number, number, number];
};

function textTexture(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
): TextTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Shader Text Reveal: cannot rasterize text.");
  let size = Math.min(Math.max(1, fontSize), height * 0.58);
  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  size *= Math.min(
    1,
    (width * 0.72) / Math.max(1, ctx.measureText(text).width),
  );
  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const left = (width - metrics.width) / 2;
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;
  const baseline = (height + ascent - descent) / 2;
  ctx.fillStyle = "white";
  ctx.fillText(text, left, baseline);
  return {
    canvas,
    bounds: [
      left / width,
      (height - baseline - descent) / height,
      Math.max(1, metrics.width) / width,
      Math.max(1, ascent + descent) / height,
    ],
  };
}

export function ShaderTextReveal({
  text = "Your product",
  fontSize = 400,
  fontFamily = "Arial, sans-serif",
  fontWeight = 500,
  wordDuration = 30,
  intensity = 1,
}: ShaderTextRevealProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvas = useRef<HTMLCanvasElement>(null);
  const resources = useRef<{
    renderer: ReturnType<typeof createRenderer>;
    words: TextTexture[];
  } | null>(null);
  const current = useRef({ frame, fps, wordDuration, intensity });
  current.current = { frame, fps, wordDuration, intensity };

  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const handle = delayRender("Load Shader Text Reveal font");
    const phrases = text.includes("\n") ? text.split("\n") : text.split(/\s+/);
    const words = phrases.map((word) => word.trim()).filter(Boolean);
    const draw = () => {
      const resource = resources.current;
      if (!resource || resource.words.length === 0) return;
      const clock = current.current;
      const state = getShaderTextState(
        clock.frame,
        resource.words.length,
        clock.wordDuration,
      );
      resource.renderer.draw(
        resource.words[state.index],
        state,
        clock.frame / clock.fps,
        clock.intensity,
      );
    };
    void document.fonts
      .load(`${fontWeight} ${fontSize}px ${fontFamily}`, text || " ")
      .then(() => {
        if (cancelled) return;
        const textures = words.map((word) =>
          textTexture(word, width, height, fontSize, fontWeight, fontFamily),
        );
        const renderer = createRenderer(element);
        resources.current = { renderer, words: textures };
        draw();
        continueRender(handle);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          cancelRender(
            error instanceof Error ? error : new Error(String(error)),
          );
      });
    return () => {
      cancelled = true;
      continueRender(handle);
      resources.current?.renderer.dispose();
      resources.current = null;
    };
  }, [
    text,
    width,
    height,
    fontSize,
    fontWeight,
    fontFamily,
    delayRender,
    continueRender,
    cancelRender,
  ]);

  useLayoutEffect(() => {
    const resource = resources.current;
    if (!resource || resource.words.length === 0) return;
    try {
      const state = getShaderTextState(
        frame,
        resource.words.length,
        wordDuration,
      );
      resource.renderer.draw(
        resource.words[state.index],
        state,
        frame / fps,
        intensity,
      );
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [frame, fps, wordDuration, intensity, cancelRender]);

  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      role="img"
      aria-label={text}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
