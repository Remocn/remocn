/**
 * The seam between live gradients (mount.ts, scheduler.ts) and the GPU API
 * that draws them. A backend hands out leases: a renderer drawing into an
 * offscreen canvas that the mount copies onto its own 2D canvas. Because the
 * visible canvas only ever holds a 2D context, switching backends (or losing
 * one mid-session) never touches the DOM, and the last frame stays on screen.
 *
 * Two backends: WebGPU (webgpu.ts), chosen per kind when the page passed
 * its adapter checks and the kind has a WGSL twin that compiled, and WebGL2
 * (pool.ts) for everything else. A WebGPU kind still compiling, or a page
 * still probing, gets no lease yet; the scheduler retries when WebGPU
 * reports a change.
 *
 * Exports do not go through a backend; they use export.ts (WebGL) directly.
 */
import { acquireContext, releaseContext, webglUnsupported } from "./pool";
import type { AnyCanvas, ColorResolver } from "./renderer";
import type {
  FrameInput,
  GradientKind,
  GradientParams,
  RenderTarget,
} from "./types";
import {
  acquireSurface,
  releaseSurface,
  webgpuStatus,
  webgpuUnsupported,
} from "./webgpu";

export type BackendName = "webgl2" | "webgpu";

/** One leased renderer. Stays with its backend between leases, so `loaded` survives. */
export interface BackendLease {
  /** Where frames land; the mount copies from it with drawImage. */
  readonly canvas: AnyCanvas;
  /** First row of the frame in `canvas` (a WebGPU lease may draw a spare row above it). */
  readonly sourceY: number;
  /** Colour resolver used by the renderer; set by the current leaseholder. */
  resolver: ColorResolver;
  /** Which params (owner and version) the renderer was last loaded with. */
  loaded: { owner: object; version: number } | null;
  setParams(params: GradientParams): void;
  renderFrame(frame: FrameInput, target: RenderTarget): void;
  /** True once the GPU resources are gone; the canvas then holds no new frame. */
  isLost(): boolean;
}

export interface GradientBackend {
  readonly name: BackendName;
  /** Whether this backend can draw the kind right now; mounts check it before acquiring. */
  supports(kind: GradientKind): boolean;
  /**
   * Leases a renderer, or null when the budget is used up or the backend
   * cannot run. `onLost` runs if the lease is lost; it has ended by then.
   * `pixels` is the size the lease will render at, for memory caps.
   */
  acquire(onLost?: (() => void) | null, pixels?: number): BackendLease | null;
  release(lease: BackendLease): void;
  /** True once this backend has failed for good on this page. */
  unsupported(): boolean;
}

export const webglBackend: GradientBackend = {
  acquire: (onLost = null) => acquireContext(onLost),
  name: "webgl2",
  // Only ever handed its own pooled contexts back.
  release: releaseContext,
  supports: () => true,
  unsupported: webglUnsupported,
};

export const webgpuBackend: GradientBackend = {
  acquire: (onLost = null, pixels = 0) => acquireSurface(onLost, pixels),
  name: "webgpu",
  release: releaseSurface,
  // Ready to draw now: probed, and the kind's pipeline compiled.
  supports: (kind) => webgpuStatus(kind) === "ready",
  unsupported: webgpuUnsupported,
};

/**
 * The backend that draws `kind` on this page: WebGPU unless the
 * preference, the adapter, the probes, the kind (no WGSL, or it failed to
 * compile) or a device loss rule it out.
 */
export function backendFor(kind: GradientKind): GradientBackend {
  return webgpuStatus(kind) === "unavailable" ? webglBackend : webgpuBackend;
}
