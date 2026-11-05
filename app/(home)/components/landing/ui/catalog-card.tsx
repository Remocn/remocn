"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { Clip, nativeDuration } from "../sections/hero/tiles/clips";
import type { ClipSpec } from "../sections/hero/tiles/config";

const FPS = 30;
const HOLD_FRAMES = 45;
const DENSITY = 2;

type Sized = { width: number; height: number };

export function LivePlayer<T extends Record<string, unknown>>({
  component,
  inputProps,
  durationInFrames,
  stillFrame,
  background,
  active = true,
}: {
  component: ComponentType<T & Sized>;
  inputProps: T;
  durationInFrames: number;
  stillFrame: number;
  background?: string;
  /** False keeps it mounted but paused (prepared ahead of its turn). */
  active?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const [size, setSize] = useState<Sized | null>(null);
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => {
      const width = Math.round(node.offsetWidth * DENSITY);
      const height = Math.round(node.offsetHeight * DENSITY);
      if (!width || !height) return;
      setSize((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      {
        rootMargin: "200px",
      },
    );
    observer.observe(node);
    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, []);

  // Every time it becomes active it starts over, as a fresh mount would.
  useEffect(() => {
    if (active) playerRef.current?.seekTo(0);
  }, [active]);

  useEffect(() => {
    if (!size) return;
    const player = playerRef.current;
    if (reduced || !visible || !active) {
      player?.pause();
      if (reduced) player?.seekTo(stillFrame);
      return;
    }
    const ensure = () => {
      const current = playerRef.current;
      if (current && !document.hidden && !current.isPlaying()) current.play();
    };
    ensure();
    const id = window.setInterval(ensure, 400);
    return () => window.clearInterval(id);
  }, [size, reduced, visible, stillFrame, active]);

  return (
    <div ref={boxRef} className="absolute inset-0" style={{ background }}>
      {size && (
        <Player
          ref={playerRef}
          component={component}
          inputProps={{ ...inputProps, ...size }}
          durationInFrames={Math.max(durationInFrames, 1)}
          fps={FPS}
          compositionWidth={size.width}
          compositionHeight={size.height}
          style={{ width: "100%", height: "100%" }}
          controls={false}
          clickToPlay={false}
          loop
          initiallyMuted
          numberOfSharedAudioTags={0}
          acknowledgeRemotionLicense
        />
      )}
    </div>
  );
}

function CardScene({ spec, width, height }: { spec: ClipSpec } & Sized) {
  return <Clip spec={spec} frame={{ width, height }} />;
}

export function CatalogCard({
  spec,
  active,
}: {
  spec: ClipSpec;
  active?: boolean;
}) {
  const native = nativeDuration(spec.name);
  return (
    <LivePlayer
      component={CardScene}
      inputProps={{ spec }}
      durationInFrames={
        spec.end === "run" ? 300 : native - spec.start + HOLD_FRAMES
      }
      stillFrame={Math.round(native * 0.7)}
      background={spec.background}
      active={active}
    />
  );
}
