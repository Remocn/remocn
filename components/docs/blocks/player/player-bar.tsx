"use client";

import type { CallbackListener, PlayerRef } from "@remotion/player";
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { formatTime } from "@/app/(home)/components/landing/ui/roll-player/roll-buttons";
import { PlayerRuler } from "./player-ruler";

function PlayKey({
  playing,
  label,
  onClick,
}: {
  playing: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${playing ? "Pause" : "Play"} ${label}`}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control-sm bg-white text-dark-surface outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-white/50 active:translate-y-px max-md:size-11"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
        {playing ? (
          <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" />
        ) : (
          <path d="M6 3.5v17l14.5-8.5Z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}

/**
 * Transport under the stage: play/pause, elapsed time and the seek ruler.
 * Listens to the Remotion Player's own events, so clicking the stage or the
 * space bar stay in sync with the button.
 */
export function PlayerBar({
  label,
  playerRef,
  mounted,
  onMount,
  durationInFrames,
  fps,
}: {
  label: string;
  playerRef: RefObject<PlayerRef | null>;
  mounted: boolean;
  onMount: () => void;
  durationInFrames: number;
  fps: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [second, setSecond] = useState(0);
  const wantsPlay = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const brightRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const lastFrame = Math.max(durationInFrames - 1, 1);
  const duration = durationInFrames / fps;

  const paint = useCallback(
    (frame: number) => {
      const progress = Math.min(Math.max(frame / lastFrame, 0), 1);
      const clip = `inset(0 ${(1 - progress) * 100}% 0 0 round 8px)`;
      if (frameRef.current) frameRef.current.style.clipPath = clip;
      if (brightRef.current) brightRef.current.style.clipPath = clip;
      if (headRef.current) {
        headRef.current.style.transform = `translateX(${progress * 100}%)`;
      }
      setSecond(Math.floor(frame / fps));
    },
    [lastFrame, fps],
  );

  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    let detach: (() => void) | null = null;

    const attach = () => {
      const player = playerRef.current;
      if (!player) {
        raf = requestAnimationFrame(attach);
        return;
      }
      // Frames land at the clip's fps (30), which steps the playhead ~20px at
      // a time on a wide ruler; while playing it glides between them on
      // display refresh, never more than one frame ahead.
      let glide = 0;
      let last = { frame: player.getCurrentFrame(), at: performance.now() };
      const step = () => {
        const ahead = Math.min(((performance.now() - last.at) / 1000) * fps, 1);
        paint(Math.min(last.frame + ahead, lastFrame));
        glide = requestAnimationFrame(step);
      };
      const stop = () => {
        cancelAnimationFrame(glide);
        glide = 0;
      };
      const onFrame: CallbackListener<"frameupdate"> = (e) => {
        last = { frame: e.detail.frame, at: performance.now() };
        if (!glide) paint(e.detail.frame);
      };
      const onSeek: CallbackListener<"seeked"> = (e) => {
        last = { frame: e.detail.frame, at: performance.now() };
        paint(e.detail.frame);
      };
      const onPlay = () => {
        setPlaying(true);
        last = { frame: player.getCurrentFrame(), at: performance.now() };
        if (!glide) glide = requestAnimationFrame(step);
      };
      const onPause = () => {
        setPlaying(false);
        stop();
        paint(player.getCurrentFrame());
      };
      player.addEventListener("frameupdate", onFrame);
      player.addEventListener("seeked", onSeek);
      player.addEventListener("play", onPlay);
      player.addEventListener("pause", onPause);
      player.addEventListener("ended", onPause);
      if (player.isPlaying()) onPlay();
      else paint(player.getCurrentFrame());
      if (wantsPlay.current) {
        wantsPlay.current = false;
        player.play();
      }
      detach = () => {
        stop();
        player.removeEventListener("frameupdate", onFrame);
        player.removeEventListener("seeked", onSeek);
        player.removeEventListener("play", onPlay);
        player.removeEventListener("pause", onPause);
        player.removeEventListener("ended", onPause);
      };
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      detach?.();
    };
  }, [mounted, playerRef, paint, fps, lastFrame]);

  const toggle = () => {
    if (!mounted) {
      wantsPlay.current = true;
      onMount();
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    // Autoplay runs muted; an explicit play brings template soundtracks in.
    if (!player.isPlaying() && player.isMuted()) player.unmute();
    player.toggle();
  };

  const seekTo = (frame: number) => {
    const player = playerRef.current;
    if (!player) return;
    const target = Math.round(Math.min(Math.max(frame, 0), lastFrame));
    player.seekTo(target);
    paint(target);
  };

  // Scrubbing pauses playback and resumes it on release if it was running.
  const scrub = useRef<{ resume: boolean } | null>(null);
  // Measured on the head's parent: the head itself is translated by the
  // progress, so its own box drifts right as the clip plays.
  const frameAt = (clientX: number) => {
    const box = headRef.current?.parentElement?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return ((clientX - box.left) / box.width) * lastFrame;
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!mounted) onMount();
    const player = playerRef.current;
    if (!player) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    scrub.current = { resume: player.isPlaying() };
    player.pause();
    seekTo(frameAt(event.clientX));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (scrub.current) seekTo(frameAt(event.clientX));
  };
  const onPointerUp = () => {
    if (scrub.current?.resume) playerRef.current?.play();
    scrub.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      toggle();
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    const frame = player.getCurrentFrame();
    const stepBy = event.shiftKey ? 1 : fps;
    const next: Record<string, number> = {
      ArrowRight: frame + stepBy,
      ArrowUp: frame + stepBy,
      ArrowLeft: frame - stepBy,
      ArrowDown: frame - stepBy,
      Home: 0,
      End: lastFrame,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    seekTo(next[event.key]);
  };

  const time = (
    <span className="shrink-0 text-mono text-[#fafafa] tabular-nums max-md:text-caption">
      {formatTime(second)} / {formatTime(duration)}
    </span>
  );

  return (
    <div className="flex flex-col gap-1.5 py-1.5 max-md:pt-1 max-md:pb-0.5">
      <div className="flex items-center gap-2">
        <PlayKey playing={playing} label={label} onClick={toggle} />
        <span className="contents max-md:hidden">{time}</span>
        <PlayerRuler
          label={label}
          duration={duration}
          current={second}
          trackRef={trackRef}
          frameRef={frameRef}
          brightRef={brightRef}
          headRef={headRef}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
      <div className="flex items-center px-1 md:hidden">{time}</div>
    </div>
  );
}
