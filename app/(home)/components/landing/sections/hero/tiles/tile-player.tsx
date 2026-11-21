"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { previewScale } from "@/lib/previews/frame-rate";
import { cn } from "@/lib/utils";
import { COMP_SIZE, FPS, type HeroTilesConfig, PLAYER_INSET } from "./config";

const RATE = previewScale(FPS);

export type TilePlayback =
  | "playing"
  | "paused"
  | "reduced-motion"
  | "offscreen";

type TileComponent = ComponentType<{ config: HeroTilesConfig }>;

type Source =
  | { component: TileComponent; lazyComponent?: never }
  | {
      lazyComponent: () => Promise<{ default: TileComponent }>;
      component?: never;
    };

export function TilePlayer({
  config,
  durationInFrames,
  stillFrame = 0,
  respectReducedMotion = true,
  placeholder,
  onPlayback,
  className,
  ...source
}: Source & {
  config: HeroTilesConfig;
  durationInFrames: number;
  stillFrame?: number;
  respectReducedMotion?: boolean;
  placeholder?: ReactNode;
  onPlayback?: (state: TilePlayback) => void;
  className?: string;
}) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = (useReducedMotion() ?? false) && respectReducedMotion;
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The tile's timeline counts in 30 fps frames; the player runs at the
  // site's rate.
  const total = Math.max(durationInFrames, 1) * RATE;
  const still = Math.min(stillFrame * RATE, total - 1);

  useEffect(() => {
    if (!mounted) return;
    const player = playerRef.current;
    if (reducedMotion || !visible) {
      player?.pause();
      if (reducedMotion) player?.seekTo(still);
      onPlayback?.(reducedMotion ? "reduced-motion" : "offscreen");
      return;
    }
    const ensure = () => {
      const current = playerRef.current;
      if (!current || document.hidden) return;
      if (!current.isPlaying()) current.play();
      onPlayback?.(current.isPlaying() ? "playing" : "paused");
    };
    ensure();
    const id = window.setInterval(ensure, 400);
    return () => window.clearInterval(id);
  }, [mounted, reducedMotion, visible, still, onPlayback]);

  return (
    <span
      ref={containerRef}
      className={cn("relative block shrink-0", className)}
    >
      {!mounted && placeholder}
      {mounted && (
        <span
          className="pointer-events-none absolute block"
          style={{ inset: PLAYER_INSET }}
        >
          <Player
            ref={playerRef}
            {...source}
            inputProps={{ config }}
            durationInFrames={total}
            initialFrame={still}
            fps={FPS * RATE}
            compositionWidth={COMP_SIZE}
            compositionHeight={COMP_SIZE}
            style={{ width: "100%", height: "100%", background: "transparent" }}
            controls={false}
            loop
            initiallyMuted
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
          />
        </span>
      )}
    </span>
  );
}
