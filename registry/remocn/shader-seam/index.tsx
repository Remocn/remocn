"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useDelayRender, useVideoConfig } from "remotion";

/* @remocn · OpenShaders — https://openshaders.com/@remocn
 * Original field and halftone GLSL from the site's React · WebGL export.
 * The frame-driven renderer, dissolve compositing and scene exchange are remocn's.
 */

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`;

const FIELD_SHADER = `#version 300 es
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

const RARITY_SHADER = `#version 300 es
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

export type OpenShaderSource = {
  /** OpenShaders' exported FIELD_SHADER, including #version 300 es. */
  field: string;
  /** Optional RARITY_SHADER using tScene. Extra texture inputs need an adapter. */
  postprocess?: string;
};

export const remocnOpenShader: OpenShaderSource = {
  field: FIELD_SHADER,
  postprocess: RARITY_SHADER,
};

export type ShaderSeamProps = {
  /** Softness of the material's dissolve edge, clamped to 0.02–0.4. */
  softness?: number;
  /** Organic variation mixed into the material's brightness, from 0 to 1. */
  detail?: number;
  /** Internal field animation speed. The default 0 keeps the material still. */
  speed?: number;
  /** Starting time in seconds in the selected shader. */
  timeOffset?: number;
  shader?: OpenShaderSource;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Exchange the scenes only while the shader is opaque across the entire frame.
export function getShaderSeamPhase(progress: number) {
  const p = clamp(progress, 0, 1);
  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return {
    presence: smoother(clamp(p / 0.34, 0, 1)),
    dissolve: smoother(clamp((p - 0.46) / 0.54, 0, 1)),
    showNext: p >= 0.4,
  };
}

type SeamPhase = ReturnType<typeof getShaderSeamPhase>;

const DISSOLVE_COMPOSITE = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform sampler2D tScene;
uniform sampler2D tField;
uniform float uPresence;
uniform float uDissolve;
uniform float uSoftness;
uniform float uDetail;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  vec2 p = gl_FragCoord.xy / iResolution.y;
  vec3 field = texture(tField, uv).rgb;
  float energy = max(field.r, max(field.g, field.b));
  // Static, continuous noise breaks up the field without making it travel.
  float grain = noise(p * 7.0) * 0.6 + noise(p * 19.0) * 0.28
    + noise(p * 43.0) * 0.12;
  float density = mix(smoothstep(0.025, 0.95, energy), grain, uDetail * 0.55);
  float appear = mix(1.0 + uSoftness, -uSoftness, uPresence);
  float disappear = mix(-uSoftness, 1.0 + uSoftness, uDissolve);
  float alpha = smoothstep(appear - uSoftness, appear + uSoftness, density)
    * smoothstep(disappear - uSoftness, disappear + uSoftness, density);
  vec3 material = texture(tScene, uv).rgb;
  fragColor = vec4(material * alpha, alpha);
}
`;

function createSeamRenderer(
  canvas: HTMLCanvasElement,
  source: OpenShaderSource,
) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) throw new Error("Shader Seam requires WebGL2.");
  const programs: WebGLProgram[] = [];
  const textures: WebGLTexture[] = [];
  const buffers: WebGLFramebuffer[] = [];
  const shaders: WebGLShader[] = [];
  const dispose = () => {
    for (const program of programs) gl.deleteProgram(program);
    for (const texture of textures) gl.deleteTexture(texture);
    for (const buffer of buffers) gl.deleteFramebuffer(buffer);
    for (const shader of shaders) gl.deleteShader(shader);
  };
  const program = (fragment: string, sceneInput = false, flowInput = false) => {
    const result = gl.createProgram();
    if (!result) throw new Error("Shader Seam: could not create a program.");
    programs.push(result);
    for (const [type, code] of [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader Seam: could not allocate a shader.");
      shaders.push(shader);
      gl.shaderSource(shader, code);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`Shader Seam: ${gl.getShaderInfoLog(shader)}`);
      }
      gl.attachShader(result, shader);
    }
    gl.linkProgram(result);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
      throw new Error(`Shader Seam: ${gl.getProgramInfoLog(result)}`);
    }
    const locations = new Map<string, WebGLUniformLocation | null>();
    const uniform = (name: string) => {
      if (!locations.has(name))
        locations.set(name, gl.getUniformLocation(result, name));
      return locations.get(name) ?? null;
    };
    // Fail explicitly for exports requiring assets this adapter cannot supply.
    for (
      let i = 0;
      i < gl.getProgramParameter(result, gl.ACTIVE_UNIFORMS);
      i++
    ) {
      const info = gl.getActiveUniform(result, i);
      if (
        info &&
        (info.type === gl.SAMPLER_2D || info.type === gl.SAMPLER_CUBE) &&
        !(sceneInput && info.name === "tScene") &&
        !(flowInput && info.name === "tField")
      ) {
        throw new Error(
          `Shader Seam: ${info.name} needs an additional texture adapter.`,
        );
      }
    }
    return {
      begin: (
        w: number,
        h: number,
        time: number,
        phase: SeamPhase,
        softness: number,
        detail: number,
      ) => {
        gl.useProgram(result);
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uniform("iResolution"), w, h);
        gl.uniform1f(uniform("iTime"), time);
        gl.uniform1f(uniform("uLightMode"), 0);
        gl.uniform3f(uniform("uDarkBackground"), 9 / 255, 9 / 255, 9 / 255);
        gl.uniform3f(uniform("uLightBackground"), 1, 1, 1);
        gl.uniform1f(uniform("uPixelRatio"), 1);
        gl.uniform2f(uniform("uTilt"), 0, 0);
        gl.uniform1i(uniform("tScene"), 0);
        gl.uniform1i(uniform("tField"), 1);
        gl.uniform1f(uniform("uPresence"), phase.presence);
        gl.uniform1f(uniform("uDissolve"), phase.dissolve);
        gl.uniform1f(uniform("uSoftness"), softness);
        gl.uniform1f(uniform("uDetail"), detail);
      },
    };
  };
  const target = () => {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (texture) textures.push(texture);
    if (framebuffer) buffers.push(framebuffer);
    if (!texture || !framebuffer)
      throw new Error("Shader Seam: could not create render target.");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let size = "";
    return {
      texture,
      bind: (width: number, height: number) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        if (size !== `${width}:${height}`) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
          );
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0,
          );
          if (
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
            gl.FRAMEBUFFER_COMPLETE
          ) {
            throw new Error("Shader Seam: incomplete render target.");
          }
          size = `${width}:${height}`;
        }
      },
    };
  };
  try {
    const field = program(source.field);
    const post = source.postprocess ? program(source.postprocess, true) : null;
    const composite = program(DISSOLVE_COMPOSITE, true, true);
    const full = target();
    const material = target();
    const bindTexture = (texture: WebGLTexture, unit: number) => {
      gl.activeTexture(unit === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    };
    return {
      dispose,
      draw: (
        width: number,
        height: number,
        time: number,
        phase: SeamPhase,
        softness: number,
        detail: number,
      ) => {
        if (gl.isContextLost())
          throw new Error("Shader Seam: WebGL context was lost.");
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        full.bind(width, height);
        field.begin(width, height, time, phase, softness, detail);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (post) {
          material.bind(width, height);
          post.begin(width, height, time, phase, softness, detail);
          bindTexture(full.texture, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        composite.begin(width, height, time, phase, softness, detail);
        bindTexture(post ? material.texture : full.texture, 0);
        bindTexture(full.texture, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

function ShaderSeamPresentation({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}: TransitionPresentationComponentProps<ShaderSeamProps>) {
  const { width, height, fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createSeamRenderer> | null>(null);
  const entering = presentationDirection === "entering";
  const {
    softness = 0.18,
    detail = 0.65,
    speed = 0,
    timeOffset = 0,
    shader = remocnOpenShader,
  } = passedProps;
  const { field, postprocess } = shader;
  const p = clamp(presentationProgress, 0, 1);
  const active = entering && p > 0 && p < 1;
  const phase = getShaderSeamPhase(p);

  useLayoutEffect(() => {
    if (!active || !canvas.current) return;
    const handle = delayRender("Initialize Shader Seam");
    try {
      renderer.current = createSeamRenderer(canvas.current, {
        field,
        postprocess,
      });
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
    return () => {
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [active, field, postprocess, delayRender, continueRender, cancelRender]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redraw a newly compiled source even when the playhead is paused.
  useLayoutEffect(() => {
    if (!active || !canvas.current) return;
    try {
      const time =
        timeOffset + ((p * presentationDurationInFrames) / fps) * speed;
      renderer.current?.draw(
        width,
        height,
        time,
        getShaderSeamPhase(p),
        clamp(softness, 0.02, 0.4),
        clamp(detail, 0, 1),
      );
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    p,
    active,
    width,
    height,
    fps,
    softness,
    detail,
    speed,
    timeOffset,
    presentationDurationInFrames,
    entering,
    field,
    postprocess,
    cancelRender,
  ]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          visibility: entering !== phase.showNext ? "hidden" : "visible",
        }}
      >
        {children}
      </AbsoluteFill>
      <canvas
        ref={canvas}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          visibility: entering && active ? "visible" : "hidden",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

export function shaderSeam(
  props: ShaderSeamProps = {},
): TransitionPresentation<ShaderSeamProps> {
  return { component: ShaderSeamPresentation, props };
}
