"use client";

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReelClip } from "../../lib/reel-types";

/**
 * Plays the reel through one <video>: the selected clip, its time, and the
 * play intent that carries across clips (a clip ending starts the next one).
 */
export function useReelPlayer(clips: ReelClip[]) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const pendingSeek = useRef(0);

  const setIntent = useCallback((value: boolean) => {
    playingRef.current = value;
    setPlaying(value);
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setIntent(false));
  }, [setIntent]);

  /** Jump to clip `next`, `at` seconds in. */
  const select = useCallback(
    (next: number, at = 0) => {
      const video = videoRef.current;
      setTime(at);
      if (next === index && video) {
        video.currentTime = at;
        return;
      }
      pendingSeek.current = at;
      setIndex(next);
    },
    [index],
  );

  /** Jump to a position on the whole reel. */
  const seek = useCallback(
    (seconds: number) => {
      const target = clips.findIndex(
        (clip) => seconds < clip.start + clip.duration,
      );
      const next = target === -1 ? clips.length - 1 : target;
      select(next, Math.max(0, seconds - clips[next].start));
    },
    [clips, select],
  );

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playingRef.current) {
      setIntent(false);
      video.pause();
    } else {
      setIntent(true);
      play();
    }
  }, [play, setIntent]);

  // A new clip's source is in: restore the requested offset, keep playing.
  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (pendingSeek.current > 0) video.currentTime = pendingSeek.current;
    pendingSeek.current = 0;
    if (playingRef.current) play();
  }, [play]);

  const onEnded = useCallback(() => {
    if (index < clips.length - 1) select(index + 1);
    else setIntent(false);
  }, [clips.length, index, select, setIntent]);

  // Never keep playing in a background tab or behind a closed lid.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && playingRef.current) {
        setIntent(false);
        videoRef.current?.pause();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [setIntent]);

  const clip = clips[index];

  return {
    videoRef,
    index,
    clip,
    time,
    reelTime: clip.start + time,
    playing,
    select,
    seek,
    toggle,
    videoProps: {
      onLoadedMetadata,
      onEnded,
      onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) =>
        setTime(event.currentTarget.currentTime),
    },
  };
}
