/**
 * The WebGPU backend's always-loaded half: the renderer preference, change
 * notifications and synchronous answers for the scheduler and mounts. The
 * device code (probe, leases, pipelines) lives in webgpu-device.ts and is
 * imported on demand: only when a gradient with a WGSL twin is near the
 * viewport, the browser has `navigator.gpu`, and WebGL2 is not preferred.
 * Each kind's WGSL loads the same way, so WebGL-only pages never download
 * any WebGPU code or shader text.
 */
import type { BackendLease } from "./backend";
import { getKind } from "./kinds";
import type { GradientKind } from "./types";

type Device = typeof import("./webgpu-device");

export type BackendPreference = "auto" | "webgpu" | "webgl2";

/** Most WebGPU surfaces alive at once; the scheduler's WebGPU budget. */
export const MAX_WEBGPU_SURFACES = 16;
/** Swap-chain memory cap across leased surfaces: width x height x 4 bytes x 3 buffers. */
export const WEBGPU_MEMORY_CAP = 96 * 1024 * 1024;

export interface WebGPUStats {
  state: "idle" | "probing" | "ready" | "failed";
  adapter: string | null;
  reason: string | null;
  losses: number;
  surfaces: number;
  leased: number;
  leasedBytes: number;
  /** Per-lease uniform buffers still alive; always equals `surfaces`. */
  uniformBuffers: number;
}

const PREFERENCE_KEY = "gradients:gradient-backend";
const LEGACY_PREFERENCE_KEY = "gcn:gradient-backend";

function isPreference(value: unknown): value is BackendPreference {
  return value === "auto" || value === "webgpu" || value === "webgl2";
}

/** `?gradient-backend=` wins over localStorage["gradients:gradient-backend"]; default "auto". */
function storedPreference(): BackendPreference {
  if (typeof window === "undefined") {
    return "auto";
  }
  try {
    const query = new URLSearchParams(window.location.search).get(
      "gradient-backend",
    );
    if (isPreference(query)) {
      return query;
    }
    const current = window.localStorage.getItem(PREFERENCE_KEY);
    const stored =
      current ?? window.localStorage.getItem(LEGACY_PREFERENCE_KEY);
    if (current === null && isPreference(stored)) {
      window.localStorage.setItem(PREFERENCE_KEY, stored);
      window.localStorage.removeItem(LEGACY_PREFERENCE_KEY);
    }
    return isPreference(stored) ? stored : "auto";
  } catch {
    return "auto";
  }
}

let preference: BackendPreference = storedPreference();
let device: Device | null = null;
let loading = false;
/** Why WebGPU will not load on this page (no navigator.gpu, or the import failed). */
let unavailable: string | null = null;
let pendingMemoryCap = 0;
const changeListeners = new Set<() => void>();

/** Runs `listener` when WebGPU loads, becomes ready, fails, loses its device, or a kind finishes compiling. */
export function onWebGPUChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/** For webgpu-device.ts: tell listeners something changed. */
export function notifyWebGPUChange(): void {
  for (const listener of changeListeners) {
    listener();
  }
}

function hasWebGPU(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Reflect.get(navigator, "gpu") !== undefined
  );
}

function load() {
  loading = true;
  import("./webgpu-device").then(
    (module) => {
      device = module;
      if (pendingMemoryCap > 0) {
        module.setWebGPUMemoryCap(pendingMemoryCap);
      }
      notifyWebGPUChange();
    },
    (error: unknown) => {
      unavailable = `could not load the WebGPU backend: ${String(error)}`;
      notifyWebGPUChange();
    },
  );
}

/**
 * Whether WebGPU can draw `kind` now: "ready", "pending" (loading, probing
 * or compiling; ask again on the next change), or "unavailable" (use WebGL).
 * Loads the device code, starts the probe and the kind's compile on first use.
 */
export function webgpuStatus(
  kind: GradientKind,
): "ready" | "pending" | "unavailable" {
  if (preference === "webgl2" || getKind(kind).wgsl === undefined) {
    return "unavailable";
  }
  if (device) {
    return device.webgpuStatus(kind);
  }
  if (unavailable !== null) {
    return "unavailable";
  }
  if (!hasWebGPU()) {
    unavailable = "navigator.gpu is missing";
    return "unavailable";
  }
  if (!loading) {
    load();
  }
  return "pending";
}

/** Leases a surface, or null when WebGPU is not ready or a cap is reached. */
export function acquireSurface(
  onLost: (() => void) | null,
  pixels = 0,
): BackendLease | null {
  return device?.acquireSurface(onLost, pixels) ?? null;
}

export function releaseSurface(lease: BackendLease): void {
  device?.releaseSurface(lease);
}

/** Frees idle surfaces until at most `keep` remain. */
export function trimSurfaces(keep: number): void {
  device?.trimSurfaces(keep);
}

/** Changes the swap-chain memory cap (0 restores the default). For tuning and tests. */
export function setWebGPUMemoryCap(bytes: number): void {
  if (device) {
    device.setWebGPUMemoryCap(bytes);
  } else {
    pendingMemoryCap = bytes;
  }
}

export function webgpuUnsupported(): boolean {
  return unavailable !== null || (device?.webgpuUnsupported() ?? false);
}

export function getBackendPreference(): BackendPreference {
  return preference;
}

/**
 * Chooses the backend for new leases: "auto" (WebGPU when the adapter and
 * probes pass), "webgpu" (skip the hardware check, keep the probes) or
 * "webgl2". Live gradients keep their lease until it is next granted;
 * reload for a clean switch.
 */
export function setBackendPreference(
  next: BackendPreference,
  options: { persist?: boolean } = {},
): void {
  preference = next;
  if (options.persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFERENCE_KEY, next);
    } catch {
      // Storage can be off; the preference still holds for this page.
    }
  }
  device?.preferenceChanged(next);
  notifyWebGPUChange();
}

/** Counts and state for tests and the engine lab. */
export function webgpuStats(): WebGPUStats {
  return (
    device?.webgpuStats() ?? {
      adapter: null,
      leased: 0,
      leasedBytes: 0,
      losses: 0,
      reason: unavailable,
      state: unavailable === null ? "idle" : "failed",
      surfaces: 0,
      uniformBuffers: 0,
    }
  );
}

/**
 * Loses the device as a driver would ("unknown" reason, so the one re-init
 * runs), then destroys it. For the engine lab and tests.
 */
export function loseWebGPUDevice(reason = "unknown"): boolean {
  return device?.loseWebGPUDevice(reason) ?? false;
}
