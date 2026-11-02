"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { Backdrop, type BackdropFill } from "@/registry/remocn/backdrop";

// biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
type AnyComposition = React.ComponentType<any>;

export type StageComposition = {
  Component?: AnyComposition;
  load?: () => Promise<{ default: AnyComposition }>;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  previewBackdrop?: BackdropFill;
};

/**
 * The 16:9 stage of the docs player. The Remotion Player mounts once the stage
 * nears the viewport (or on the first play), starts on its own unless the
 * reader prefers reduced motion, and pauses while scrolled away. It renders
 * without Remotion's own controls: the bar below drives it through `playerRef`.
 */
export function PlayerStage({
  name,
  composition,
  playerRef,
  mounted,
  onMount,
  className,
}: {
  name: string;
  composition: StageComposition;
  playerRef: RefObject<PlayerRef | null>;
  mounted: boolean;
  onMount: () => void;
  className?: string;
}) {
  const {
    Component,
    load,
    inputProps,
    durationInFrames,
    fps,
    compositionWidth,
    compositionHeight,
    previewBackdrop,
  } = composition;
  const frameRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (mounted) return;
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onMount();
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, onMount]);

  // `<Player autoPlay>` can mount a tick before its handle is ready and stall
  // on the first frame, so play() is driven through the ref on the next
  // animation frame, with one retry.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      playerRef.current?.play();
      raf2 = requestAnimationFrame(() => {
        if (playerRef.current && !playerRef.current.isPlaying()) {
          playerRef.current.play();
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [mounted, reducedMotion, playerRef]);

  // Pause while off screen, resume only what this observer paused.
  const pausedByStage = useRef(false);
  useEffect(() => {
    if (!mounted) return;
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        const player = playerRef.current;
        if (!player) return;
        if (visible && pausedByStage.current) {
          pausedByStage.current = false;
          player.play();
        } else if (!visible && player.isPlaying()) {
          pausedByStage.current = true;
          player.pause();
        }
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, playerRef]);

  // The stage wears the composition's backdrop while its chunk loads, and the
  // first frame fades in over it instead of cutting in from black.
  const [loaded, setLoaded] = useState(false);
  const compProps = useMemo<
    | { lazyComponent: () => Promise<{ default: AnyComposition }> }
    | { component: AnyComposition }
  >(() => {
    const wrap = (Inner: AnyComposition) => (p: Record<string, unknown>) =>
      previewBackdrop ? (
        <Backdrop fill={previewBackdrop} padding={0} radius={0} shadow="">
          <Inner {...p} />
        </Backdrop>
      ) : (
        <Inner {...p} />
      );

    if (load) {
      return {
        lazyComponent: () =>
          load().then(({ default: Inner }) => {
            setLoaded(true);
            return { default: wrap(Inner) };
          }),
      };
    }
    return { component: wrap(Component ?? (() => null)) };
  }, [Component, load, previewBackdrop]);

  const poster =
    previewBackdrop && previewBackdrop.type !== "image"
      ? previewBackdrop.value
      : undefined;

  return (
    <div
      ref={frameRef}
      style={poster ? { background: poster } : undefined}
      className={cn(
        "aspect-video w-full overflow-hidden rounded-control-sm bg-black",
        className,
      )}
    >
      {mounted ? (
        <div
          className={cn(
            "size-full transition-opacity duration-200 ease-[ease]",
            load && !loaded && "opacity-0",
          )}
        >
          <Player
            ref={playerRef}
            {...compProps}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={compositionWidth}
            compositionHeight={compositionHeight}
            style={{ width: "100%", height: "100%" }}
            controls={false}
            clickToPlay
            loop
            // Previews are silent; muted playback starts without a user gesture.
            initiallyMuted
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onMount}
          aria-label={`Load preview of ${name}`}
          className="size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset"
        />
      )}
    </div>
  );
}
