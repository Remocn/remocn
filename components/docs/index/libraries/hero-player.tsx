"use client";

import { Player, type PlayerRef } from "@remotion/player";
import {
  type ComponentType,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useInView } from "./use-in-view";

const DENSITY = 1.5;

type Sized = { width: number; height: number };
// biome-ignore lint/suspicious/noExplicitAny: loaded Remotion composition, props vary
type AnyComponent = ComponentType<any>;

/**
 * A full-bleed looping preview for a library hero. The composition is sized to
 * the box (so shaders and filters fill it edge to edge, no letterbox), plays
 * while on screen and holds a still under reduced motion.
 */
export function HeroPlayer({
  load,
  inputProps,
  durationInFrames,
  fps = 30,
  stillFrame = 0,
  composition,
  playerRef: externalRef,
  onFrame,
}: {
  load: () => Promise<{ default: AnyComponent }>;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
  fps?: number;
  stillFrame?: number;
  /**
   * Fixed composition size, covered into the box instead of sized to it (for
   * components whose type scale is tuned to their composition, like captions).
   * Expects a box narrower than the composition's aspect.
   */
  composition?: Sized;
  playerRef?: RefObject<PlayerRef | null>;
  onFrame?: (frame: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const ownRef = useRef<PlayerRef>(null);
  const playerRef = externalRef ?? ownRef;
  const [size, setSize] = useState<Sized | null>(null);
  const inView = useInView(boxRef, "0px");
  const reduced = usePrefersReducedMotion();

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
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // play() is a no-op until the lazy composition has loaded, so keep nudging
  // while the hero is on screen (same approach as the landing players).
  useEffect(() => {
    const player = playerRef.current;
    if (!size) return;
    if (!inView || reduced) {
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
  }, [inView, reduced, size, stillFrame, playerRef]);

  useEffect(() => {
    const player = playerRef.current;
    if (!size || !player || !onFrame) return;
    const listener: Parameters<PlayerRef["addEventListener"]>[1] = (event) =>
      onFrame((event as CustomEvent<{ frame: number }>).detail.frame);
    player.addEventListener("frameupdate", listener);
    player.addEventListener("seeked", listener);
    return () => {
      player.removeEventListener("frameupdate", listener);
      player.removeEventListener("seeked", listener);
    };
  }, [onFrame, size, playerRef]);

  return (
    <div ref={boxRef} className="absolute inset-0">
      {size && (
        <div
          className={
            composition
              ? "absolute top-0 left-1/2 h-full -translate-x-1/2"
              : "absolute inset-0"
          }
          style={
            composition
              ? { aspectRatio: `${composition.width} / ${composition.height}` }
              : undefined
          }
        >
          <Player
            ref={playerRef}
            lazyComponent={load}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={composition?.width ?? size.width}
            compositionHeight={composition?.height ?? size.height}
            initialFrame={stillFrame}
            style={{ width: "100%", height: "100%", background: "transparent" }}
            controls={false}
            clickToPlay={false}
            loop
            initiallyMuted
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
          />
        </div>
      )}
    </div>
  );
}
