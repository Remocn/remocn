/**
 * The WebGPU backend's device half: probe, leases, pipelines and uniform
 * packing. Bare WebGPU, no library. webgpu.ts imports this module only when
 * a gradient with a WGSL twin is near the viewport, the browser has WebGPU,
 * and WebGL is not preferred, so WebGL-only pages never download it.
 *
 * One device per page; each lease is an OffscreenCanvas with a `webgpu`
 * context that the mount copies onto its own 2D canvas, exactly like a
 * pooled WebGL context, so falling back never changes a visible canvas's
 * context type and the last frame stays on screen.
 *
 * Selection (see docs/engine/webgpu-plan.md, slice 5):
 * - The adapter must say it is hardware. A missing `isFallbackAdapter`, or
 *   empty vendor and architecture (Safari often reports both), counts as
 *   unknown, and unknown is not hardware. Preference "webgpu" skips this.
 * - Before any lease, a probe checks OffscreenCanvas WebGPU, a configured
 *   context, a 1x1 frame copied onto a 2D canvas and read back (the copy
 *   path and CanvasImageSource support), and `device.lost`.
 * - Any failure selects WebGL for the page, before anything is allocated
 *   for leases.
 *
 * Device loss: every lease ends at once (mounts keep their last frame). An
 * unexpected loss gets one re-init, tagged with a generation so a stale one
 * is cancelled; a second loss, a failed or slow re-init, or a "destroyed"
 * loss moves the page to WebGL for the session.
 *
 * Shader compile failures demote just that kind to WebGL.
 */
import type { BackendLease } from "./backend";
import type { Oklab } from "./color";
import { getKind } from "./kinds";
import { normalizeParams } from "./params";
import type { AnyCanvas, ColorResolver } from "./renderer";
import { documentColorResolver } from "./renderer";
import type {
  FrameInput,
  GradientKind,
  GradientParams,
  RenderTarget,
} from "./types";
import { frameUniforms } from "./uniforms";
import type { BackendPreference, WebGPUStats } from "./webgpu";
import {
  getBackendPreference,
  MAX_WEBGPU_SURFACES,
  notifyWebGPUChange as notify,
  WEBGPU_MEMORY_CAP,
} from "./webgpu";

// Minimal structural WebGPU types. TypeScript's DOM lib has none, and
// registry users may not install @webgpu/types, so the engine declares just
// what it calls, under its own names.
interface WgpuAdapterInfo {
  readonly vendor?: string;
  readonly architecture?: string;
  readonly device?: string;
  readonly description?: string;
  readonly isFallbackAdapter?: boolean;
}
interface WgpuAdapter {
  readonly info?: WgpuAdapterInfo;
  readonly isFallbackAdapter?: boolean;
  requestDevice(): Promise<WgpuDevice>;
}
interface WgpuGpu {
  requestAdapter(options?: {
    powerPreference?: "low-power" | "high-performance";
  }): Promise<WgpuAdapter | null>;
  getPreferredCanvasFormat(): string;
}
interface WgpuBuffer {
  destroy(): void;
}
interface WgpuPipeline {
  getBindGroupLayout(index: number): unknown;
}
interface WgpuPass {
  setPipeline(pipeline: WgpuPipeline): void;
  setBindGroup(index: number, group: unknown): void;
  draw(vertices: number): void;
  end(): void;
}
interface WgpuEncoder {
  beginRenderPass(descriptor: {
    colorAttachments: {
      view: unknown;
      loadOp: "clear";
      storeOp: "store";
      clearValue: { r: number; g: number; b: number; a: number };
    }[];
  }): WgpuPass;
  finish(): unknown;
}
interface WgpuDevice {
  readonly lost: Promise<{ reason: string; message: string }>;
  readonly queue: {
    writeBuffer(buffer: WgpuBuffer, offset: number, data: ArrayBuffer): void;
    submit(commands: unknown[]): void;
  };
  createShaderModule(descriptor: { code: string }): unknown;
  createRenderPipelineAsync(descriptor: {
    layout: "auto";
    vertex: { module: unknown; entryPoint: string };
    fragment: {
      module: unknown;
      entryPoint: string;
      targets: { format: string }[];
    };
    primitive: { topology: "triangle-list" };
  }): Promise<WgpuPipeline>;
  createBuffer(descriptor: { size: number; usage: number }): WgpuBuffer;
  createBindGroup(descriptor: {
    layout: unknown;
    entries: { binding: number; resource: { buffer: WgpuBuffer } }[];
  }): unknown;
  createCommandEncoder(): WgpuEncoder;
  destroy(): void;
}
interface WgpuCanvasContext {
  configure(options: {
    device: WgpuDevice;
    format: string;
    alphaMode: "opaque";
  }): void;
  unconfigure(): void;
  getCurrentTexture(): { createView(): unknown };
}

const BUFFER_USAGE_UNIFORM = 0x40;
const BUFFER_USAGE_COPY_DST = 0x08;
/**
 * Byte offsets of the WGSL `Uniforms` struct members (shaders/wgsl-common.ts,
 * WGSL host-shareable layout). scripts/gpu/vgpu.test.ts checks them against
 * the reflected layout of every kind.
 */
export const UNIFORM_OFFSETS = {
  bg: 80,
  blur: 48,
  colors: 112,
  count: 60,
  dither: 64,
  frame: 56,
  full: 0,
  grain: 52,
  loopv: 8,
  pointer: 96,
  scale: 40,
  scroll: 76,
  seed: 32,
  tile: 16,
  warp: 44,
} as const;
/** Bytes in the WGSL `Uniforms` struct. */
export const UNIFORM_BYTES = 208;

let memoryCap = WEBGPU_MEMORY_CAP;
const SWAP_BYTES_PER_PIXEL = 4 * 3;
/** A re-init after device loss that takes longer gives up on WebGPU. */
const REINIT_TIMEOUT_MS = 2000;
/** The first probe gets longer: some drivers are slow to hand out a device. */
const PROBE_TIMEOUT_MS = 5000;

const VERTEX_WGSL = /* wgsl */ `
@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

type State =
  | { kind: "idle" }
  | { kind: "probing"; generation: number }
  | {
      kind: "ready";
      generation: number;
      device: WgpuDevice;
      format: string;
      adapter: string;
    }
  | { kind: "failed"; reason: string };

let state: State = { kind: "idle" };
let generation = 0;
let losses = 0;

interface Surface {
  canvas: OffscreenCanvas;
  context: WgpuCanvasContext;
  lease: WebGPULease;
}
const surfaces = new Set<Surface>();
/** Uniform buffers created minus destroyed; equals live leases' count. For tests. */
let liveUniformBuffers = 0;
const pipelines = new Map<string, WgpuPipeline | "pending" | "failed">();

function isWgpuGpu(value: unknown): value is WgpuGpu {
  return (
    typeof value === "object" &&
    value !== null &&
    "requestAdapter" in value &&
    "getPreferredCanvasFormat" in value
  );
}

function navigatorGpu(): WgpuGpu | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  const gpu: unknown = Reflect.get(navigator, "gpu");
  return isWgpuGpu(gpu) ? gpu : null;
}

function isWgpuContext(value: unknown): value is WgpuCanvasContext {
  return (
    typeof value === "object" &&
    value !== null &&
    "configure" in value &&
    "getCurrentTexture" in value
  );
}

function webgpuContext(canvas: OffscreenCanvas): WgpuCanvasContext | null {
  const context: unknown = canvas.getContext("webgpu");
  return isWgpuContext(context) ? context : null;
}

const SOFTWARE = /swiftshader|llvmpipe|lavapipe|software/i;

/** Why the adapter is not trusted as hardware, or null when it is. */
export function adapterRefusal(adapter: WgpuAdapter): string | null {
  const info = adapter.info;
  const fallback = info?.isFallbackAdapter ?? adapter.isFallbackAdapter;
  if (fallback === true) {
    return "fallback (software) adapter";
  }
  if (fallback !== false) {
    return "adapter does not say whether it is a fallback adapter";
  }
  const named = `${info?.vendor ?? ""} ${info?.architecture ?? ""}`.trim();
  if (named === "") {
    return "adapter reports no vendor or architecture";
  }
  if (SOFTWARE.test(`${named} ${info?.description ?? ""}`)) {
    return `software adapter (${named})`;
  }
  return null;
}

function describe(adapter: WgpuAdapter): string {
  const info = adapter.info;
  return (
    [info?.vendor, info?.architecture, info?.description]
      .filter((part) => part && part.length > 0)
      .join(" ") || "unknown adapter"
  );
}

function timeout(ms: number): Promise<"timeout"> {
  return new Promise((resolve) => setTimeout(() => resolve("timeout"), ms));
}

/** Draws a 1x1 clear colour through WebGPU and reads it back through a 2D canvas. */
function probeCopyPath(device: WgpuDevice, format: string): string | null {
  if (typeof OffscreenCanvas === "undefined") {
    return "no OffscreenCanvas";
  }
  const canvas = new OffscreenCanvas(1, 1);
  const context = webgpuContext(canvas);
  if (!context) {
    return "OffscreenCanvas has no webgpu context";
  }
  context.configure({ alphaMode: "opaque", device, format });
  const encoder = device.createCommandEncoder();
  encoder
    .beginRenderPass({
      colorAttachments: [
        {
          clearValue: { a: 1, b: 0.4, g: 0.6, r: 0.2 },
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    })
    .end();
  device.queue.submit([encoder.finish()]);
  const out = new OffscreenCanvas(1, 1);
  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return "no 2D canvas";
  }
  try {
    // Copying right after queue.submit() is safe: reading a WebGPU canvas
    // (drawImage included) runs "get a copy of the image contents of a
    // context", which first ensures all submitted work has finished writing the
    // current texture (https://gpuweb.github.io/gpuweb/#abstract-opdef-get-a-copy-of-the-image-contents-of-a-context,
    // via #canvas-hooks). The engine lab checks it: heavy kinds at 2560x1440,
    // each frame copied the moment it is submitted, never stale or blank.
    ctx.drawImage(canvas, 0, 0);
  } catch (error) {
    return `drawImage from a WebGPU canvas threw: ${String(error)}`;
  }
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  context.unconfigure();
  const close = (v: number, want: number) => Math.abs(v - want) <= 3;
  return close(r, 51) && close(g, 153) && close(b, 102)
    ? null
    : `copy read back rgb(${r},${g},${b}), wanted rgb(51,153,102)`;
}

function fail(reason: string) {
  state = { kind: "failed", reason };
  pipelines.clear();
  notify();
}

async function probe(gen: number, limitMs: number): Promise<void> {
  const gpu = navigatorGpu();
  if (!gpu) {
    fail("navigator.gpu is missing");
    return;
  }
  const attempt = async (): Promise<
    { device: WgpuDevice; format: string; adapter: string } | { error: string }
  > => {
    const adapter = await gpu.requestAdapter({ powerPreference: "low-power" });
    if (!adapter) {
      return { error: "no WebGPU adapter" };
    }
    const refusal =
      getBackendPreference() === "webgpu" ? null : adapterRefusal(adapter);
    if (refusal) {
      return { error: refusal };
    }
    const device = await adapter.requestDevice();
    // From here every failure, thrown or returned, destroys the device.
    try {
      if (!(device.lost instanceof Promise)) {
        throw new Error("device.lost is not a promise");
      }
      const format = gpu.getPreferredCanvasFormat();
      const copy = probeCopyPath(device, format);
      if (copy) {
        throw new Error(copy);
      }
      return { adapter: describe(adapter), device, format };
    } catch (error) {
      device.destroy();
      return { error: error instanceof Error ? error.message : String(error) };
    }
  };
  const pending = attempt().catch(
    (error: unknown) => ({ error: String(error) }) as const,
  );
  const result = await Promise.race([pending, timeout(limitMs)]);
  if (gen !== generation) {
    // A newer probe or a failure replaced this one: drop what it made.
    void pending.then((late) => "device" in late && late.device.destroy());
    return;
  }
  if (result === "timeout") {
    void pending.then((late) => "device" in late && late.device.destroy());
    fail(`no device within ${limitMs}ms`);
    return;
  }
  if ("error" in result) {
    fail(result.error);
    return;
  }
  const { device } = result;
  state = { ...result, generation: gen, kind: "ready" };
  void device.lost.then((info) => deviceLost(gen, info.reason));
  notify();
}

function startProbe(limitMs: number) {
  generation += 1;
  state = { generation, kind: "probing" };
  void probe(generation, limitMs);
}

function deviceLost(gen: number, reason: string) {
  if (state.kind !== "ready" || state.generation !== gen) {
    return;
  }
  const lost = state.device;
  losses += 1;
  generation += 1;
  pipelines.clear();
  for (const surface of [...surfaces]) {
    surfaces.delete(surface);
    surface.lease.end();
  }
  if (reason !== "destroyed" && losses === 1) {
    startProbe(REINIT_TIMEOUT_MS);
  } else {
    fail(`device lost (${reason}); using WebGL for this session`);
  }
  lost.destroy();
  notify();
}

function compile(kind: GradientKind, device: WgpuDevice, format: string) {
  const definition = getKind(kind);
  const gen = generation;
  pipelines.set(definition.name, "pending");
  const load = definition.wgsl;
  // The WGSL prelude and the kind's twin load on demand, so pages that never
  // pick WebGPU never download them.
  Promise.all([
    import("./shaders/wgsl-common"),
    load ? load() : Promise.reject(new Error("no WGSL twin")),
  ])
    .then(([common, source]) =>
      device.createRenderPipelineAsync({
        fragment: {
          entryPoint: "fs_main",
          module: device.createShaderModule({
            code: common.composeWgsl(source),
          }),
          targets: [{ format }],
        },
        layout: "auto",
        primitive: { topology: "triangle-list" },
        vertex: {
          entryPoint: "vs",
          module: device.createShaderModule({ code: VERTEX_WGSL }),
        },
      }),
    )
    .then(
      (pipeline) => {
        if (gen === generation) pipelines.set(definition.name, pipeline);
      },
      () => {
        if (gen === generation) pipelines.set(definition.name, "failed");
      },
    )
    .finally(notify);
}

/**
 * Whether WebGPU can draw `kind` now: "ready", "pending" (probing or
 * compiling; ask again on the next change), or "unavailable" (use WebGL).
 * Starts the probe and the kind's compile on first use.
 */
export function webgpuStatus(
  kind: GradientKind,
): "ready" | "pending" | "unavailable" {
  if (state.kind === "idle") {
    startProbe(PROBE_TIMEOUT_MS);
    return "pending";
  }
  if (state.kind === "failed") {
    return "unavailable";
  }
  if (state.kind === "probing") {
    return "pending";
  }
  const name = getKind(kind).name;
  const pipeline = pipelines.get(name);
  if (pipeline === undefined) {
    compile(name, state.device, state.format);
    return "pending";
  }
  if (pipeline === "failed") {
    return "unavailable";
  }
  return pipeline === "pending" ? "pending" : "ready";
}

function leasedBytes(): number {
  let total = 0;
  for (const surface of surfaces) {
    if (surface.lease.leased) {
      total +=
        surface.canvas.width * surface.canvas.height * SWAP_BYTES_PER_PIXEL;
    }
  }
  return total;
}

function packUniforms(
  params: GradientParams,
  colors: readonly Oklab[],
  background: Oklab,
  frame: FrameInput,
  target: RenderTarget,
): ArrayBuffer {
  const u = frameUniforms(params, colors, background, frame, target);
  const buffer = new ArrayBuffer(UNIFORM_BYTES);
  const f = new Float32Array(buffer);
  const at = (member: keyof typeof UNIFORM_OFFSETS) =>
    UNIFORM_OFFSETS[member] / 4;
  f.set(u.full, at("full"));
  f.set(u.loopv, at("loopv"));
  f.set(u.tile, at("tile"));
  f.set(u.seed, at("seed"));
  f[at("scale")] = u.scale;
  f[at("warp")] = u.warp;
  f[at("blur")] = u.blur;
  f[at("grain")] = u.grain;
  f[at("frame")] = u.frame;
  new Int32Array(buffer)[at("count")] = u.count;
  f.set(u.dither, at("dither"));
  f[at("scroll")] = u.scroll;
  f.set(u.bg, at("bg"));
  f.set(u.pointer, at("pointer"));
  u.colors.forEach((color, k) => {
    f.set(color, at("colors") + k * 4);
  });
  return buffer;
}

class WebGPULease implements BackendLease {
  readonly canvas: AnyCanvas;
  resolver: ColorResolver = documentColorResolver;
  loaded: { owner: object; version: number } | null = null;
  sourceY = 0;
  leased = false;
  onLost: (() => void) | null = null;
  private lost = false;
  private params: GradientParams | null = null;
  private colors: Oklab[] = [];
  private background: Oklab = [0, 0, 0];
  private readonly uniforms: WgpuBuffer;
  private freed = false;
  private readonly groups = new Map<WgpuPipeline, unknown>();
  private readonly surface: OffscreenCanvas;
  private readonly context: WgpuCanvasContext;
  private readonly device: WgpuDevice;
  private readonly gen: number;

  constructor(
    surface: OffscreenCanvas,
    context: WgpuCanvasContext,
    device: WgpuDevice,
    gen: number,
  ) {
    this.surface = surface;
    this.context = context;
    this.device = device;
    this.gen = gen;
    this.canvas = surface;
    liveUniformBuffers += 1;
    this.uniforms = device.createBuffer({
      size: UNIFORM_BYTES,
      usage: BUFFER_USAGE_UNIFORM | BUFFER_USAGE_COPY_DST,
    });
  }

  isLost(): boolean {
    return this.lost || this.gen !== generation || state.kind !== "ready";
  }

  setParams(params: GradientParams): void {
    this.params = normalizeParams(params);
    this.colors = this.params.colors.map((value) => this.resolver(value));
    this.background = this.resolver(this.params.background);
  }

  renderFrame(frame: FrameInput, target: RenderTarget): void {
    const params = this.params;
    if (!params || this.isLost()) {
      return;
    }
    const pipeline = pipelines.get(getKind(params.kind).name);
    if (!pipeline || typeof pipeline === "string") {
      // The kind is not compiled here; hand the slot back to the scheduler.
      this.drop();
      return;
    }
    // WebGL rasterises bottom-up, WebGPU top-down, and derivatives come
    // from 2x2 quads. At odd heights the two group different rows, so draw
    // one spare row above the image: quads then line up with WebGL's and
    // fwidth() matches. The frame sits from row `sourceY` down.
    const pad = target.height % 2;
    const height = target.height + pad;
    if (this.surface.width !== target.width || this.surface.height !== height) {
      const grow =
        (target.width * height - this.surface.width * this.surface.height) *
        SWAP_BYTES_PER_PIXEL;
      if (grow > 0 && leasedBytes() + grow > memoryCap) {
        // Over the memory cap: evict this lease; the mount keeps its frame.
        this.drop();
        return;
      }
      this.surface.width = target.width;
      this.surface.height = height;
    }
    this.sourceY = pad;
    this.device.queue.writeBuffer(
      this.uniforms,
      0,
      packUniforms(params, this.colors, this.background, frame, {
        ...target,
        height,
        y: target.y - pad,
      }),
    );
    let group = this.groups.get(pipeline);
    if (!group) {
      group = this.device.createBindGroup({
        entries: [{ binding: 0, resource: { buffer: this.uniforms } }],
        layout: pipeline.getBindGroupLayout(0),
      });
      this.groups.set(pipeline, group);
    }
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { a: 1, b: 0, g: 0, r: 0 },
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  /** Ends the lease from inside (eviction, missing pipeline): isLost() turns true, onLost runs next task. */
  private drop() {
    removeSurface(this);
    this.free();
    this.lost = true;
    const holder = this.onLost;
    this.onLost = null;
    this.leased = false;
    if (holder) {
      queueMicrotask(holder);
    }
  }

  /** Device loss: the lease is over for good. */
  end() {
    this.drop();
  }

  /** Releases the uniform buffer and the context configuration, once. */
  private free() {
    if (this.freed) {
      return;
    }
    this.freed = true;
    liveUniformBuffers -= 1;
    this.uniforms.destroy();
    if (state.kind === "ready" && state.device === this.device) {
      this.context.unconfigure();
    }
  }

  /** Back to the pool: shrink to 1x1 so the swap chain's memory goes. */
  release() {
    this.leased = false;
    this.onLost = null;
    this.surface.width = 1;
    this.surface.height = 1;
  }

  /** Trimmed from the pool while idle. */
  retire() {
    this.free();
  }

  reusable(): boolean {
    return !this.leased && !this.lost && this.gen === generation;
  }
}

/** Takes a lease's surface out of the pool and frees it. */
function removeSurface(lease: WebGPULease) {
  for (const surface of surfaces) {
    if (surface.lease === lease) {
      surfaces.delete(surface);
    }
  }
}

/** Leases a surface, or null when WebGPU is not ready or a cap is reached. */
export function acquireSurface(
  onLost: (() => void) | null,
  pixels = 0,
): WebGPULease | null {
  if (state.kind !== "ready") {
    return null;
  }
  // Refuse up front what would only be evicted on the first frame.
  if (leasedBytes() + pixels * SWAP_BYTES_PER_PIXEL > memoryCap) {
    return null;
  }
  for (const surface of surfaces) {
    if (surface.lease.reusable()) {
      surface.lease.leased = true;
      surface.lease.onLost = onLost;
      return surface.lease;
    }
  }
  if (surfaces.size >= MAX_WEBGPU_SURFACES || leasedBytes() >= memoryCap) {
    return null;
  }
  const canvas = new OffscreenCanvas(1, 1);
  const context = webgpuContext(canvas);
  if (!context) {
    fail("OffscreenCanvas lost its webgpu context");
    return null;
  }
  context.configure({
    alphaMode: "opaque",
    device: state.device,
    format: state.format,
  });
  const lease = new WebGPULease(canvas, context, state.device, generation);
  lease.leased = true;
  lease.onLost = onLost;
  surfaces.add({ canvas, context, lease });
  return lease;
}

export function releaseSurface(lease: BackendLease): void {
  for (const surface of surfaces) {
    if (surface.lease === lease) {
      surface.lease.release();
    }
  }
}

/** Frees idle surfaces until at most `keep` remain. */
export function trimSurfaces(keep: number): void {
  for (const surface of [...surfaces]) {
    if (surfaces.size <= keep) {
      return;
    }
    if (!surface.lease.leased) {
      surface.lease.retire();
      surfaces.delete(surface);
    }
  }
}

/** Changes the swap-chain memory cap (0 restores the default). For tuning and tests. */
export function setWebGPUMemoryCap(bytes: number): void {
  memoryCap = bytes > 0 ? bytes : WEBGPU_MEMORY_CAP;
  notify();
}

export function webgpuUnsupported(): boolean {
  return state.kind === "failed";
}

/** The preference changed (webgpu.ts already stored it). */
export function preferenceChanged(next: BackendPreference): void {
  // Forcing WebGPU retries a page that only failed the adapter policy.
  if (next === "webgpu" && state.kind === "failed" && losses === 0) {
    state = { kind: "idle" };
  }
}

/** Counts and state for tests and the engine lab. */
export function webgpuStats(): WebGPUStats {
  return {
    adapter: state.kind === "ready" ? state.adapter : null,
    leased: [...surfaces].filter((s) => s.lease.leased).length,
    leasedBytes: leasedBytes(),
    losses,
    reason: state.kind === "failed" ? state.reason : null,
    state: state.kind,
    surfaces: surfaces.size,
    uniformBuffers: liveUniformBuffers,
  };
}

/**
 * Loses the device as a driver would ("unknown" reason, so the one re-init
 * runs), then destroys it. For the engine lab and tests.
 */
export function loseWebGPUDevice(reason = "unknown"): boolean {
  if (state.kind !== "ready") {
    return false;
  }
  deviceLost(state.generation, reason);
  return true;
}
