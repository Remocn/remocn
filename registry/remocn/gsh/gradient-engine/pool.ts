/**
 * The page's WebGL contexts. Gradients never hold a context on their own
 * canvas; they lease one of at most MAX_LIVE_CONTEXTS offscreen contexts,
 * render into it and copy the frame onto their 2D canvas. Returning a lease
 * keeps the last frame on screen, and contexts are reused instead of being
 * lost and restored.
 *
 * When the browser loses a context, its lease ends at once: the holder is
 * told (it keeps its last frame), the context stays unavailable, and the
 * scheduler re-runs so the gradient can lease another one. When the context
 * is restored it becomes available again and the scheduler re-runs.
 */
import type { BackendLease } from "./backend";
import { defaultParams } from "./params";
import type { AnyCanvas, WebGLRenderer } from "./renderer";
import {
  createWebGLRenderer,
  documentColorResolver,
  getWebGL2,
} from "./renderer";

export const MAX_LIVE_CONTEXTS = 8;

export interface PooledContext extends BackendLease {
  readonly canvas: AnyCanvas;
  readonly gl: WebGL2RenderingContext;
  readonly renderer: WebGLRenderer;
  leased: boolean;
  lost: boolean;
  /** Called once if the context is lost while leased. */
  onLost: (() => void) | null;
}

const contexts = new Set<PooledContext>();
let unsupported = false;
const changeListeners = new Set<() => void>();

/** Runs `listener` whenever a context is lost or restored. */
export function onPoolChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

function notifyChange() {
  for (const listener of changeListeners) {
    listener();
  }
}

function createCanvas(): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(1, 1);
  }
  return document.createElement("canvas");
}

function create(): PooledContext | null {
  if (unsupported) {
    return null;
  }
  let canvas = createCanvas();
  let gl = getWebGL2(canvas, { preserveDrawingBuffer: false });
  if (
    !gl &&
    typeof document !== "undefined" &&
    !(canvas instanceof HTMLCanvasElement)
  ) {
    // Some browsers have OffscreenCanvas without WebGL2 on it.
    canvas = document.createElement("canvas");
    gl = getWebGL2(canvas, { preserveDrawingBuffer: false });
  }
  if (!gl) {
    unsupported = true;
    return null;
  }
  const holder = { resolver: documentColorResolver };
  const renderer = createWebGLRenderer({
    canvas,
    gl,
    params: defaultParams,
    resolveColor: (value) => holder.resolver(value),
  });
  const context: PooledContext = {
    canvas,
    gl,
    isLost: () => context.lost || gl.isContextLost(),
    leased: false,
    loaded: null,
    sourceY: 0,
    lost: false,
    onLost: null,
    renderFrame: (frame, target) => renderer.renderFrame(frame, target),
    renderer,
    setParams: (next) => renderer.setParams(next),
    get resolver() {
      return holder.resolver;
    },
    set resolver(next) {
      holder.resolver = next;
    },
  };
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    context.lost = true;
    context.loaded = null;
    const holder = context.onLost;
    context.onLost = null;
    context.leased = false;
    holder?.();
    notifyChange();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    if (!contexts.has(context)) {
      // Trimmed while lost: don't keep a restored context outside the budget.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }
    context.lost = false;
    context.loaded = null;
    try {
      context.renderer.restore();
    } catch {
      destroy(context);
    }
    notifyChange();
  });
  contexts.add(context);
  return context;
}

/** True once creating a WebGL2 context has failed on this page. */
export function webglUnsupported(): boolean {
  return unsupported;
}

/**
 * Leases an idle context, creating one if the budget allows. `onLost` runs if
 * the browser loses the context during the lease; the lease is already over
 * by then.
 */
export function acquireContext(
  onLost: (() => void) | null = null,
): PooledContext | null {
  for (const context of contexts) {
    if (!context.leased && !context.lost) {
      context.leased = true;
      context.onLost = onLost;
      return context;
    }
  }
  if (contexts.size >= MAX_LIVE_CONTEXTS) {
    return null;
  }
  try {
    const context = create();
    if (context) {
      context.leased = true;
      context.onLost = onLost;
    }
    return context;
  } catch {
    // A shader that fails to compile means this engine cannot run here.
    unsupported = true;
    return null;
  }
}

export function releaseContext(context: PooledContext): void {
  context.leased = false;
  context.onLost = null;
}

function destroy(context: PooledContext) {
  context.renderer.destroy();
  context.gl.getExtension("WEBGL_lose_context")?.loseContext();
  contexts.delete(context);
}

/** Frees idle contexts until at most `keep` contexts remain. */
export function trimContexts(keep: number): void {
  for (const context of [...contexts]) {
    if (contexts.size <= keep) {
      return;
    }
    if (!context.leased) {
      destroy(context);
    }
  }
}

export function liveContextCount(): number {
  return contexts.size;
}

/** The pool's contexts. For tests and the engine lab only. */
export function pooledContexts(): readonly PooledContext[] {
  return [...contexts];
}
