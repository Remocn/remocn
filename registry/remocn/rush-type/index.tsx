"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface RushTypeProps {
  /** A short phrase. One whitespace-delimited word is shown per cycle. */
  phrase?: string;
  /** Cap height of the resting word in composition pixels. */
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  /** Authored vertical scale at the blast before perspective is applied. */
  verticalStretch?: number;
  /** 0 removes channel separation, 1 is the reference look, 2 exaggerates it. */
  chromaticSpread?: number;
  /** Readable resting phase, in frames. */
  restDuration?: number;
  /** Total near-point hang around the word swap, in frames. */
  peakHoldDuration?: number;
  /** Global playback multiplier. */
  speed?: number;
  className?: string;
}

export type RushTypePhase = "hang" | "arrive" | "rest" | "depart";

export interface RushTypeFrameState {
  phase: RushTypePhase;
  wordIndex: number;
  beforeWordIndex: number;
  afterWordIndex: number;
  cycle: number;
  motion: number;
  isResting: boolean;
  swapAmount: number;
  shutterRatios: [number, number, number];
  thinAmount: number;
  bloomAmount: number;
  crtAmount: number;
  groundAmount: number;
}

export const rushTypeDefaultPhrase = "gone before you look";

const ARRIVE_FRAMES = 7;
const LEAVE_FRAMES = 4;
const DEFAULT_REST_FRAMES = 12;
const DEFAULT_HOLD_FRAMES = 3;
const SHUTTER_SECONDS = 0.04;
const SMEAR_GAIN = 1.6;
const SAMPLES = 28;
const SHUTTER_SHAPE = 0.85;
const ROLL_U = 0.38;
const LAG_U = 0.55;
const THIN = 0.55;
const BLOOM_GAIN = 0.5;
const BLOOM_SPREAD = 3.2;
const BLOOM_BIAS = 3.5;
const SPEED_GAIN = 0.95;
const EXPOSURE = 1.75;
const HORIZONTAL_STRETCH = 1.57;
const FOCAL = 1;
const ORBIT_DEPTH = 0.42;
const ORBIT_RISE = 0.16;
const ORBIT_YAW = 0.55;
const ORBIT_YAW_LAG = 0.6;
const ORBIT_PITCH = 0.26;
const ORBIT_PITCH_LAG = -0.9;
const ORBIT_HANG_ARC = 0.9;
const PIVOT_FRAC = 0.07;
const CRT_GAIN = 1;
const CRT_PITCH = 5;
const CRT_MASK = 0.16;
const CRT_SCAN_PITCH = 3;
const CRT_SCAN = 0.12;
const CRT_BEAM = 0.7;
const CRT_HUM = 0.035;
const CRT_HUM_SPEED = 0.14;
const GROUND_SPEED = 0.028;
const GLOW_SPREAD = 2.6;
const GLOW_MIN = 0.34;
const GLOW_MAX_Y = 1.2;
const SWAP_SPREAD = 0.35;
const SWAP_FLASH = 0.5;

const FALL = [1, 0.557, 0.121, 0.049, 0.014, 0];
const RISE = [0, 0.08, 0.8, 1];
const ORBIT_IN = [0, 0.5, 0.82, 0.95, 1, 1];
const ORBIT_OUT = [0, 0.05, 0.14, 0.38, 1];
const DRIFT_DIRECTION = [-1, 0.7, -0.45, 1];
const SWING_ARC = Math.PI - ORBIT_HANG_ARC;

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function sampleTable(table: readonly number[], progress: number): number {
  const last = table.length - 1;
  const x = Math.min(Math.max(progress, 0), 1) * last;
  const index = Math.min(Math.floor(x), last - 1);
  return table[index] + (table[index + 1] - table[index]) * (x - index);
}

export function normalizeRushTypePhrase(phrase: string): string[] {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 ? words : rushTypeDefaultPhrase.split(" ");
}

export function getRushTypeCycleLength(
  restDuration = DEFAULT_REST_FRAMES,
  peakHoldDuration = DEFAULT_HOLD_FRAMES,
): number {
  return (
    ARRIVE_FRAMES +
    LEAVE_FRAMES +
    Math.max(restDuration, 1) +
    Math.max(peakHoldDuration, 0)
  );
}

export function getRushTypeDuration({
  phrase = rushTypeDefaultPhrase,
  restDuration = DEFAULT_REST_FRAMES,
  peakHoldDuration = DEFAULT_HOLD_FRAMES,
}: Pick<
  RushTypeProps,
  "phrase" | "restDuration" | "peakHoldDuration"
> = {}): number {
  return Math.round(
    normalizeRushTypePhrase(phrase).length *
      getRushTypeCycleLength(restDuration, peakHoldDuration),
  );
}

export const rushTypeLength = getRushTypeDuration();

export function getRushTypeShutterRatios(
  chromaticSpread = 1,
): [number, number, number] {
  const spread = Math.max(chromaticSpread, 0);
  return [0.62 ** spread, 1, 0.34 ** spread];
}

interface TimelinePose {
  phase: RushTypePhase;
  p: number;
  psi: number;
  cycle: number;
  wordIndex: number;
}

interface TimelineOptions {
  wordCount: number;
  restDuration: number;
  peakHoldDuration: number;
}

function getTimelinePose(
  frame: number,
  { wordCount, restDuration, peakHoldDuration }: TimelineOptions,
): TimelinePose {
  const safeWordCount = Math.max(Math.floor(wordCount), 1);
  const safeRest = Math.max(restDuration, 1);
  const safeHold = Math.max(peakHoldDuration, 0);
  const halfHold = safeHold / 2;
  const cycleLength = getRushTypeCycleLength(safeRest, safeHold);
  const arriveEnd = halfHold + ARRIVE_FRAMES;
  const restEnd = arriveEnd + safeRest;
  const leaveEnd = restEnd + LEAVE_FRAMES;
  const startOffset = arriveEnd + safeRest / 2;
  const shifted = frame + startOffset;
  const cycle = Math.floor(shifted / cycleLength);
  const tau = positiveModulo(shifted, cycleLength);
  const wordIndex = positiveModulo(cycle, safeWordCount);

  if (tau < halfHold) {
    return {
      phase: "hang",
      p: 1,
      psi: ORBIT_HANG_ARC * (tau / Math.max(halfHold, 1e-6)),
      cycle,
      wordIndex,
    };
  }

  if (tau < arriveEnd) {
    const progress = (tau - halfHold) / ARRIVE_FRAMES;
    return {
      phase: "arrive",
      p: sampleTable(FALL, progress),
      psi: ORBIT_HANG_ARC + SWING_ARC * sampleTable(ORBIT_IN, progress),
      cycle,
      wordIndex,
    };
  }

  if (tau < restEnd) {
    return { phase: "rest", p: 0, psi: Math.PI, cycle, wordIndex };
  }

  if (tau < leaveEnd) {
    const progress = (tau - restEnd) / LEAVE_FRAMES;
    return {
      phase: "depart",
      p: sampleTable(RISE, progress),
      psi: Math.PI + SWING_ARC * sampleTable(ORBIT_OUT, progress),
      cycle,
      wordIndex,
    };
  }

  const progress = (tau - leaveEnd) / Math.max(halfHold, 1e-6);
  return {
    phase: "hang",
    p: 1,
    psi: 2 * Math.PI - ORBIT_HANG_ARC * (1 - progress),
    cycle,
    wordIndex,
  };
}

interface ComputedFrame {
  before: TimelinePose;
  here: TimelinePose;
  after: TimelinePose;
  swapU: number;
  swapAmount: number;
  shutterRatios: [number, number, number];
}

function computeFrame({
  frame,
  fps,
  wordCount,
  restDuration,
  peakHoldDuration,
  chromaticSpread,
}: {
  frame: number;
  fps: number;
  wordCount: number;
  restDuration: number;
  peakHoldDuration: number;
  chromaticSpread: number;
}): ComputedFrame {
  const shutterFrames = SHUTTER_SECONDS * Math.max(fps, 1);
  const halfShutter = shutterFrames / 2;
  const options = { wordCount, restDuration, peakHoldDuration };
  const before = getTimelinePose(frame - halfShutter, options);
  const here = getTimelinePose(frame, options);
  const after = getTimelinePose(frame + halfShutter, options);
  const cycleLength = getRushTypeCycleLength(restDuration, peakHoldDuration);
  const halfHold = Math.max(peakHoldDuration, 0) / 2;
  const arriveEnd = halfHold + ARRIVE_FRAMES;
  const startOffset = arriveEnd + Math.max(restDuration, 1) / 2;
  const shifted = frame + startOffset;
  const nearestBoundary = Math.round(shifted / cycleLength) * cycleLength;
  const boundaryDistance = shifted - nearestBoundary;
  const crossesSwap = wordCount > 1 && after.cycle > before.cycle;
  const swapU = crossesSwap
    ? (after.cycle * cycleLength - shifted) / shutterFrames
    : 2;
  const swapAmount =
    wordCount > 1
      ? Math.max(0, 1 - (2 * boundaryDistance) ** 2 / shutterFrames ** 2)
      : 0;

  return {
    before,
    here,
    after,
    swapU,
    swapAmount,
    shutterRatios: getRushTypeShutterRatios(chromaticSpread),
  };
}

export function getRushTypeFrameState({
  frame,
  fps = 30,
  phrase = rushTypeDefaultPhrase,
  restDuration = DEFAULT_REST_FRAMES,
  peakHoldDuration = DEFAULT_HOLD_FRAMES,
  chromaticSpread = 1,
  speed = 1,
}: {
  frame: number;
  fps?: number;
} & Pick<
  RushTypeProps,
  "phrase" | "restDuration" | "peakHoldDuration" | "chromaticSpread" | "speed"
>): RushTypeFrameState {
  const words = normalizeRushTypePhrase(phrase);
  const computed = computeFrame({
    frame: frame * Math.max(speed, 0),
    fps,
    wordCount: words.length,
    restDuration,
    peakHoldDuration,
    chromaticSpread,
  });
  const motion = computed.here.p;

  return {
    phase: computed.here.phase,
    wordIndex: computed.here.wordIndex,
    beforeWordIndex: computed.before.wordIndex,
    afterWordIndex: computed.after.wordIndex,
    cycle: computed.here.cycle,
    motion,
    isResting:
      computed.here.phase === "rest" &&
      computed.before.p === 0 &&
      computed.after.p === 0,
    swapAmount: computed.swapAmount,
    shutterRatios: computed.shutterRatios,
    thinAmount: THIN * motion,
    bloomAmount: BLOOM_GAIN * motion,
    crtAmount: CRT_GAIN * motion,
    groundAmount: GROUND_SPEED * motion,
  };
}

function orbitTurn(psi: number, amplitude: number, lag: number): number {
  const pin = Math.sin(lag);
  return (amplitude * (Math.sin(psi - lag) - pin)) / (1 + Math.abs(pin));
}

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uText;
uniform vec2 uRes;
uniform vec2 uHalfPx;
uniform float uAtlasRows;
uniform float uSx;
uniform vec3 uSyQ;
uniform float uCenterY;
uniform float uSwapU;
uniform float uHalfA;
uniform float uHalfB;
uniform vec3 uK;
uniform vec2 uSwapScl;
uniform float uShape;
uniform float uRoll;
uniform float uLag;
uniform float uThin;
uniform float uBloom;
uniform float uGain;
uniform float uExp;
uniform float uFocal;
uniform vec3 uPos;
uniform vec4 uRot;
uniform float uCrt;
uniform float uTime;
uniform vec4 uGlow;
uniform float uGlowAmp;

#define SAMPLES ${SAMPLES}
#define BLOOM_TAPS 4
#define BLOOM_SPREAD ${BLOOM_SPREAD.toFixed(3)}
#define BLOOM_BIAS ${BLOOM_BIAS.toFixed(3)}
#define TAU 6.2831853
#define CRT_PITCH ${CRT_PITCH.toFixed(3)}
#define CRT_MASK ${CRT_MASK.toFixed(4)}
#define CRT_SCAN_PITCH ${CRT_SCAN_PITCH.toFixed(3)}
#define CRT_SCAN ${CRT_SCAN.toFixed(4)}
#define CRT_BEAM ${CRT_BEAM.toFixed(4)}
#define CRT_HUM ${CRT_HUM.toFixed(4)}
#define CRT_HUM_SPEED ${CRT_HUM_SPEED.toFixed(4)}

vec2 atlasUv(float sy, float halfIdx, vec2 wordPoint, out float inside) {
  float sx = max(uSx, 1e-4);
  float sv = max(abs(sy), 1e-4);
  vec2 q = vec2(
    (wordPoint.x / sx + uHalfPx.x * 0.5) / uHalfPx.x,
    (wordPoint.y / sv + uHalfPx.y * 0.5) / uHalfPx.y
  );
  inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return vec2(
    clamp(q.x, 0.0, 1.0),
    (clamp(q.y, 0.0, 1.0) + halfIdx) / uAtlasRows
  );
}

float tap(float sy, float halfIdx, vec2 wordPoint, float front) {
  float inside;
  vec2 texturePoint = atlasUv(sy, halfIdx, wordPoint, inside);
  float value = texture2D(uText, texturePoint).r * inside * front;
  return value * mix(1.0, value, uThin);
}

float tapBlur(float sy, float halfIdx, vec2 wordPoint, float front) {
  float inside;
  vec2 texturePoint = atlasUv(sy, halfIdx, wordPoint, inside);
  return texture2D(uText, texturePoint, BLOOM_BIAS).r * inside * front;
}

void main() {
  vec2 pixel = vUv * uRes;
  vec2 center = vec2(uRes.x * 0.5, uRes.y * uCenterY);
  vec2 screenPoint = pixel - center;

  float sinYaw = uRot.x;
  float cosYaw = uRot.y;
  float sinPitch = uRot.z;
  float cosPitch = uRot.w;
  float a1 = -(screenPoint.x * sinYaw + uFocal * cosYaw);
  float b1 = sinPitch * (screenPoint.x * cosYaw - uFocal * sinYaw);
  float c1 = uFocal * uPos.x - screenPoint.x * uPos.z;
  float a2 = -screenPoint.y * sinYaw;
  float b2 = screenPoint.y * sinPitch * cosYaw - uFocal * cosPitch;
  float c2 = uFocal * uPos.y - screenPoint.y * uPos.z;
  float determinant = a1 * b2 - a2 * b1;
  float inverse = 1.0 / (abs(determinant) < 1e-4 ? 1e-4 : determinant);
  float a = (c1 * b2 - c2 * b1) * inverse;
  float b = (a1 * c2 - a2 * c1) * inverse;
  float cameraZ = uPos.z - a * sinYaw + b * sinPitch * cosYaw;
  vec2 wordPoint = vec2(a, b);
  float front = step(uFocal * 0.05, cameraZ);
  vec3 accumulated = vec3(0.0);

  if (abs(uSyQ.y) + abs(uSyQ.z) < 1e-5) {
    accumulated = vec3(tap(uSyQ.x, uHalfA, wordPoint, front));
  } else {
    float offset =
      uLag * (wordPoint.x / uRes.x) - uRoll * (screenPoint.y / uRes.y);
    float weightSum = 0.0;

    for (int i = 0; i < SAMPLES; i++) {
      float u = float(i) / float(SAMPLES - 1) - 0.5;
      float weight = 1.0 - uShape * abs(u) * 2.0;
      weightSum += weight;
      float shiftedU = u + offset;
      vec3 shutterU = shiftedU * uK;
      vec3 sy = uSyQ.x + uSyQ.y * shutterU + uSyQ.z * shutterU * shutterU;
      accumulated.r += weight * tap(
        sy.r * (shutterU.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.r < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
      accumulated.g += weight * tap(
        sy.g * (shutterU.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.g < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
      accumulated.b += weight * tap(
        sy.b * (shutterU.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.b < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
    }

    accumulated /= max(weightSum, 1e-4);

    vec3 halo = vec3(0.0);
    for (int j = 0; j < BLOOM_TAPS; j++) {
      float u =
        (float(j) / float(BLOOM_TAPS - 1) - 0.5) * BLOOM_SPREAD + offset;
      vec3 shutterU = u * uK;
      vec3 sy = uSyQ.x + uSyQ.y * shutterU + uSyQ.z * shutterU * shutterU;
      halo.r += tapBlur(
        sy.r * (shutterU.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.r < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
      halo.g += tapBlur(
        sy.g * (shutterU.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.g < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
      halo.b += tapBlur(
        sy.b * (shutterU.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        shutterU.b < uSwapU ? uHalfA : uHalfB,
        wordPoint,
        front
      );
    }
    accumulated += halo * (uBloom / float(BLOOM_TAPS));
    accumulated *= uGain;
  }

  accumulated =
    (1.0 - exp(-accumulated * uExp)) / (1.0 - exp(-uExp));

  vec2 glowDistance =
    (pixel - uGlow.xy) / max(uGlow.zw, vec2(1.0));
  float ground =
    uGlowAmp * (1.0 - smoothstep(0.0, 1.0, length(glowDistance)));
  accumulated += ground * (1.0 - accumulated);

  if (uCrt > 0.0) {
    float luminance = max(max(accumulated.r, accumulated.g), accumulated.b);
    vec3 maskWave = 0.5 + 0.5 * cos(
      TAU * (pixel.x / CRT_PITCH - vec3(0.0, 0.33333, 0.66667))
    );
    vec3 mask = mix(vec3(1.0), maskWave * 2.0, CRT_MASK * uCrt);
    float scanWave = 0.5 + 0.5 * cos(TAU * pixel.y / CRT_SCAN_PITCH);
    float scan =
      1.0 - CRT_SCAN * uCrt * (1.0 - CRT_BEAM * luminance) * (1.0 - scanWave);
    float bar = 0.5 + 0.5 * cos(
      TAU * (pixel.y / uRes.y - uTime * CRT_HUM_SPEED)
    );
    float hum = 1.0 + CRT_HUM * uCrt * (bar * 2.0 - 1.0);
    accumulated *= mask * scan * hum;
  }

  gl_FragColor = vec4(accumulated, 1.0);
}
`;

const UNIFORM_NAMES = [
  "uText",
  "uRes",
  "uHalfPx",
  "uAtlasRows",
  "uSx",
  "uSyQ",
  "uCenterY",
  "uSwapU",
  "uHalfA",
  "uHalfB",
  "uK",
  "uSwapScl",
  "uShape",
  "uRoll",
  "uLag",
  "uThin",
  "uBloom",
  "uGain",
  "uExp",
  "uFocal",
  "uPos",
  "uRot",
  "uCrt",
  "uTime",
  "uGlow",
  "uGlowAmp",
] as const;

interface GlState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  uniforms: Record<(typeof UNIFORM_NAMES)[number], WebGLUniformLocation | null>;
  atlasWidth: number;
  halfHeight: number;
  textureCapHeight: number;
  maxTextureSize: number;
  scratch: HTMLCanvasElement;
  atlasKey: string;
  atlasRows: number;
  wordHalfWidths: number[];
  wordHalfWidth: number;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("RushType could not create a WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(`RushType shader compilation failed: ${message}`);
  }
  return shader;
}

function createGlState(canvas: HTMLCanvasElement): GlState | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("RushType could not create a WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown link error";
    gl.deleteProgram(program);
    throw new Error(`RushType shader linking failed: ${message}`);
  }

  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!buffer || !texture) {
    throw new Error("RushType could not allocate WebGL resources");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );

  const atlasWidth = canvas.width >= 1800 ? 4096 : 2048;
  const halfHeight = atlasWidth / 4;
  const textureCapHeight = Math.round(halfHeight * 0.64);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const scratch = document.createElement("canvas");
  scratch.width = atlasWidth;
  scratch.height = halfHeight;
  const uniforms = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as GlState["uniforms"];
  gl.clearColor(0, 0, 0, 1);

  return {
    gl,
    program,
    buffer,
    texture,
    uniforms,
    atlasWidth,
    halfHeight,
    textureCapHeight,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    scratch,
    atlasKey: "",
    atlasRows: 2,
    wordHalfWidths: [],
    wordHalfWidth: 1,
  };
}

function resolveFontFamily(fontFamily: string): string {
  if (typeof document === "undefined") return fontFamily;
  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none";
  probe.style.fontFamily = fontFamily;
  probe.textContent = "Ag";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  probe.remove();
  return resolved || fontFamily;
}

function rasterWord(
  state: GlState,
  word: string,
  row: number,
  fontFamily: string,
  fontWeight: number,
): number {
  const context = state.scratch.getContext("2d");
  if (!context) return 1;
  context.fillStyle = "#000";
  context.fillRect(0, 0, state.atlasWidth, state.halfHeight);

  let rasterSize = state.textureCapHeight * 1.4;
  context.font = `${fontWeight} ${rasterSize}px ${fontFamily}`;
  const capHeight =
    context.measureText("H").actualBoundingBoxAscent || rasterSize * 0.72;
  rasterSize *= state.textureCapHeight / capHeight;
  context.font = `${fontWeight} ${rasterSize}px ${fontFamily}`;

  const maxWidth = state.atlasWidth * 0.92;
  const measured = context.measureText(word).width;
  if (measured > maxWidth) {
    rasterSize *= maxWidth / measured;
    context.font = `${fontWeight} ${rasterSize}px ${fontFamily}`;
  }

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillText(
    word,
    state.atlasWidth / 2,
    state.halfHeight / 2 + state.textureCapHeight / 2,
  );
  const halfWidth = context.measureText(word).width / 2;

  const { gl } = state;
  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    row * state.halfHeight,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    state.scratch,
  );
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return halfWidth;
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(value, 2)));
}

export function getRushTypePhraseAtlasRows({
  wordCount,
  rowHeight,
  maxTextureSize,
}: {
  wordCount: number;
  rowHeight: number;
  maxTextureSize: number;
}): number | null {
  const rows = nextPowerOfTwo(wordCount);
  return rowHeight * rows <= maxTextureSize ? rows : null;
}

function allocateAtlas(state: GlState, rows: number): void {
  const { gl } = state;
  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    state.atlasWidth,
    state.halfHeight * rows,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  state.atlasRows = rows;
}

function updateAtlas(
  state: GlState,
  words: string[],
  firstWordIndex: number,
  secondWordIndex: number,
  fontFamily: string,
  fontWeight: number,
): { firstRow: number; secondRow: number } {
  const phraseRows = getRushTypePhraseAtlasRows({
    wordCount: words.length,
    rowHeight: state.halfHeight,
    maxTextureSize: state.maxTextureSize,
  });

  if (phraseRows !== null) {
    const atlasKey = `phrase\u0000${fontFamily}\u0000${fontWeight}\u0000${words.join("\u0000")}`;
    if (state.atlasKey !== atlasKey) {
      allocateAtlas(state, phraseRows);
      state.wordHalfWidths = words.map((word, row) =>
        rasterWord(state, word, row, fontFamily, fontWeight),
      );
      state.gl.generateMipmap(state.gl.TEXTURE_2D);
      state.atlasKey = atlasKey;
    }
    state.wordHalfWidth = Math.max(
      state.wordHalfWidths[firstWordIndex] ?? 1,
      state.wordHalfWidths[secondWordIndex] ?? 1,
    );
    return { firstRow: firstWordIndex, secondRow: secondWordIndex };
  }

  const firstWord = words[firstWordIndex] ?? words[0];
  const secondWord = words[secondWordIndex] ?? words[0];
  const atlasKey = `pair\u0000${fontFamily}\u0000${fontWeight}\u0000${firstWord}\u0000${secondWord}`;
  if (state.atlasKey !== atlasKey) {
    allocateAtlas(state, 2);
    const firstWidth = rasterWord(state, firstWord, 0, fontFamily, fontWeight);
    const secondWidth = rasterWord(
      state,
      secondWord,
      1,
      fontFamily,
      fontWeight,
    );
    state.gl.generateMipmap(state.gl.TEXTURE_2D);
    state.wordHalfWidths = [firstWidth, secondWidth];
    state.atlasKey = atlasKey;
  }
  state.wordHalfWidth = Math.max(...state.wordHalfWidths, 1);
  return { firstRow: 0, secondRow: 1 };
}

function destroyGlState(state: GlState): void {
  const { gl } = state;
  gl.deleteProgram(state.program);
  gl.deleteBuffer(state.buffer);
  gl.deleteTexture(state.texture);
}

function drawRushType({
  state,
  computed,
  words,
  fontSize,
  fontFamily,
  fontWeight,
  verticalStretch,
  frame,
  fps,
}: {
  state: GlState;
  computed: ComputedFrame;
  words: string[];
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  verticalStretch: number;
  frame: number;
  fps: number;
}): void {
  const { gl, uniforms } = state;
  const { firstRow, secondRow } = updateAtlas(
    state,
    words,
    computed.before.wordIndex,
    computed.after.wordIndex,
    fontFamily,
    fontWeight,
  );

  const unit = Math.max(fontSize, 1) / state.textureCapHeight;
  const scaleY = (pose: TimelinePose) =>
    unit * (1 + pose.p * (Math.max(verticalStretch, 1) - 1));
  const scaleBefore = scaleY(computed.before);
  const scaleCurrent = scaleY(computed.here);
  const scaleAfter = scaleY(computed.after);
  const quadraticA = scaleCurrent;
  const quadraticC = 2 * (scaleAfter + scaleBefore - 2 * scaleCurrent);
  const tangent = scaleAfter - scaleBefore;
  const peakSmear = SMEAR_GAIN * computed.here.p * scaleCurrent;
  const magnitude = Math.sqrt(tangent * tangent + peakSmear * peakSmear);
  const quadraticB = tangent < 0 ? -magnitude : magnitude;
  const scaleX = unit * (1 + computed.here.p * (HORIZONTAL_STRETCH - 1));

  const direction =
    DRIFT_DIRECTION[
      positiveModulo(computed.here.cycle, DRIFT_DIRECTION.length)
    ] ?? 1;
  const psi = computed.here.psi * Math.sign(direction || 1);
  const orbitAmplitude = Math.abs(direction);
  const focal =
    state.scratch.height > 0 ? state.gl.drawingBufferHeight * FOCAL : 1;
  const z = focal * (1 - ORBIT_DEPTH * (1 + Math.cos(psi)) * 0.5);
  const x = 0;
  const y = focal * ORBIT_RISE * orbitAmplitude * Math.sin(psi);
  const yaw = orbitTurn(psi, ORBIT_YAW, ORBIT_YAW_LAG);
  const pitch = orbitTurn(psi, ORBIT_PITCH, ORBIT_PITCH_LAG);
  const pivot = PIVOT_FRAC * computed.here.p;
  const perspective = focal / z;
  const glowX = gl.drawingBufferWidth / 2 + (focal * x) / z;
  const glowY = gl.drawingBufferHeight * (0.5 + pivot) + (focal * y) / z;
  const wordWidth = state.wordHalfWidth * scaleX * perspective;
  const wordHeight = state.textureCapHeight * scaleCurrent * perspective;

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL method, not a React hook
  gl.useProgram(state.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.uniform1i(uniforms.uText, 0);
  gl.uniform2f(uniforms.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform2f(uniforms.uHalfPx, state.atlasWidth, state.halfHeight);
  gl.uniform1f(uniforms.uAtlasRows, state.atlasRows);
  gl.uniform1f(uniforms.uSx, scaleX);
  gl.uniform3f(uniforms.uSyQ, quadraticA, quadraticB, quadraticC);
  gl.uniform1f(uniforms.uCenterY, 0.5 + pivot);
  gl.uniform1f(uniforms.uSwapU, computed.swapU);
  gl.uniform1f(uniforms.uHalfA, firstRow);
  gl.uniform1f(uniforms.uHalfB, secondRow);
  gl.uniform3f(
    uniforms.uK,
    computed.shutterRatios[0],
    computed.shutterRatios[1],
    computed.shutterRatios[2],
  );
  gl.uniform2f(
    uniforms.uSwapScl,
    1 + SWAP_SPREAD * computed.swapAmount,
    1 - SWAP_SPREAD * computed.swapAmount,
  );
  gl.uniform1f(uniforms.uShape, SHUTTER_SHAPE);
  gl.uniform1f(uniforms.uRoll, ROLL_U);
  gl.uniform1f(uniforms.uLag, LAG_U);
  gl.uniform1f(uniforms.uThin, THIN * computed.here.p);
  gl.uniform1f(uniforms.uBloom, BLOOM_GAIN * computed.here.p);
  gl.uniform1f(
    uniforms.uGain,
    (1 + SPEED_GAIN * computed.here.p) * (1 + SWAP_FLASH * computed.swapAmount),
  );
  gl.uniform1f(uniforms.uExp, EXPOSURE);
  gl.uniform1f(uniforms.uFocal, focal);
  gl.uniform3f(uniforms.uPos, x, y, z);
  gl.uniform4f(
    uniforms.uRot,
    Math.sin(yaw),
    Math.cos(yaw),
    Math.sin(pitch),
    Math.cos(pitch),
  );
  gl.uniform1f(uniforms.uCrt, CRT_GAIN * computed.here.p);
  gl.uniform1f(uniforms.uTime, frame / Math.max(fps, 1));
  gl.uniform4f(
    uniforms.uGlow,
    glowX,
    glowY,
    Math.max(wordWidth * GLOW_SPREAD, gl.drawingBufferWidth * GLOW_MIN),
    Math.min(
      Math.max(wordHeight * GLOW_SPREAD, gl.drawingBufferHeight * GLOW_MIN),
      gl.drawingBufferHeight * GLOW_MAX_Y,
    ),
  );
  gl.uniform1f(uniforms.uGlowAmp, GROUND_SPEED * computed.here.p);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

export function RushType({
  phrase = rushTypeDefaultPhrase,
  fontSize = 68,
  fontFamily = "Arial, Helvetica, sans-serif",
  fontWeight = 400,
  verticalStretch = 7,
  chromaticSpread = 1,
  restDuration = DEFAULT_REST_FRAMES,
  peakHoldDuration = DEFAULT_HOLD_FRAMES,
  speed = 1,
  className,
}: RushTypeProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GlState | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [renderHandle] = useState(() => delayRender("rush-type: first frame"));
  const continuedRef = useRef(false);
  const words = useMemo(() => normalizeRushTypePhrase(phrase), [phrase]);
  const resolvedFontFamily = useMemo(
    () => resolveFontFamily(fontFamily),
    [fontFamily],
  );
  const effectiveFrame = frame * Math.max(speed, 0);
  const computed = computeFrame({
    frame: effectiveFrame,
    fps,
    wordCount: words.length,
    restDuration,
    peakHoldDuration,
    chromaticSpread,
  });

  useEffect(() => {
    let cancelled = false;
    setFontReady(false);
    const ready = () => {
      if (!cancelled) setFontReady(true);
    };
    if (typeof document === "undefined" || !document.fonts) {
      ready();
      return () => {
        cancelled = true;
      };
    }
    document.fonts
      .load(
        `${Number(fontWeight) || 400} ${Math.max(fontSize, 1)}px ${fontFamily}`,
      )
      .then(ready, ready);
    return () => {
      cancelled = true;
    };
  }, [fontFamily, fontSize, fontWeight]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current || webGlFailed) return;
    try {
      const state = createGlState(canvas);
      if (!state) {
        setWebGlFailed(true);
        return;
      }
      stateRef.current = state;
    } catch {
      setWebGlFailed(true);
    }
    return () => {
      if (stateRef.current) destroyGlState(stateRef.current);
      stateRef.current = null;
    };
  }, [webGlFailed]);

  useLayoutEffect(() => {
    const state = stateRef.current;
    if (!state || !fontReady) return;
    drawRushType({
      state,
      computed,
      words,
      fontSize,
      fontFamily: resolvedFontFamily,
      fontWeight: Number(fontWeight) || 400,
      verticalStretch,
      frame: effectiveFrame,
      fps,
    });
    if (!continuedRef.current) {
      continuedRef.current = true;
      continueRender(renderHandle);
    }
  }, [
    computed,
    effectiveFrame,
    fontReady,
    fontSize,
    fontWeight,
    fps,
    renderHandle,
    resolvedFontFamily,
    verticalStretch,
    words,
  ]);

  useEffect(() => {
    if (!webGlFailed || continuedRef.current) return;
    continuedRef.current = true;
    continueRender(renderHandle);
  }, [renderHandle, webGlFailed]);

  const currentWord = words[computed.here.wordIndex] ?? words[0];

  return (
    <div
      className={className}
      role="img"
      aria-label={`${phrase}: words stretching into vertical motion blur`}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: webGlFailed ? "none" : "block",
          width: "100%",
          height: "100%",
        }}
      />
      {webGlFailed ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily,
            fontSize,
            fontWeight,
          }}
        >
          {currentWord}
        </div>
      ) : null}
    </div>
  );
}
