"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { PlayIcon } from "lucide-react";
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ControlConfig } from "@/lib/customizer-config";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import type { BackdropFill } from "@/registry/remocn/backdrop";
import { Backdrop } from "@/registry/remocn/backdrop";

/**
 * Build nuqs parsers + URL keys from a control config. Each control becomes a
 * URL-synced query param prefixed with the component name (dashes → underscores)
 * so multiple previews on one page never collide.
 */
export function buildParsers(name: string, controls: ControlConfig) {
  // biome-ignore lint/suspicious/noExplicitAny: holds nuqs parsers of differing generic types (string/number/boolean); no common narrower type exists
  const parsers: Record<string, any> = {};
  const urlKeys: Record<string, string> = {};
  const prefix = name.replace(/-/g, "_");

  for (const [key, ctrl] of Object.entries(controls)) {
    urlKeys[key] = `${prefix}_${key}`;
    if (ctrl.type === "text") {
      parsers[key] = parseAsString.withDefault(ctrl.default);
    } else if (ctrl.type === "number" || ctrl.type === "number-input") {
      parsers[key] = parseAsFloat.withDefault(ctrl.default);
    } else if (ctrl.type === "color") {
      parsers[key] = parseAsString.withDefault(ctrl.default);
    } else if (ctrl.type === "select") {
      parsers[key] = parseAsStringLiteral(
        ctrl.options as readonly string[],
      ).withDefault(ctrl.default);
    } else if (ctrl.type === "boolean") {
      parsers[key] = parseAsBoolean.withDefault(ctrl.default);
    }
  }
  return { parsers, urlKeys };
}

/**
 * Lazy-mounted Remotion player with its own controls, for the changelog and
 * the embed route (the docs pages use `components/docs/blocks/player`). Until
 * the stage nears the viewport or the poster is clicked, a labeled poster
 * button holds the same 16:9 box, so the Player swaps in without a shift.
 */
export function PreviewStage({
  name,
  Component,
  load,
  inputProps,
  durationInFrames,
  fps,
  compositionWidth,
  compositionHeight,
  previewBackdrop,
  className,
}: {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  Component?: React.ComponentType<any>;
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load?: () => Promise<{ default: React.ComponentType<any> }>;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  previewBackdrop?: BackdropFill;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (mounted) return;
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  // Reliable autoplay. The `<Player autoPlay>` prop mounts a tick before its
  // imperative handle is ready (worse under Strict Mode's dev double-mount), so
  // it shows the "playing" UI but the frame loop never starts — the preview
  // looks frozen until a manual pause/play. Instead the Player mounts paused and
  // we drive play() via the ref on the next animation frame, retrying once if
  // the first call didn't take.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      playerRef.current?.play();
      raf2 = requestAnimationFrame(() => {
        if (playerRef.current && !playerRef.current.isPlaying()) {
          playerRef.current.play();
        }
      });
    });
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [mounted, reducedMotion]);

  // Pause while off screen (a reduced-motion reader may still press play),
  // resume only what this observer paused.
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
        if (visible) {
          if (pausedByStage.current) {
            pausedByStage.current = false;
            player.play();
          }
        } else if (player.isPlaying()) {
          pausedByStage.current = true;
          player.pause();
        }
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  const compProps = useMemo<
    // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
    | { lazyComponent: () => Promise<{ default: React.ComponentType<any> }> }
    // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
    | { component: React.ComponentType<any> }
  >(() => {
    const wrap =
      // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
      (Inner: React.ComponentType<any>) => (p: Record<string, unknown>) =>
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
          load().then(({ default: Inner }) => ({ default: wrap(Inner) })),
      };
    }
    return { component: wrap(Component ?? (() => null)) };
  }, [Component, load, previewBackdrop]);

  return (
    <div
      ref={frameRef}
      // Compositions are a strict 1280×720 (16:9) and the stage matches
      // (aspect-video), staying full-width and aligned with the tabs/customize
      // panel. The Suspense fallback above uses the same ratio to keep zero
      // layout shift.
      className={cn(
        "aspect-video w-full overflow-hidden",
        className ?? "surface-card rounded-2xl",
      )}
    >
      {mounted ? (
        <div className="size-full animate-in fade-in duration-200 ease-[ease]">
          <Player
            ref={playerRef}
            {...compProps}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={compositionWidth}
            compositionHeight={compositionHeight}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
            // Browsers block autoplay with sound; the controls' volume
            // button turns it back on.
            initiallyMuted
            acknowledgeRemotionLicense
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMounted(true)}
          aria-label={`Play preview of ${name}`}
          className={cn(
            "group flex size-full items-center justify-center bg-muted/40 transition-colors",
            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors group-hover:bg-background">
            <PlayIcon className="size-5 translate-x-px fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
