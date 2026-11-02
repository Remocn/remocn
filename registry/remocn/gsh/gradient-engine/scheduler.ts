/**
 * Module-level GPU budget: at most MAX_LIVE_CONTEXTS WebGL contexts and
 * MAX_WEBGPU_SURFACES WebGPU surfaces per page, each gradient counting
 * against its own kind's backend. Gradients near the viewport lease one, nearest first; the rest are
 * suspended and keep their last frame (or the CSS fallback) until they come
 * close again. When more gradients are near than the budget allows, one
 * context is kept back to paint still frames for the ones left over, so they
 * never fall back to the rougher CSS approximation.
 *
 * Pixel budget: every animating gradient copies its frame onto its canvas,
 * so the cost per frame grows with the total pixel count, not the number of
 * gradients. Animating gradients share PIXEL_BUDGET drawing-buffer pixels per
 * frame (about one 1440x900 viewport at DPR 1.25). Over budget, every
 * animating gradient renders at the same lower internal scale and is
 * upscaled when copied; the soft kinds hide this well. Grain and dither are
 * per-pixel detail, so params with grain >= GRAIN_CRISP or dither on are
 * never scaled below their floor (0.8 and 1). If the floors still leave the
 * total over budget, all animating gradients drop to half the display rate.
 *
 * A primary gradient (a page's one hero canvas) has its own
 * PRIMARY_PIXEL_BUDGET. A frame-time governor (judgePace) caps the pixels
 * per frame, for every gradient alike, when frames fall behind the display rate.
 */
import type { BackendName } from "./backend";
import {
  liveContextCount,
  MAX_LIVE_CONTEXTS,
  onPoolChange,
  trimContexts,
} from "./pool";
import {
  MAX_WEBGPU_SURFACES,
  onWebGPUChange,
  trimSurfaces,
  webgpuStats,
} from "./webgpu";

export interface EngineStats {
  renderedPixels: number;
  animatingMounts: number;
  mounted: number;
  renderScale: number;
  fpsTier: "full" | "half";
  scrolling: boolean;
  paceCap: number;
  rafIntervals: number[];
  gpuTimeMs: number | null;
}

declare global {
  interface Window {
    __gcnEngineStats?: () => EngineStats;
  }
}

export { MAX_LIVE_CONTEXTS } from "./pool";

/** Drawing-buffer pixels per frame shared by all animating gradients. */
export const PIXEL_BUDGET = 2_000_000;
/**
 * Drawing-buffer pixels per frame for primary gradients, on top of
 * PIXEL_BUDGET: a 1230x760 studio stage at DPR 2 (3.7 MP) fits whole.
 */
export const PRIMARY_PIXEL_BUDGET = 4_500_000;
/** Lowest internal render scale for soft gradients. */
export const MIN_RENDER_SCALE = 0.5;
/** Grain at or above this keeps a render scale of at least 0.8. */
export const GRAIN_CRISP = 0.3;

/** How far outside the viewport (as a fraction of its height) a gradient still counts as near. */
const APPROACH_MARGIN = 0.5;

export interface FrameQuality {
  /** Internal render scale, 0-1, applied to both axes. */
  scale: number;
  /** Render every other display frame (half the display refresh rate). */
  halfRate: boolean;
}

export interface ContextSlot {
  readonly element: Element;
  /** Give this gradient a context. Returns false when none could be leased. */
  grant(): boolean;
  /** Take its context away. */
  revoke(): void;
  /** Whether any part of it is inside the viewport. */
  setVisible(visible: boolean): void;
  /** Near the viewport but over budget: show a still frame. */
  paintStill(): void;
  /** Drawing-buffer pixels at full scale. */
  pixels(): number;
  /** Lowest render scale these params tolerate. */
  minScale(): number;
  /** Draws from PRIMARY_PIXEL_BUDGET instead of the shared budget. */
  primary(): boolean;
  setQuality(quality: FrameQuality): void;
  /** The backend this gradient's kind draws with on this page. */
  backend(): BackendName;
}

interface SlotState {
  live: boolean;
  visible: boolean;
  quality: FrameQuality;
}

const slots = new Map<ContextSlot, SlotState>();
let wantedSlots = new Set<ContextSlot>();
let frame = 0;
let listening = false;
let observer: IntersectionObserver | null = null;
let pixelBudget = PIXEL_BUDGET;

function distanceToViewport(rect: DOMRect, width: number, height: number) {
  const dx = Math.max(0, rect.left - width, -rect.right);
  const dy = Math.max(0, rect.top - height, -rect.bottom);
  return Math.hypot(dx, dy);
}

/** The 60 Hz default until rAF gives us a display measurement. */
const DEFAULT_FRAME_MS = 1000 / 60;
/** Display intervals used by the rolling estimator (60-240 Hz range). */
const MIN_DISPLAY_MS = 4;
const MAX_DISPLAY_MS = DEFAULT_FRAME_MS * 1.25;
const DISPLAY_SAMPLES = 24;
/**
 * Safe primary ceiling: 8.3M RGBA pixels are about 32 MB for one buffer and
 * 96 MB for WebGPU's three-buffer swap-chain cap. WebGL has no memory guard,
 * so the same conservative limit protects both backends.
 */
const MAX_PRIMARY_PIXEL_BUDGET = 8_300_000;
/** rAF intervals per governor decision. */
const PACE_WINDOW = 10;
/** Steady windows in a row before the cap rises. */
const STEADY_WINDOWS = 5;
/** Gaps longer than this are pauses or hitches, not frame time. */
const MAX_INTERVAL_MS = 250;
/** Ticks ignored after the animating set or its quality changes (compiles, hydration). */
const WARMUP_TICKS = 30;
/** Steady windows at the ceiling (~10s) before it lifts a step. */
const CEILING_WINDOWS = 60;

interface Pace {
  /** Most drawing-buffer pixels per frame, over every animating gradient. */
  cap: number;
  /** Pixels per frame that were too slow; the cap never rises back to it. */
  ceiling: number;
  lastTick: number | null;
  intervals: number[];
  /** Ticks left to ignore; see WARMUP_TICKS. */
  warmup: number;
  slowWindows: number;
  steadyWindows: number;
  /** Steady windows in a row spent at the ceiling. */
  ceilingWindows: number;
  /** Learned display interval; starts at the historical 60 Hz target. */
  targetMs: number;
  /** Rolling valid rAF intervals used to learn targetMs. */
  displaySamples: number[];
  /** Quality changes suppress display-rate learning during warm-up. */
  suppressDisplayLearning: boolean;
}

const pace: Pace = {
  cap: Number.POSITIVE_INFINITY,
  ceiling: Number.POSITIVE_INFINITY,
  ceilingWindows: 0,
  intervals: [],
  lastTick: null,
  slowWindows: 0,
  steadyWindows: 0,
  warmup: WARMUP_TICKS,
  targetMs: DEFAULT_FRAME_MS,
  displaySamples: [],
  suppressDisplayLearning: false,
};
/** Pixels rendered per frame at the current quality, for the governor. */
let renderedPixels = 0;
/** Slots animating at the last assignQuality, to notice a change. */
let animatingCount = 0;
let primaryBudget = PRIMARY_PIXEL_BUDGET;
let scrolling = false;
let scrollIdleTimer = 0;
const SCROLL_PIXEL_FACTOR = 0.65;
const SCROLL_IDLE_MS = 150;

/** Starts a fresh measurement after the work per frame changed. */
function restartPace() {
  if (pace.lastTick !== null) pace.suppressDisplayLearning = true;
  pace.warmup = WARMUP_TICKS;
  pace.intervals = [];
  pace.slowWindows = 0;
  pace.steadyWindows = 0;
}

interface QualityGroup {
  slots: [ContextSlot, SlotState][];
  budget: number;
}

/** Shared render scale for one budget group, then each slot's floor. */
function groupScales({ slots: group, budget }: QualityGroup) {
  const total = group.reduce((sum, [slot]) => sum + slot.pixels(), 0);
  const shared =
    total > budget ? Math.max(MIN_RENDER_SCALE, Math.sqrt(budget / total)) : 1;
  let rendered = 0;
  const scales = group.map(([slot]) => {
    const scale = Math.min(1, Math.max(shared, slot.minScale()));
    rendered += slot.pixels() * scale * scale;
    return scale;
  });
  // Small tolerance: the shared scale lands exactly on the budget.
  return { halfRate: rendered > budget * 1.01, rendered, scales };
}

/** Reserve every other live WebGPU lease before growing a primary surface. */
function primarySurfaceBudget() {
  let webgpuPrimary = false;
  let reserved = 0;
  for (const [slot, state] of slots) {
    if ((!state.live && !wantedSlots.has(slot)) || slot.backend() !== "webgpu")
      continue;
    if (slot.primary()) webgpuPrimary = true;
    // Reserve full-size needs, including near but invisible leases. This also
    // allows thumbnails to regain quality without evicting the primary.
    else reserved += slot.pixels();
  }
  return webgpuPrimary
    ? Math.max(0, MAX_PRIMARY_PIXEL_BUDGET - reserved)
    : MAX_PRIMARY_PIXEL_BUDGET;
}

/** Splits the pixel budgets across the gradients that are animating. */
function assignQuality() {
  const animating = [...slots].filter(
    ([slot, state]) => (state.live || wantedSlots.has(slot)) && state.visible,
  );
  const groups: QualityGroup[] = [
    {
      budget:
        Math.min(primaryBudget, primarySurfaceBudget()) *
        (scrolling ? SCROLL_PIXEL_FACTOR : 1),
      slots: animating.filter(([slot]) => slot.primary()),
    },
    {
      budget: pixelBudget * (scrolling ? SCROLL_PIXEL_FACTOR : 1),
      slots: animating.filter(([slot]) => !slot.primary()),
    },
  ];
  let results = groups.map(groupScales);
  const rendered = results.reduce((sum, result) => sum + result.rendered, 0);
  if (rendered > pace.cap) {
    // The governor's cap: shrink each group's budget to its share of it.
    const share = pace.cap / rendered;
    results = groups.map((group, i) =>
      groupScales({
        budget: Math.min(group.budget, results[i]?.rendered ?? 0) * share,
        slots: group.slots,
      }),
    );
  }
  renderedPixels = 0;
  let changed = animating.length !== animatingCount;
  animatingCount = animating.length;
  groups.forEach((group, g) => {
    const result = results[g];
    if (!result) {
      return;
    }
    renderedPixels += result.rendered;
    group.slots.forEach(([slot, state], i) => {
      const scale = result.scales[i] ?? 1;
      const { halfRate } = result;
      if (
        state.quality.scale !== scale ||
        state.quality.halfRate !== halfRate
      ) {
        // Paused primaries may never paint the smaller buffer. Release the
        // old allocation before admission; grant() paints at the new scale.
        if (
          state.live &&
          slot.primary() &&
          slot.backend() === "webgpu" &&
          scale < state.quality.scale
        ) {
          state.live = false;
          slot.revoke();
          scheduleContexts();
        }
        state.quality = { halfRate, scale };
        slot.setQuality(state.quality);
        changed = true;
      }
    });
  });
  if (changed) {
    restartPace();
  }
}

/** Temporarily lowers render work while a scroll is actively moving. */
export function noteScroll(): void {
  if (!scrolling) {
    scrolling = true;
    assignQuality();
  }
  if (
    typeof window !== "undefined" &&
    typeof window.setTimeout === "function"
  ) {
    window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = window.setTimeout(() => {
      scrolling = false;
      assignQuality();
    }, SCROLL_IDLE_MS);
  }
}

/**
 * One decision from a window's mean rAF interval. Not the median: a
 * pipelining browser keeps most ticks on time and drops whole frames.
 */
function judgePace(meanMs: number) {
  const slow = meanMs > pace.targetMs * 1.12;
  pace.slowWindows = slow ? pace.slowWindows + 1 : 0;
  pace.steadyWindows =
    meanMs <= pace.targetMs * 1.05 ? pace.steadyWindows + 1 : 0;
  // Far too slow acts at once; a little slow must repeat, to skip hitches.
  if (slow && (meanMs > pace.targetMs * 2 || pace.slowWindows >= 2)) {
    pace.slowWindows = 0;
    pace.ceilingWindows = 0;
    pace.ceiling = Math.min(pace.ceiling, renderedPixels);
    // Pixel cost is about linear, so aim a little under the target.
    const factor = Math.min(0.9, Math.max(0.5, (pace.targetMs / meanMs) * 0.9));
    pace.cap = Math.min(pace.cap, renderedPixels) * factor;
    scheduleContexts();
    return;
  }
  if (
    pace.steadyWindows < STEADY_WINDOWS ||
    (Number.isFinite(pace.cap) && renderedPixels < pace.cap * 0.98)
  ) {
    return;
  }
  if (!Number.isFinite(pace.cap)) {
    // Keep grids on their existing shared budget. Only the primary group's
    // budget grows, and only while the governor has sustained headroom.
    primaryBudget = Math.min(primarySurfaceBudget(), primaryBudget * 1.2);
    pace.steadyWindows = 0;
    scheduleContexts();
    return;
  }
  pace.steadyWindows = 0;
  const limit = pace.ceiling * 0.9;
  if (pace.cap >= limit) {
    // Held steady at the ceiling for a long while: it may have been set by
    // a passing slowdown, so lift it a step and try again.
    pace.ceilingWindows += STEADY_WINDOWS;
    if (pace.ceilingWindows < CEILING_WINDOWS) {
      return;
    }
    pace.ceilingWindows = 0;
    pace.ceiling *= 1.15;
  }
  pace.cap = Math.min(pace.cap * 1.2, pace.ceiling * 0.9);
  scheduleContexts();
}

function observeDisplayInterval(interval: number) {
  if (interval < MIN_DISPLAY_MS || interval > MAX_DISPLAY_MS) {
    return;
  }
  pace.displaySamples.push(interval);
  if (pace.displaySamples.length > DISPLAY_SAMPLES) {
    pace.displaySamples.shift();
  }
  if (pace.displaySamples.length >= DISPLAY_SAMPLES / 2) {
    // The low quartile tracks the fastest cadence while rejecting a dropped
    // frame, and the rolling window relearns after a monitor/VRR change.
    const sorted = [...pace.displaySamples].sort((a, b) => a - b);
    pace.targetMs =
      sorted[Math.floor((sorted.length - 1) * 0.25)] ?? DEFAULT_FRAME_MS;
  }
}

/** Mounts call this on every animated rAF tick; a shared tick counts once. */
export function noteFrame(now: number): void {
  const last = pace.lastTick;
  if (now === last) {
    return;
  }
  pace.lastTick = now;
  if (last === null) {
    return;
  }
  const interval = now - last;
  const framePaintMs = pendingFramePaintMs;
  pendingFramePaintMs = 0;
  if (interval > MAX_INTERVAL_MS) {
    pace.intervals = [];
    pace.displaySamples = [];
    pace.targetMs = DEFAULT_FRAME_MS;
    return;
  }
  if (!pace.suppressDisplayLearning) observeDisplayInterval(interval);
  if (pace.warmup > 0) {
    pace.warmup -= 1;
    if (pace.warmup === 0) pace.suppressDisplayLearning = false;
    return;
  }
  // A visible animation can be throttled to a low VRR cadence while its
  // paint work is idle. Do not call that a slowdown; heavy paint is judged.
  if (
    interval > pace.targetMs * 2 &&
    framePaintMs > 0 &&
    framePaintMs < pace.targetMs * 0.75
  ) {
    pace.intervals = [];
    return;
  }
  pace.intervals.push(interval);
  if (pace.intervals.length >= PACE_WINDOW) {
    const total = pace.intervals.reduce((sum, ms) => sum + ms, 0);
    judgePace(total / pace.intervals.length);
    pace.intervals = [];
  }
}

function run() {
  frame = 0;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const margin = height * APPROACH_MARGIN;
  const ranked: { slot: ContextSlot; distance: number }[] = [];
  for (const [slot, state] of slots) {
    const rect = slot.element.getBoundingClientRect();
    const distance = distanceToViewport(rect, width, height);
    const hasArea = rect.width > 0 && rect.height > 0;
    const visible = hasArea && distance === 0;
    if (visible !== state.visible) {
      state.visible = visible;
      slot.setVisible(visible);
    }
    // An invisible primary cannot paint a smaller surface to make room for
    // new thumbnails. Release its large WebGPU lease until it is visible.
    const invisiblePrimary =
      !visible && slot.primary() && slot.backend() === "webgpu";
    if (hasArea && distance <= margin && !invisiblePrimary) {
      ranked.push({ distance, slot });
    }
  }
  ranked.sort((a, b) => a.distance - b.distance);
  // Each backend has its own budget (WebGL contexts, WebGPU surfaces), so on
  // a mixed page neither starves the other; nearest first within each. A
  // backend with more near gradients than its budget keeps one back to paint
  // still frames for the rest. The pixel budget below is shared by both.
  const limits: Record<BackendName, number> = {
    webgl2: MAX_LIVE_CONTEXTS,
    webgpu: MAX_WEBGPU_SURFACES,
  };
  const near: Record<BackendName, number> = { webgl2: 0, webgpu: 0 };
  const backends = new Map(ranked.map(({ slot }) => [slot, slot.backend()]));
  for (const name of backends.values()) {
    near[name] += 1;
  }
  const budget = (name: BackendName) =>
    near[name] > limits[name] ? limits[name] - 1 : limits[name];
  const granted: Record<BackendName, number> = { webgl2: 0, webgpu: 0 };
  const wanted = new Set<ContextSlot>();
  const leftover: ContextSlot[] = [];
  for (const { slot } of ranked) {
    const name = backends.get(slot) ?? "webgl2";
    if (granted[name] < budget(name)) {
      granted[name] += 1;
      wanted.add(slot);
    } else {
      leftover.push(slot);
    }
  }
  // Release first so the budget is free before granting.
  for (const [slot, state] of slots) {
    if (state.live && !wanted.has(slot)) {
      state.live = false;
      slot.revoke();
    }
  }
  wantedSlots = wanted;
  // Apply the reservation before admission, so a full-size pending surface
  // does not get denied forever beside an already-grown primary.
  assignQuality();
  for (const slot of wanted) {
    const state = slots.get(slot);
    if (state && !state.live) {
      state.live = slot.grant();
    }
  }
  for (const slot of leftover) {
    slot.paintStill();
  }
  trimContexts(granted.webgl2 + (near.webgl2 > limits.webgl2 ? 1 : 0));
  trimSurfaces(granted.webgpu + (near.webgpu > limits.webgpu ? 1 : 0));
  assignQuality();
}

/** Re-ranks on the next animation frame. Cheap to call often. */
export function scheduleContexts(): void {
  if (frame === 0 && typeof window !== "undefined") {
    frame = window.requestAnimationFrame(run);
  }
}

/** Relearns the display cadence after a visibility, resize, or display change. */
export function relearnDisplayRate(): void {
  pace.displaySamples = [];
  pace.targetMs = DEFAULT_FRAME_MS;
  pace.intervals = [];
}

function onWindowResize() {
  relearnDisplayRate();
  pendingFramePaintMs = 0;
  scheduleContexts();
}

onPoolChange(scheduleContexts);
onWebGPUChange(scheduleContexts);

/** A gradient lost its context (the pool already ended the lease). */
export function slotLostContext(slot: ContextSlot): void {
  const state = slots.get(slot);
  if (state) {
    state.live = false;
  }
  scheduleContexts();
}

function listen(on: boolean) {
  if (on === listening) {
    return;
  }
  listening = on;
  if (on) {
    window.addEventListener("scroll", scheduleContexts, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", noteScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", onWindowResize, { passive: true });
    observer = new IntersectionObserver(scheduleContexts, {
      rootMargin: `${APPROACH_MARGIN * 100}% 0px`,
    });
    for (const slot of slots.keys()) {
      observer.observe(slot.element);
    }
  } else {
    window.removeEventListener("scroll", scheduleContexts, { capture: true });
    window.removeEventListener("scroll", noteScroll, { capture: true });
    window.removeEventListener("resize", onWindowResize);
    observer?.disconnect();
    observer = null;
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
}

export function registerSlot(slot: ContextSlot): void {
  slots.set(slot, {
    live: false,
    quality: { halfRate: false, scale: 1 },
    visible: false,
  });
  listen(true);
  observer?.observe(slot.element);
  scheduleContexts();
}

export function unregisterSlot(slot: ContextSlot): void {
  if (!slots.delete(slot)) {
    return;
  }
  observer?.unobserve(slot.element);
  if (slots.size === 0) {
    listen(false);
    trimContexts(0);
    trimSurfaces(0);
  } else {
    scheduleContexts();
  }
}

/** Changes the per-frame pixel budget (Infinity turns it off). For tuning and the engine lab. */
export function setPixelBudget(pixels: number): void {
  pixelBudget = pixels > 0 ? pixels : PIXEL_BUDGET;
  scheduleContexts();
}

/** The governor's state. For tests and the engine lab. */
export function paceStats(): {
  /** Most pixels per frame; Infinity until frames have been slow. */
  cap: number;
  /** Current rolling display interval estimate in milliseconds. */
  targetMs: number;
  /** Ignoring ticks after the animating set or its quality changed. */
  warmingUp: boolean;
} {
  return { cap: pace.cap, targetMs: pace.targetMs, warmingUp: pace.warmup > 0 };
}

/** Forgets what the governor learned. For tests and the engine lab. */
export function resetPace(): void {
  pace.cap = Number.POSITIVE_INFINITY;
  pace.ceiling = Number.POSITIVE_INFINITY;
  pace.ceilingWindows = 0;
  pace.lastTick = null;
  pace.suppressDisplayLearning = false;
  relearnDisplayRate();
  primaryBudget = PRIMARY_PIXEL_BUDGET;
  scrolling = false;
  if (
    typeof window !== "undefined" &&
    typeof window.clearTimeout === "function"
  ) {
    window.clearTimeout(scrollIdleTimer);
  }
  restartPace();
  scheduleContexts();
}

/** Counts for tests and the engine lab. */
export function contextStats(): {
  /** WebGL contexts that exist right now, never more than MAX_LIVE_CONTEXTS. */
  contexts: number;
  /** WebGPU surfaces that exist right now, never more than MAX_WEBGPU_SURFACES. */
  surfaces: number;
  /** Animating gradients per backend. */
  liveByBackend: Record<BackendName, number>;
  /** Gradients currently animating with a leased context. */
  live: number;
  mounted: number;
  /** Drawing-buffer pixels rendered per frame by animating gradients. */
  pixelsPerFrame: number;
  halfRate: boolean;
} {
  let live = 0;
  let pixelsPerFrame = 0;
  let halfRate = false;
  const liveByBackend: Record<BackendName, number> = { webgl2: 0, webgpu: 0 };
  for (const [slot, state] of slots) {
    if (state.live) {
      live += 1;
      liveByBackend[slot.backend()] += 1;
    }
    if (state.live && state.visible) {
      pixelsPerFrame += slot.pixels() * state.quality.scale ** 2;
      halfRate ||= state.quality.halfRate;
    }
  }
  return {
    contexts: liveContextCount(),
    halfRate,
    live,
    liveByBackend,
    mounted: slots.size,
    pixelsPerFrame: Math.round(pixelsPerFrame),
    surfaces: webgpuStats().surfaces,
  };
}

let paintMs = 0;
let pendingFramePaintMs = 0;
let paintCount = 0;

/** Called by mounts with the time one animated frame took to render and copy. */
export function recordPaint(ms: number): void {
  paintMs += ms;
  pendingFramePaintMs += ms;
  paintCount += 1;
}

/** Paint time totals since the last call, then resets them. For the engine lab. */
export function takePaintStats(): { paints: number; ms: number } {
  const stats = { ms: paintMs, paints: paintCount };
  paintMs = 0;
  paintCount = 0;
  return stats;
}

function engineStats(): EngineStats {
  let scaleTotal = 0;
  let scaleCount = 0;
  let halfRate = false;
  for (const [, state] of slots) {
    if (state.live && state.visible) {
      scaleTotal += state.quality.scale;
      scaleCount += 1;
      halfRate ||= state.quality.halfRate;
    }
  }
  return {
    animatingMounts: animatingCount,
    fpsTier: halfRate ? "half" : "full",
    gpuTimeMs: null,
    mounted: slots.size,
    paceCap: pace.cap,
    rafIntervals: pace.intervals.slice(),
    renderScale: scaleCount === 0 ? 1 : scaleTotal / scaleCount,
    renderedPixels: Math.round(renderedPixels),
    scrolling,
  };
}

if (typeof globalThis.window !== "undefined") {
  globalThis.window.__gcnEngineStats = engineStats;
}
