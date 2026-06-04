"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowRight, Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { INSTALL_COMMAND, SECTION, SPRING_BOUNCE } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";
import { InstallCommand } from "../install-command";

export function Hero() {
  const heroEntry = registry["browser-flow"];
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(true);
  const trackEvent = useTrackEvent();

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) {
      p.pause();
      setPlaying(false);
      trackEvent("preview_paused", {
        component: "browser-flow",
        surface: "hero",
      });
    } else {
      p.play();
      setPlaying(true);
      trackEvent("preview_played", {
        component: "browser-flow",
        surface: "hero",
        trigger: "click",
      });
    }
  }, [trackEvent]);

  const aspectRatio = heroEntry
    ? `${heroEntry.config.compositionWidth} / ${heroEntry.config.compositionHeight}`
    : "16 / 9";

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Theme-aware backdrop: dotted grid that fades out + a soft top glow. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-muted),transparent_70%)] opacity-70" />
      </div>

      <div className={SECTION}>
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.04}>
            <Link
              href="/docs/getting-started/introduction"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <span className="size-1.5 rounded-full bg-foreground/70" />
              Open source · MIT licensed
            </Link>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Cinematic video components,
              <br className="hidden sm:block" /> now copy-pasteable
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-xl">
              Production-ready Remotion animations, transitions and backgrounds.
              Install with the shadcn CLI and own every line of code.
            </p>
          </FadeUp>

          <FadeUp delay={0.22}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 gap-2 rounded-full px-6 text-sm"
                render={
                  <Link
                    href="/docs/getting-started/introduction"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "hero_browse",
                        destination: "/docs/getting-started/introduction",
                      })
                    }
                  />
                }
              >
                Browse components
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <InstallCommand command={INSTALL_COMMAND} />
            </div>
          </FadeUp>
        </div>
      </div>

      <FadeUp delay={0.3} className="relative mt-14 w-full">
        <motion.div
          className="relative flex justify-center px-4 sm:px-6"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...SPRING_BOUNCE, delay: 0.05 }}
        >
          <div
            className="group surface-card relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl shadow-black/5 sm:rounded-3xl dark:shadow-black/40"
            style={{ aspectRatio }}
          >
            {heroEntry ? (
              <Player
                ref={playerRef}
                component={heroEntry.Component}
                inputProps={{ url: "remocn.dev" }}
                durationInFrames={heroEntry.config.durationInFrames}
                fps={heroEntry.config.fps}
                compositionWidth={heroEntry.config.compositionWidth}
                compositionHeight={heroEntry.config.compositionHeight}
                style={{ width: "100%", height: "100%", display: "block" }}
                autoPlay
                loop
                acknowledgeRemotionLicense
              />
            ) : null}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span
                aria-hidden
                data-show={!playing}
                className="pointer-events-none flex size-14 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none data-[show=true]:opacity-100"
              >
                {playing ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-0.5" />
                )}
              </span>
            </button>
          </div>
        </motion.div>
      </FadeUp>
    </section>
  );
}
