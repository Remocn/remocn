"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import { PauseGlyph, PlayGlyph } from "../../components/site-page/play-glyph";

/**
 * The screening-room player: the video on a dark stage, a white play key,
 * the elapsed / total time, a ruler with a scrubbable playhead and the beat
 * count. Plays only on request; nothing autoplays.
 */
export function ScreeningPlayer({
  src,
  poster,
  label,
  duration: durationHint,
  beats,
  className,
}: {
  src: string;
  poster?: string | null;
  label: string;
  /** Seconds, known on the server; replaced by the video's own metadata. */
  duration: number | null;
  beats: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);

  // `timeupdate` fires about four times a second, too coarse for the
  // playhead, so it is painted from the video's own clock every frame.
  const paintHead = useCallback(() => {
    const video = videoRef.current;
    const ruler = rulerRef.current;
    const head = headRef.current;
    if (!video || !ruler || !head || duration <= 0) return;
    const progress = Math.min(video.currentTime / duration, 1);
    head.style.transform = `translateX(${(ruler.clientWidth - 19) * progress}px)`;
  }, [duration]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: repaint when a seek or `timeupdate` moves the time
  useLayoutEffect(() => {
    paintHead();
  }, [time, paintHead]);

  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const observer = new ResizeObserver(paintHead);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, [paintHead]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      paintHead();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, paintHead]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[18px] bg-dark-surface p-2 md:gap-2.5 md:rounded-card md:p-2.5",
        className,
      )}
    >
      <div className="aspect-video overflow-hidden rounded-[10px] bg-dark-raised md:rounded-control-sm">
        {/* biome-ignore lint/a11y/useMediaCaption: the CDN videos ship without caption tracks */}
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          aria-label={label}
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onClick={toggle}
          className="size-full cursor-pointer object-cover"
        />
      </div>

      <div className="flex h-10 items-center gap-2.5 md:gap-3.5 md:pr-1">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fafafa] outline-none after:absolute after:-inset-0.5 transition-[background-color,translate] duration-150 ease-out hover:bg-white focus-visible:ring-3 focus-visible:ring-white/40 active:translate-y-px"
        >
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </button>
        <span className="shrink-0 text-caption text-dark-body tabular-nums">
          {formatDuration(time)} / {formatDuration(duration)}
        </span>

        <div
          ref={rulerRef}
          className="relative flex h-10 min-w-0 grow items-center justify-between overflow-hidden rounded-[10px] bg-dark-raised pr-2.5 pl-4 md:pr-4 md:pl-[22px]"
        >
          {duration > 0 && <RulerLabels duration={duration} />}
          <span
            ref={headRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-2 h-6 w-[3px] rounded-[2px] bg-[#fafafa]"
          />
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={time}
            aria-label="Seek"
            aria-valuetext={formatDuration(time)}
            onChange={(e) => {
              const next = Number(e.currentTarget.value);
              if (videoRef.current) videoRef.current.currentTime = next;
              setTime(next);
            }}
            className="seek-range absolute inset-0 size-full opacity-0 [--seek-thumb:19px] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          />
        </div>

        {beats > 0 && (
          <span className="shrink-0 text-caption text-dark-body">
            {beats} beats
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Seconds along the ruler: every 10s plus the end on desktop (with hairline
 * separators), start / a third / end on mobile.
 */
function RulerLabels({ duration }: { duration: number }) {
  const end = Math.round(duration);
  const stops: number[] = [];
  for (let t = 0; t < end; t += 10) stops.push(t);
  if (stops.length > 1 && end - stops[stops.length - 1] <= 5) stops.pop();
  stops.push(end);
  const third = Math.round(end / 30) * 10;
  const compact = new Set([0, third, end]);

  return stops.map((t, index) => (
    <span key={t} aria-hidden="true" className="contents">
      {index > 0 && (
        <span className="hidden h-3 w-px shrink-0 bg-[#3a3e42] md:block" />
      )}
      <span
        className={cn(
          "text-caption tabular-nums",
          index === 0 ? "text-[#fafafa]" : "text-dark-body",
          !compact.has(t) && "max-md:hidden",
        )}
      >
        {t}s
      </span>
    </span>
  ));
}
