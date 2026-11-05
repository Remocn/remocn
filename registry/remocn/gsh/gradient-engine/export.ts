import {
  hasCssVariable,
  resolveColor,
  resolveColorToHex,
  srgbToOklab,
} from "./color";
import { normalizeParams } from "./params";
import type { AnyCanvas, ColorResolver } from "./renderer";
import { createWebGLRenderer, getWebGL2 } from "./renderer";
import type { GradientParams, GradientRenderer } from "./types";

/** What the GPU allows for one export tile. Every tile edge must be at most `maxTileSize`. */
export interface ExportLimits {
  /** Largest square tile this renderer can draw: the smallest of the limits below (and the requested size). */
  maxTileSize: number;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: readonly [number, number];
}

export interface ExportRenderer extends GradientRenderer {
  readonly limits: ExportLimits;
}

function queryLimits(
  gl: WebGL2RenderingContext,
): Omit<ExportLimits, "maxTileSize"> {
  const viewport: unknown = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const dims =
    viewport instanceof Int32Array && viewport.length >= 2
      ? ([viewport[0] ?? 0, viewport[1] ?? 0] as const)
      : ([0, 0] as const);
  return {
    maxRenderbufferSize: Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 0,
    maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0,
    maxViewportDims: dims,
  };
}

function tileLimit(
  limits: Omit<ExportLimits, "maxTileSize">,
  requested: number,
): number {
  return Math.max(
    1,
    Math.min(
      Math.floor(requested),
      limits.maxTextureSize,
      limits.maxRenderbufferSize,
      limits.maxViewportDims[0],
      limits.maxViewportDims[1],
    ),
  );
}

function createExportCanvas(): AnyCanvas {
  // Start at 1x1: a huge requested size can fail before limits are known.
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(1, 1);
  }
  if (typeof document !== "undefined") {
    return document.createElement("canvas");
  }
  throw new Error("Export needs OffscreenCanvas or a document");
}

let cachedLimits: Omit<ExportLimits, "maxTileSize"> | null = null;

/**
 * The GPU's export limits, so an export UI can offer only tile and image
 * sizes that will work. Probes once with a throwaway context, then caches.
 * Pass the tile size you want; `maxTileSize` comes back clamped.
 */
export function getExportLimits(requestedTileSize = 2048): ExportLimits {
  if (!cachedLimits) {
    const canvas = createExportCanvas();
    const gl = getWebGL2(canvas, { preserveDrawingBuffer: false });
    if (!gl) {
      throw new Error("WebGL2 is not available for export");
    }
    cachedLimits = queryLimits(gl);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return {
    ...cachedLimits,
    maxTileSize: tileLimit(cachedLimits, requestedTileSize),
  };
}

/**
 * Returns params whose colours are concrete #rrggbb values. Run it on the
 * main thread before handing params to a Worker: var(--x) needs
 * getComputedStyle, which Workers don't have. `element` scopes the
 * variables (default <html>).
 */
export function resolveParamsColors(
  params: GradientParams,
  element?: Element,
): GradientParams {
  const scope =
    element ??
    (typeof document === "undefined" ? null : document.documentElement);
  if (!scope && hasCssVariable([...params.colors, params.background])) {
    throw new Error(
      "resolveParamsColors: var() colours need a document; call it on the main thread",
    );
  }
  return {
    ...params,
    background: resolveColorToHex(params.background, scope),
    colors: params.colors.map((color) => resolveColorToHex(color, scope)),
  };
}

/**
 * Concrete colours never touch document or getComputedStyle. var() colours
 * are resolved against <html> when a document exists, and are an error in a
 * Worker.
 */
const exportColorResolver: ColorResolver = (value) => {
  if (hasCssVariable([value])) {
    if (typeof document === "undefined") {
      throw new Error(
        `createExportRenderer: unresolved colour "${value}" and no document. Call resolveParamsColors(params) on the main thread first.`,
      );
    }
    return srgbToOklab(resolveColor(value, document.documentElement));
  }
  return srgbToOklab(resolveColor(value, null));
};

/**
 * Offscreen renderer for exports: preserveDrawingBuffer on, no listeners, no
 * DPR logic. Works in a Worker when params have concrete colours (see
 * resolveParamsColors). The tile size is clamped to the GPU's texture,
 * renderbuffer and viewport limits; read the result from `limits`.
 */
export function createExportRenderer(
  params: GradientParams,
  maxTileSize = 2048,
): ExportRenderer {
  // New pinned paths must complete an integer number of laps over the export
  // loop. Legacy params omit drift and retain their exact historical frames.
  const normalized = normalizeParams(params);
  const exportParams =
    normalized.drift === undefined
      ? normalized
      : { ...normalized, speed: Math.round(normalized.speed) };
  const canvas = createExportCanvas();
  const gl = getWebGL2(canvas, { preserveDrawingBuffer: true });
  if (!gl) {
    throw new Error("WebGL2 is not available for export");
  }
  const queried = queryLimits(gl);
  cachedLimits ??= queried;
  const limits: ExportLimits = {
    ...queried,
    maxTileSize: tileLimit(queried, maxTileSize),
  };
  const size = limits.maxTileSize;
  canvas.width = size;
  canvas.height = size;
  let renderer: ReturnType<typeof createWebGLRenderer>;
  try {
    renderer = createWebGLRenderer({
      canvas,
      gl,
      params: exportParams,
      resolveColor: exportColorResolver,
    });
  } catch (error) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
  const live = renderer;
  return {
    canvas,
    destroy() {
      live.destroy();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    limits,
    renderFrame(frame, target) {
      if (target && (target.width > size || target.height > size)) {
        throw new RangeError(
          `Tile ${target.width}x${target.height} exceeds the export tile limit ${size} (GPU max texture ${limits.maxTextureSize}, renderbuffer ${limits.maxRenderbufferSize}, viewport ${limits.maxViewportDims.join("x")})`,
        );
      }
      live.renderFrame(
        {
          frameIndex: frame.frameIndex,
          timeSeconds: frame.timeSeconds,
          frameRate: frame.frameRate,
        },
        target,
      );
    },
    setParams: (patch) => live.setParams(patch),
  };
}
