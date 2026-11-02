import type { BackendLease, GradientBackend } from "./backend";
import { backendFor } from "./backend";
import { hasCssVariable, resolveColor, srgbToOklab } from "./color";
import { staticFallbackCss } from "./fallback";
import { fullTarget, LIVE_FPS, LOOP_RADIUS, loopPhase } from "./loop";
import { mergeParams, normalizeParams } from "./params";
import type { ContextSlot, FrameQuality } from "./scheduler";
import {
  GRAIN_CRISP,
  MIN_RENDER_SCALE,
  noteFrame,
  recordPaint,
  registerSlot,
  relearnDisplayRate,
  scheduleContexts,
  slotLostContext,
  unregisterSlot,
} from "./scheduler";
import type { FrameInput, GradientParams } from "./types";

export interface MountOptions {
  /** Device pixel ratio cap. Default 1.5. */
  maxDpr?: number;
  /** "respect" renders one still frame when the user prefers reduced motion. Default "respect". */
  reducedMotion?: "respect" | "ignore";
  /** The page's one hero canvas: renders from PRIMARY_PIXEL_BUDGET, not the shared one. Default false. */
  primary?: boolean;
}

export interface MountedGradient {
  setParams(p: Partial<GradientParams>): void;
  unmount(): void;
}

/**
 * Live, on-page gradient. Owns canvas sizing (ResizeObserver, DPR capped at
 * maxDpr), rAF, pausing offscreen or when the document is hidden, smoothed
 * pointer and scroll-velocity influence, reduced motion, theme colour
 * re-resolution and its share of the page's WebGL context budget.
 *
 * The canvas gets a 2D context. Frames are rendered in a leased GPU
 * surface (WebGPU, or a WebGL context from the shared pool; see backend.ts)
 * and copied over, so a suspended gradient
 * keeps its last frame and never shows the browser's lost-context box.
 * Behind it, the canvas background is `staticFallbackCss`, which is what
 * shows when WebGL2 is unavailable.
 */
export function mountGradient(
  canvas: HTMLCanvasElement,
  params: GradientParams,
  options: MountOptions = {},
): MountedGradient {
  const maxDpr = options.maxDpr ?? 1.5;
  let current = normalizeParams(params);
  let lease: BackendLease | null = null;
  /** The backend `lease` came from; picked per kind when a lease is taken. */
  let leaseBackend: GradientBackend = backendFor(current.kind);
  /** The 2D canvas shows a frame that matches the current params and theme. */
  let fresh = false;
  let visible = false;
  let raf = 0;
  let lastNow: number | null = null;
  let time = 0;
  let phase = 0;
  /** Bumped whenever params or resolved colours change. */
  let version = 0;
  /** Render scale and frame rate from the shared pixel budget. */
  let quality: FrameQuality = { halfRate: false, scale: 1 };
  let skipNext = false;

  const display = canvas.getContext("2d");
  /** Pixels a frame renders at, at this render scale. */
  const renderPixels = (scale: number) =>
    Math.max(1, Math.round(canvas.width * scale)) *
    Math.max(1, Math.round(canvas.height * scale));
  const initialBackground = canvas.style.background;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () =>
    options.reducedMotion !== "ignore" && motionQuery.matches;

  // Pointer and scroll targets, eased toward in the frame loop.
  const pointerTarget = { strength: 0, x: 0.5, y: 0.5 };
  const pointer = { strength: 0, x: 0.5, y: 0.5 };
  let scrollImpulse = 0;
  let scrollVelocity = 0;
  let lastScroll = { t: performance.now(), y: window.scrollY };

  const resolver = (value: string) =>
    srgbToOklab(resolveColor(value, canvas.isConnected ? canvas : null));

  const applyBackground = () => {
    canvas.style.background = staticFallbackCss(current);
  };

  const frameInput = (): FrameInput => {
    if (reduced()) {
      return { frameIndex: 0, timeSeconds: 0 };
    }
    const input: FrameInput = {
      frameIndex: Math.floor(time * LIVE_FPS),
      timeSeconds: time,
    };
    if (current.drift !== undefined) {
      input.phase = phase;
    }
    if (pointer.strength > 0.001) {
      input.pointer = { ...pointer };
    }
    if (Math.abs(scrollVelocity) > 0.001) {
      input.scroll = { velocity: scrollVelocity };
    }
    return input;
  };

  /** Renders one frame with a pooled context and copies it onto the canvas. */
  const paintWith = (context: BackendLease, frame: FrameInput, scale = 1) => {
    if (!display || context.isLost() || canvas.width === 0) {
      return;
    }
    if (context.loaded?.owner !== slot || context.loaded.version !== version) {
      context.resolver = resolver;
      context.setParams(current);
      context.loaded = { owner: slot, version };
    }
    // Over the pixel budget, render smaller and let drawImage upscale.
    const width = Math.max(1, Math.round(canvas.width * scale));
    const height = Math.max(1, Math.round(canvas.height * scale));
    context.renderFrame(frame, fullTarget(width, height));
    if (context.isLost()) {
      return;
    }
    display.clearRect(0, 0, canvas.width, canvas.height);
    // Upscaling smooths pixel-cell kinds into blur; keep their cells crisp.
    display.imageSmoothingEnabled = !(
      current.kind === "dither-field" || current.dither.enabled
    );
    // Copying right after queue.submit() is safe: reading a WebGPU canvas
    // (drawImage included) runs "get a copy of the image contents of a
    // context", which first ensures all submitted work has finished writing the
    // current texture (https://gpuweb.github.io/gpuweb/#abstract-opdef-get-a-copy-of-the-image-contents-of-a-context,
    // via #canvas-hooks). The engine lab checks it: heavy kinds at 2560x1440,
    // each frame copied the moment it is submitted, never stale or blank.
    display.drawImage(
      context.canvas,
      0,
      context.sourceY,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    fresh = true;
  };

  const draw = () => {
    if (lease) {
      const start = performance.now();
      paintWith(lease, frameInput(), quality.scale);
      recordPaint(performance.now() - start);
    }
  };

  /** Drops a stale frame so the theme-aware CSS fallback shows instead. */
  const invalidate = () => {
    version += 1;
    fresh = false;
    if (!lease) {
      display?.clearRect(0, 0, canvas.width, canvas.height);
      scheduleContexts();
    }
  };

  const shouldAnimate = () =>
    lease !== null && visible && !document.hidden && !reduced();

  const tick = (now: number) => {
    raf = 0;
    noteFrame(now);
    const dt = lastNow === null ? 0 : Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    time += dt;
    if (current.drift !== undefined) {
      phase += (dt * current.speed * 2 * Math.PI) / current.loopSeconds;
      phase %= 2 * Math.PI;
    }
    const ease = 1 - Math.exp(-dt * 6);
    pointer.x += (pointerTarget.x - pointer.x) * ease;
    pointer.y += (pointerTarget.y - pointer.y) * ease;
    pointer.strength += (pointerTarget.strength - pointer.strength) * ease;
    scrollImpulse *= Math.exp(-dt * 7);
    scrollVelocity +=
      (scrollImpulse - scrollVelocity) * (1 - Math.exp(-dt * 5));
    // At half rate, time still advances every frame; only drawing skips.
    skipNext = quality.halfRate && !skipNext;
    if (!skipNext) {
      draw();
    }
    if (shouldAnimate()) {
      raf = window.requestAnimationFrame(tick);
    }
  };

  /** Starts or stops the frame loop to match the current state. */
  const sync = () => {
    if (shouldAnimate()) {
      if (raf === 0) {
        lastNow = null;
        raf = window.requestAnimationFrame(tick);
      }
      return;
    }
    if (raf !== 0) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
    draw();
  };

  const slot: ContextSlot = {
    element: canvas,
    grant() {
      if (lease) {
        return true;
      }
      if (!display) {
        return false;
      }
      leaseBackend = backendFor(current.kind);
      // Still probing or compiling: no lease yet; the scheduler re-runs when ready.
      lease = leaseBackend.supports(current.kind)
        ? leaseBackend.acquire(onLost, renderPixels(quality.scale))
        : null;
      if (!lease) {
        if (leaseBackend.unsupported()) {
          unregisterSlot(slot);
        }
        return false;
      }
      draw();
      sync();
      return true;
    },
    primary() {
      return options.primary === true;
    },
    minScale() {
      if (current.dither.enabled) {
        return 1;
      }
      return current.grain >= GRAIN_CRISP ? 0.8 : MIN_RENDER_SCALE;
    },
    pixels() {
      return canvas.width * canvas.height;
    },
    backend() {
      return backendFor(current.kind).name;
    },
    setQuality(next) {
      quality = next;
      // Readable in devtools and by the engine lab's checks.
      canvas.dataset.renderScale = next.scale.toFixed(3);
    },
    paintStill() {
      if (lease || fresh || !display) {
        return;
      }
      const backend = backendFor(current.kind);
      const painter = backend.supports(current.kind)
        ? backend.acquire(null, renderPixels(1))
        : null;
      if (!painter) {
        return;
      }
      paintWith(painter, frameInput());
      backend.release(painter);
    },
    revoke() {
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      if (lease) {
        leaseBackend.release(lease);
        lease = null;
      }
    },
    setVisible(next) {
      visible = next;
      sync();
    },
  };

  /**
   * The pool lost our context and already ended the lease. Keep the last
   * frame on screen and let the scheduler find another context; it re-runs
   * again when the lost one is restored.
   */
  function onLost() {
    lease = null;
    if (raf !== 0) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
    slotLostContext(slot);
  }

  const resize = () => {
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      // Resizing clears the canvas.
      fresh = false;
      draw();
      relearnDisplayRate();
    }
    scheduleContexts();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (current.interaction.pointer <= 0) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const inside = x >= -0.1 && x <= 1.1 && y >= -0.1 && y <= 1.1;
    pointerTarget.strength = inside ? 1 : 0;
    if (inside) {
      pointerTarget.x = x;
      pointerTarget.y = y;
    }
  };
  const onPointerLeave = () => {
    pointerTarget.strength = 0;
  };
  const onScroll = () => {
    const now = performance.now();
    const dt = Math.max(1, now - lastScroll.t) / 1000;
    const dy = window.scrollY - lastScroll.y;
    lastScroll = { t: now, y: window.scrollY };
    if (current.interaction.scroll <= 0) {
      return;
    }
    // Viewport heights per second, so the feel is the same on every screen.
    const velocity = dy / Math.max(1, window.innerHeight) / dt;
    scrollImpulse = Math.max(-6, Math.min(6, velocity));
  };
  const onVisibility = () => {
    relearnDisplayRate();
    sync();
  };
  const onMotionChange = () => {
    time = 0;
    phase = 0;
    invalidate();
    sync();
  };
  const themeObserver = new MutationObserver(() => {
    if (!hasCssVariable([...current.colors, current.background])) {
      return;
    }
    invalidate();
    draw();
  });
  const resizeObserver = new ResizeObserver(resize);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  motionQuery.addEventListener("change", onMotionChange);
  themeObserver.observe(document.documentElement, {
    attributeFilter: ["class", "style"],
    attributes: true,
  });
  resizeObserver.observe(canvas);

  applyBackground();
  canvas.dataset.renderScale = quality.scale.toFixed(3);
  resize();
  if (display) {
    registerSlot(slot);
  }

  return {
    setParams(patch) {
      const speedChanged =
        patch.speed !== undefined && patch.speed !== current.speed;
      const enteringPinnedPath = speedChanged && current.drift === undefined;
      const fullParamsPatch =
        "kind" in patch && "colors" in patch && "speed" in patch;
      const nextPatch: Partial<GradientParams> = enteringPinnedPath
        ? { ...patch, drift: current.speed * LOOP_RADIUS }
        : current.drift !== undefined &&
            patch.drift === undefined &&
            !fullParamsPatch
          ? { ...patch, drift: current.drift }
          : patch;
      if (enteringPinnedPath) {
        // Legacy frames use the angle once around the loop. Keep that angle
        // while switching to the pinned path so the first edit cannot jump.
        phase = loopPhase(time, current.loopSeconds);
      }
      current = mergeParams(current, nextPatch);
      applyBackground();
      if (lease && backendFor(current.kind) !== leaseBackend) {
        // The new kind draws with the other backend: give the lease back and
        // let the scheduler grant one from the right backend.
        slot.revoke();
        slotLostContext(slot);
      }
      invalidate();
      draw();
    },
    unmount() {
      slot.revoke();
      unregisterSlot(slot);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
      display?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.background = initialBackground;
      delete canvas.dataset.renderScale;
    },
  };
}
