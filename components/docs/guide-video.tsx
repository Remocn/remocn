"use client";

import { useEffect, useRef, useState } from "react";
import {
  guidePanel,
  PauseIcon,
  PlayIcon,
} from "@/components/docs/guides/guide-ui";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Hero player of a video guide: the finished video on a dark stage, a
 * play key and a time ruler with a scrubbable playhead.
 * Plays muted on loop while on screen; reduced motion keeps it paused.
 */
export function GuideVideo({
  src,
  poster,
  label,
  duration: durationHint = 35,
  fps = 30,
}: {
  src: string;
  poster?: string;
  label?: string;
  /** Seconds, used for the ruler until the video's metadata loads. */
  duration?: number;
  fps?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationHint);
  const userPaused = useRef(false);
  const headRef = useRef<HTMLSpanElement>(null);

  // Autoplay only while the player is on screen, never under reduced motion,
  // and not again once the reader has paused it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
        else if (!userPaused.current) void video.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // timeupdate fires ~4 times a second, so the playhead would step; while
  // playing it follows the video every frame without re-rendering.
  useEffect(() => {
    const video = videoRef.current;
    const head = headRef.current;
    if (!playing || !video || !head || duration <= 0) return;
    let raf = 0;
    const follow = () => {
      head.style.left = rulerLeft(Math.min(video.currentTime / duration, 1));
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  const progress = duration > 0 ? Math.min(time / duration, 1) : 0;
  const marks = rulerMarks(duration);

  return (
    <div
      className={cn(
        "not-prose mt-6 flex flex-col gap-2 rounded-card p-2",
        guidePanel,
      )}
    >
      <div className="aspect-video overflow-hidden rounded-control-sm bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          aria-label={label}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
          className="size-full object-cover"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 py-1.5 sm:flex-nowrap">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="flex size-10 shrink-0 items-center justify-center rounded-control-sm bg-white text-[#0e1012] transition-colors hover:bg-[#ececee] focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="shrink-0 font-sans text-caption text-[#fafafa] tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>

        <div className="relative order-last h-10 basis-full rounded-control-sm bg-dark-raised sm:order-none sm:grow sm:basis-0">
          {marks.map((mark) => (
            <span
              key={mark.t}
              aria-hidden="true"
              className={cn(
                "absolute top-1/2 -translate-y-1/2",
                mark.label
                  ? "text-caption text-dark-subtle"
                  : "h-2.5 w-px bg-white/14",
                mark.edge === "end" && "-translate-x-full",
                !mark.edge && "-translate-x-1/2",
              )}
              style={{ left: rulerLeft(mark.t / duration) }}
            >
              {mark.label}
            </span>
          ))}
          <span
            ref={headRef}
            aria-hidden="true"
            className="absolute top-1.5 h-7 w-[3px] -translate-x-1/2 rounded-[2px] bg-white"
            style={{ left: rulerLeft(progress) }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={1 / fps}
            value={time}
            aria-label="Seek"
            aria-valuetext={formatTime(time)}
            onChange={(e) => {
              const video = videoRef.current;
              const next = Number(e.currentTarget.value);
              if (video) video.currentTime = next;
              setTime(next);
            }}
            className="seek-range absolute inset-0 size-full rounded-control-sm opacity-0 [--seek-thumb:28px] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          />
        </div>
      </div>
    </div>
  );
}

/** 14px inner padding on both ends of the ruler. */
function rulerLeft(fraction: number) {
  return `calc(14px + (100% - 28px) * ${fraction})`;
}

/** Labels every 10s plus the end, with a tick every ~5s between them. */
function rulerMarks(duration: number) {
  const end = Math.round(duration);
  const stops: number[] = [];
  for (let t = 0; t < end; t += 10) stops.push(t);
  if (end - stops[stops.length - 1] < 3) stops.pop();
  stops.push(end);

  const marks: { t: number; label?: string; edge?: "start" | "end" }[] = [];
  stops.forEach((t, i) => {
    const edge = i === 0 ? "start" : i === stops.length - 1 ? "end" : undefined;
    marks.push({ t, label: `${t}s`, edge });
    const next = stops[i + 1];
    if (next === undefined) return;
    const ticks = Math.max(1, Math.round((next - t) / 5));
    for (let k = 1; k <= ticks; k++) {
      marks.push({ t: t + ((next - t) * k) / (ticks + 1) });
    }
  });
  return marks.map((m) => ({ ...m, t: Math.min(m.t, duration) }));
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
