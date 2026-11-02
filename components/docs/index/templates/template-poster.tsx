"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";

/**
 * A template's live Remotion player, mounted once it nears the viewport and
 * parked on a still frame until "Play preview" is pressed. Pauses off screen.
 */
export function TemplatePoster({
  name,
  still,
  duration,
}: {
  name: string;
  /** Frame shown before playback. */
  still: number;
  /** "0:16" style runtime label. */
  duration: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);
  const entry = registry[name];
  const preview = previewManifest[name];

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([hit]) => {
        if (hit.isIntersecting) setNear(true);
        else playerRef.current?.pause();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Wire play/pause state once the player has mounted.
  useEffect(() => {
    const player = playerRef.current;
    if (!near || !player) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [near]);

  const toggle = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) player.pause();
    else player.play();
  };

  return (
    <div
      ref={boxRef}
      className="relative aspect-video w-full shrink-0 overflow-hidden rounded-control bg-[#0a0a0b]"
    >
      {near && entry && preview && (
        <Player
          ref={playerRef}
          lazyComponent={entry.load}
          inputProps={preview.defaults}
          durationInFrames={preview.durationInFrames}
          fps={preview.fps}
          compositionWidth={preview.compositionWidth}
          compositionHeight={preview.compositionHeight}
          initialFrame={still}
          controls={false}
          clickToPlay={false}
          loop
          initiallyMuted
          acknowledgeRemotionLicense
          style={{ width: "100%", height: "100%" }}
        />
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={!near}
        className="absolute bottom-3 left-3 flex h-11 items-center gap-2 rounded-control-sm bg-[#fafafa] pr-3.5 pl-2 text-ui sm:bottom-4 sm:left-4 sm:h-9 sm:pl-1.5 sm:text-small text-[#0e1012] outline-none transition-colors hover:bg-white focus-visible:ring-3 focus-visible:ring-white/50"
      >
        <span className="flex size-[26px] items-center justify-center rounded-tile bg-[#0e1012]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-2.5 fill-primary-soft"
          >
            <path
              d={playing ? "M6 4h4v16H6zM14 4h4v16h-4z" : "M7 4.5v15l12-7.5Z"}
            />
          </svg>
        </span>
        {playing ? "Pause preview" : "Play preview"}
      </button>
      <span className="absolute right-3 bottom-3 flex h-7 sm:right-4 sm:bottom-4 items-center rounded-tile bg-[#0e1012b3] px-2.5 text-mono leading-4 text-[#fafafa] tabular-nums">
        {duration}
      </span>
    </div>
  );
}
