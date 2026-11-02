import type { Oklab } from "./color";
import { resolveColor, srgbToOklab } from "./color";
import { getKind } from "./kinds";
import { fullTarget } from "./loop";
import { mergeParams, normalizeParams } from "./params";
import {
  fragmentPostlude,
  fragmentPrelude,
  vertexShader,
} from "./shaders/common";
import type {
  FrameInput,
  GradientParams,
  GradientRenderer,
  RenderTarget,
} from "./types";
import { frameUniforms } from "./uniforms";

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export interface ContextOptions {
  preserveDrawingBuffer: boolean;
}

const UNIFORMS = [
  "u_full",
  "u_tile",
  "u_loop",
  "u_seed",
  "u_scale",
  "u_warp",
  "u_blur",
  "u_grain",
  "u_frame",
  "u_dither",
  "u_colors",
  "u_count",
  "u_bg",
  "u_pointer",
  "u_scroll",
] as const;
type UniformName = (typeof UNIFORMS)[number];

interface ProgramInfo {
  program: WebGLProgram;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
}

export class ShaderError extends Error {
  override name = "ShaderError";
}

function isOffscreen(canvas: AnyCanvas): canvas is OffscreenCanvas {
  return (
    typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas
  );
}

/** Gets (or returns the existing) WebGL2 context. Null when WebGL2 is unavailable. */
export function getWebGL2(
  canvas: AnyCanvas,
  options: ContextOptions,
): WebGL2RenderingContext | null {
  const attributes: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    premultipliedAlpha: true,
    preserveDrawingBuffer: options.preserveDrawingBuffer,
    stencil: false,
  };
  try {
    return isOffscreen(canvas)
      ? canvas.getContext("webgl2", attributes)
      : canvas.getContext("webgl2", attributes);
  } catch {
    return null;
  }
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new ShaderError("Unable to create shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (
    !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
    !gl.isContextLost()
  ) {
    const log = gl.getShaderInfoLog(shader) ?? "";
    gl.deleteShader(shader);
    throw new ShaderError(`Shader compile failed: ${log}`);
  }
  return shader;
}

export type ColorResolver = (value: string) => Oklab;

export const documentColorResolver: ColorResolver = (value) =>
  srgbToOklab(
    resolveColor(
      value,
      typeof document === "undefined" ? null : document.documentElement,
    ),
  );

export interface WebGLRenderer extends GradientRenderer {
  readonly gl: WebGL2RenderingContext;
  readonly params: GradientParams;
  /** Rebuilds GPU resources after `webglcontextrestored`. */
  restore(): void;
  /** Re-resolves colours, for example after a theme change. */
  refreshColors(): void;
}

/**
 * Pure renderer over an existing WebGL2 context. No rAF, listeners or CSS.
 * Throws ShaderError when a kind's shader cannot compile.
 */
export function createWebGLRenderer(options: {
  canvas: AnyCanvas;
  gl: WebGL2RenderingContext;
  params: GradientParams;
  resolveColor?: ColorResolver;
}): WebGLRenderer {
  const { canvas, gl } = options;
  const resolve = options.resolveColor ?? documentColorResolver;
  let params = normalizeParams(options.params);
  let colors: Oklab[] = [];
  let background: Oklab = [0, 0, 0];
  let programs = new Map<string, ProgramInfo>();
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;

  const refreshColors = () => {
    colors = params.colors.map((value) => resolve(value));
    background = resolve(params.background);
  };

  const buildGeometry = () => {
    buffer = gl.createBuffer();
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  };

  const programFor = (kindName: string): ProgramInfo => {
    const kind = getKind(kindName);
    const cached = programs.get(kind.name);
    if (cached) {
      return cached;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `${fragmentPrelude}\n${kind.glsl}\n${fragmentPostlude}`,
    );
    const program = gl.createProgram();
    if (!program) {
      throw new ShaderError("Unable to create program");
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "a_position");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (
      !gl.getProgramParameter(program, gl.LINK_STATUS) &&
      !gl.isContextLost()
    ) {
      const log = gl.getProgramInfoLog(program) ?? "";
      gl.deleteProgram(program);
      throw new ShaderError(`Program link failed: ${log}`);
    }
    const uniforms = Object.fromEntries(
      UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<UniformName, WebGLUniformLocation | null>;
    const info = { program, uniforms };
    programs.set(kind.name, info);
    return info;
  };

  const restore = () => {
    programs = new Map();
    buildGeometry();
    programFor(params.kind);
  };

  refreshColors();
  restore();

  return {
    get canvas() {
      return canvas;
    },
    destroy() {
      if (!gl.isContextLost()) {
        for (const { program } of programs.values()) {
          gl.deleteProgram(program);
        }
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
      }
      programs = new Map();
    },
    gl,
    get params() {
      return params;
    },
    refreshColors,
    renderFrame(frame: FrameInput, target?: RenderTarget) {
      if (gl.isContextLost()) {
        return;
      }
      const t = target ?? fullTarget(canvas.width, canvas.height);
      if (canvas.width !== t.width || canvas.height !== t.height) {
        canvas.width = t.width;
        canvas.height = t.height;
      }
      const { program, uniforms: u } = programFor(params.kind);
      const f = frameUniforms(params, colors, background, frame, t);
      const palette = new Float32Array(18);
      f.colors.forEach(([l, a, b], i) => {
        palette.set([l, a, b], i * 3);
      });

      gl.viewport(0, 0, t.width, t.height);
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL call, not a React hook
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.u_full, f.full[0], f.full[1]);
      gl.uniform4f(u.u_tile, f.tile[0], f.tile[1], f.tile[2], f.tile[3]);
      gl.uniform2f(u.u_loop, f.loopv[0], f.loopv[1]);
      gl.uniform2f(u.u_seed, f.seed[0], f.seed[1]);
      gl.uniform1f(u.u_scale, f.scale);
      gl.uniform1f(u.u_warp, f.warp);
      gl.uniform1f(u.u_blur, f.blur);
      gl.uniform1f(u.u_grain, f.grain);
      gl.uniform1f(u.u_frame, f.frame);
      gl.uniform3f(u.u_dither, f.dither[0], f.dither[1], f.dither[2]);
      gl.uniform3fv(u.u_colors, palette);
      gl.uniform1i(u.u_count, f.count);
      gl.uniform3f(u.u_bg, f.bg[0], f.bg[1], f.bg[2]);
      gl.uniform3f(u.u_pointer, f.pointer[0], f.pointer[1], f.pointer[2]);
      gl.uniform1f(u.u_scroll, f.scroll);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    },
    restore,
    setParams(patch: Partial<GradientParams>) {
      const colorsChanged =
        patch.colors !== undefined || patch.background !== undefined;
      params = mergeParams(params, patch);
      if (colorsChanged) {
        refreshColors();
      }
    },
  };
}
