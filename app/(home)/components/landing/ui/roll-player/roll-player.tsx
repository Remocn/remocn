"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  FullscreenButton,
  formatTime,
  PlayButton,
  type Speed,
  SpeedControl,
} from "./roll-buttons";
import {
  type HandleSide,
  RollTimeline,
  type VisibleSeconds,
} from "./roll-timeline";

/** Roll speed at 1× in px/s (layout px): slow enough to read every name. */
const PX_PER_SECOND = 56;
/** Before the first measure: the design's 0:13 roll. */
const FALLBACK_DURATION = 13;
/** The frame's share of the timeline at 1× zoom, as in the design. */
const BASE_FRAME = 0.26;
/** How far the frame can zoom the roll out (smaller) and in (larger). */
const ZOOM_MIN = 0.45;
const ZOOM_MAX = 1.6;
/** Handle keyboard step, as a zoom factor. */
const ZOOM_STEP = 1.1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A dark video player whose screen rolls its content upward, linearly, from
 * the top until the `[data-roll-end]` element sits in the middle of the
 * screen (the whole content when there's none).
 *
 * The frame on the timeline is the stretch of the roll in view. Dragging its
 * handles stretches or squeezes it, and the roll zooms out or in by the same
 * factor (twice as wide, half the size); the running time stays the same. Speed (0.5× / 1× / 2×) and full
 * screen sit next to the timeline.
 *
 * Playback is a ref-held progress (0..1) written straight to `transform`, so
 * React only re-renders when the shown second changes.
 */
export function RollPlayer({
  label,
  children,
}: {
  /** What's playing, for control labels: "credits" → "Pause credits". */
  label: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const brightRef = useRef<HTMLDivElement>(null);

  const progress = useRef(0);
  /** Layout px the roll travels at 1× zoom, and the screen's height. */
  const shiftRef = useRef(0);
  const screenHeightRef = useRef(0);
  const durationRef = useRef(FALLBACK_DURATION);
  const zoomRef = useRef(1);
  const speedRef = useRef<Speed>(1);
  const shownSecond = useRef(0);
  const seeking = useRef(false);
  const handleDrag = useRef<{
    side: HandleSide;
    startX: number;
    startFrame: number;
  } | null>(null);
  const shownFrame = useRef(-1);

  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);
  const [visible, setVisible] = useState<VisibleSeconds>({
    now: FALLBACK_DURATION * BASE_FRAME,
    min: 0,
    max: FALLBACK_DURATION,
  });
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  /** The frame's share of the timeline: wider as the roll zooms out. */
  const frameWidth = useCallback(() => BASE_FRAME / zoomRef.current, []);

  const paint = useCallback(() => {
    const p = progress.current;
    const zoom = zoomRef.current;
    const half = screenHeightRef.current / 2;
    // The roll point at the screen's centre moves from half a screen down the
    // roll to the end; scaling is around the roll's top centre.
    if (rollRef.current) {
      const y = half - zoom * (half + p * shiftRef.current);
      rollRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(${zoom})`;
    }
    // The frame travels the free part of the track; the bright copy of the
    // ruler is clipped to exactly where the frame sits.
    const width = frameWidth();
    const left = p * (1 - width);
    if (frameRef.current) {
      if (width !== shownFrame.current) {
        shownFrame.current = width;
        frameRef.current.style.width = `${width * 100}%`;
      }
      frameRef.current.style.transform = `translateX(${(left / width) * 100}%)`;
    }
    if (brightRef.current) {
      brightRef.current.style.clipPath = `inset(0 ${(1 - left - width) * 100}% 0 ${left * 100}%)`;
    }
    const second = Math.floor(p * durationRef.current);
    if (second !== shownSecond.current) {
      shownSecond.current = second;
      setCurrent(second);
    }
  }, [frameWidth]);

  const seek = useCallback(
    (next: number) => {
      progress.current = clamp(next, 0, 1);
      setEnded(progress.current >= 1);
      paint();
    },
    [paint],
  );

  const publishVisible = useCallback(() => {
    const base = BASE_FRAME * durationRef.current;
    setVisible({
      now: frameWidth() * durationRef.current,
      min: base / ZOOM_MAX,
      max: base / ZOOM_MIN,
    });
  }, [frameWidth]);

  const setZoom = useCallback(
    (zoom: number) => {
      zoomRef.current = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
      publishVisible();
      paint();
    },
    [publishVisible, paint],
  );

  // Measure the roll: it travels until the end element is centred on screen.
  useEffect(() => {
    const screen = screenRef.current;
    const roll = rollRef.current;
    if (!screen || !roll) return;

    const measure = () => {
      const height = screen.clientHeight;
      const end = roll.querySelector<HTMLElement>("[data-roll-end]");
      const endCenter = end
        ? end.offsetTop + end.offsetHeight / 2
        : roll.offsetHeight - height / 2;
      screenHeightRef.current = height;
      shiftRef.current = Math.max(0, endCenter - height / 2);
      durationRef.current = Math.max(1, shiftRef.current / PX_PER_SECOND);
      setDuration(durationRef.current);
      publishVisible();
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    observer.observe(roll);
    return () => observer.disconnect();
  }, [publishVisible, paint]);

  // Autoplay unless the user prefers reduced motion.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!query.matches);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setPlaying(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Only roll while the screen is on screen and the tab is visible.
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(screen);

    const syncVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  // Full screen takes the whole player (screen and controls). Phones that
  // can't put an element in full screen (iPhone Safari) get no button.
  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled);
    const onChange = () =>
      setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Tabbing into a link on the roll pauses it and brings that link on screen.
  useEffect(() => {
    const screen = screenRef.current;
    const roll = rollRef.current;
    if (!screen || !roll) return;
    const onFocusIn = (event: FocusEvent) => {
      const shift = shiftRef.current;
      if (shift === 0 || !(event.target instanceof Element)) return;
      const target = event.target.getBoundingClientRect();
      // Back to layout px: the roll is drawn scaled by the zoom.
      const center =
        (target.top - roll.getBoundingClientRect().top + target.height / 2) /
        zoomRef.current;
      setPlaying(false);
      seek((center - screen.clientHeight / 2) / shift);
    };
    screen.addEventListener("focusin", onFocusIn);
    return () => screen.removeEventListener("focusin", onFocusIn);
  }, [seek]);

  const running = playing && inView && pageVisible;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!seeking.current) {
        progress.current = Math.min(
          1,
          progress.current + (dt * speedRef.current) / durationRef.current,
        );
        paint();
        if (progress.current >= 1) {
          setPlaying(false);
          setEnded(true);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, paint]);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progress.current >= 1) seek(0);
    setPlaying(true);
  };

  const changeSpeed = (next: Speed) => {
    speedRef.current = next;
    setSpeed(next);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      rootRef.current?.requestFullscreen().catch(() => {});
    }
  };

  // Seeking: the pointer sets where the frame's centre is.
  const pointerFraction = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect ? (clientX - rect.left) / rect.width : 0;
  };

  const seekToPointer = (clientX: number) => {
    const width = frameWidth();
    const x = pointerFraction(clientX);
    seek(width >= 1 ? x : (x - width / 2) / (1 - width));
  };

  const onSeekPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    seeking.current = true;
    seekToPointer(event.clientX);
  };

  const onSeekPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (seeking.current) seekToPointer(event.clientX);
  };

  const onSeekPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    seeking.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onSeekKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const second = 1 / durationRef.current;
    const steps: Record<string, number> = {
      ArrowRight: second,
      ArrowUp: second,
      ArrowLeft: -second,
      ArrowDown: -second,
      PageUp: 5 * second,
      PageDown: -5 * second,
    };
    if (event.key === "Home") seek(0);
    else if (event.key === "End") seek(1);
    else if (event.key in steps) seek(progress.current + steps[event.key]);
    else return;
    event.preventDefault();
  };

  // Dragging a handle: the frame sits at `p * (1 - width)`, so each unit of
  // extra width moves its start edge by `-p` and its end edge by `1 - p`.
  // Dividing the pointer's travel by that keeps the dragged handle under the
  // pointer. Next to the end the frame is pinned to, that edge barely moves,
  // so the drag stretches both sides evenly instead.
  const onHandlePointerDown = (
    side: HandleSide,
    event: ReactPointerEvent<HTMLSpanElement>,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleDrag.current = {
      side,
      startX: pointerFraction(event.clientX),
      startFrame: frameWidth(),
    };
  };

  const onHandlePointerMove = (
    _: HandleSide,
    event: ReactPointerEvent<HTMLSpanElement>,
  ) => {
    const drag = handleDrag.current;
    if (!drag) return;
    const delta = pointerFraction(event.clientX) - drag.startX;
    const p = progress.current;
    const rate = drag.side === "end" ? 1 - p : -p;
    const width =
      drag.startFrame +
      (Math.abs(rate) < 0.15
        ? (drag.side === "end" ? 2 : -2) * delta
        : delta / rate);
    if (width <= 0) return;
    setZoom(BASE_FRAME / width);
  };

  const onHandlePointerUp = (
    _: HandleSide,
    event: ReactPointerEvent<HTMLSpanElement>,
  ) => {
    if (!handleDrag.current) return;
    handleDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    sharpen();
  };

  // ArrowRight / Up widens the frame (more on screen, smaller).
  const onHandleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const steps: Record<string, number> = {
      ArrowRight: 1 / ZOOM_STEP,
      ArrowUp: 1 / ZOOM_STEP,
      ArrowLeft: ZOOM_STEP,
      ArrowDown: ZOOM_STEP,
    };
    if (event.key === "Home") setZoom(1);
    else if (event.key in steps) setZoom(zoomRef.current * steps[event.key]);
    else return;
    event.preventDefault();
    sharpen();
  };

  // A layer promoted with will-change keeps the raster scale it was first
  // drawn at, so zoomed-in text would stay blurry. Dropping the hint for a
  // frame makes the browser redraw it at the new scale.
  const sharpen = () => {
    const roll = rollRef.current;
    if (!roll) return;
    roll.style.willChange = "auto";
    requestAnimationFrame(() => {
      roll.style.willChange = "transform";
    });
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-col gap-2 bg-dark-surface p-2 sm:gap-3 sm:p-3",
        fullscreen ? "h-full rounded-none" : "rounded-panel sm:rounded-shell",
      )}
    >
      <div
        ref={screenRef}
        className={cn(
          "relative overflow-clip rounded-card bg-[#060708]",
          fullscreen ? "min-h-0 flex-1" : "h-[480px] lg:aspect-video lg:h-auto",
        )}
      >
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_56px,#000_calc(100%-56px),transparent)]">
          <div
            ref={rollRef}
            className="relative origin-top will-change-transform"
          >
            {children}
          </div>
        </div>
      </div>

      {/* Phones: the timeline takes its own row above the buttons. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-capsule bg-dark-surface p-3 sm:h-16 sm:flex-nowrap sm:gap-3 sm:py-0">
        <PlayButton
          playing={playing}
          ended={ended}
          label={label}
          onClick={toggle}
        />
        <span className="shrink-0 text-mono text-dark-body tabular-nums max-sm:mr-auto">
          {formatTime(current)} / {formatTime(Math.round(duration))}
        </span>
        <RollTimeline
          className="max-sm:order-first max-sm:basis-full"
          label={label}
          current={current}
          duration={duration}
          visible={visible}
          trackRef={trackRef}
          frameRef={frameRef}
          brightRef={brightRef}
          onSeekKeyDown={onSeekKeyDown}
          onSeekPointerDown={onSeekPointerDown}
          onSeekPointerMove={onSeekPointerMove}
          onSeekPointerUp={onSeekPointerUp}
          onHandlePointerDown={onHandlePointerDown}
          onHandlePointerMove={onHandlePointerMove}
          onHandlePointerUp={onHandlePointerUp}
          onHandleKeyDown={onHandleKeyDown}
        />
        <SpeedControl speed={speed} onChange={changeSpeed} />
        {canFullscreen && (
          <FullscreenButton active={fullscreen} onClick={toggleFullscreen} />
        )}
      </div>
    </div>
  );
}
