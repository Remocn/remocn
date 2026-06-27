"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowRight, Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPRING_BOUNCE } from "@/config/site";
import { useTrackEvent } from "@/lib/analytics";
import { HERO_CODE } from "@/lib/config/snippets";
import registry from "@/registry/__index__";
import { Backdrop } from "@/registry/remocn/backdrop";
import { FadeUp } from "../fade-up";
import { InstallAll } from "../install-all";
import { useAutoplay } from "../use-autoplay";

const GlassCodeBlock = registry["glass-code-block"]?.Component;

function HeroComposition(props: Record<string, unknown>) {
  return (
    <Backdrop
      fill={{ type: "image", src: "/hero.png" }}
      padding={0}
      radius={0}
      shadow=""
    >
      {GlassCodeBlock ? <GlassCodeBlock {...props} /> : null}
    </Backdrop>
  );
}

export function Hero() {
  const heroEntry = registry["glass-code-block"];
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
        component: "glass-code-block",
        surface: "hero",
      });
    } else {
      p.play();
      setPlaying(true);
      trackEvent("preview_played", {
        component: "glass-code-block",
        surface: "hero",
        trigger: "click",
      });
    }
  }, [trackEvent]);

  useAutoplay(playerRef);

  const aspectRatio = heroEntry
    ? `${heroEntry.config.compositionWidth} / ${heroEntry.config.compositionHeight}`
    : "16 / 9";

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      {/* Theme-aware backdrop: dotted grid that fades out + a soft top glow. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-muted),transparent_70%)] opacity-70" />
      </div>

      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.06} className="flex flex-col items-center">
            <Badge
              variant="outline"
              className="mb-5 h-7 gap-1.5 rounded-full px-3 text-xs"
              render={
                <Link
                  href="/docs/ui/blocks/telegram-chat-flow"
                  onClick={() =>
                    trackEvent("cta_clicked", {
                      cta: "hero_ui_badge",
                      destination: "/docs/ui/blocks/telegram-chat-flow",
                    })
                  }
                />
              }
            >
              <span className="font-semibold text-foreground">New</span>
              <span aria-hidden className="text-muted-foreground/60">
                ·
              </span>
              <span className="text-muted-foreground">
                Introducing <span className="text-foreground">Chat</span>
              </span>
              <ArrowRight className="size-3" aria-hidden="true" />
            </Badge>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Cinematic video components,
              <br className="hidden sm:block" /> now copy-pasteable
            </h1>
          </FadeUp>

          <FadeUp delay={0.12}>
            <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Production-ready Remotion animations, transitions and backgrounds.
              Install with the shadcn CLI and own every line of code.
            </p>
          </FadeUp>

          <FadeUp delay={0.18}>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
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
              <InstallAll />
            </div>
          </FadeUp>
        </div>
      </div>

      <div className="section">
        <FadeUp delay={0.24} className="relative mt-10 w-full sm:mt-12">
          <motion.div
            className="relative"
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...SPRING_BOUNCE, delay: 0.05 }}
          >
            <div
              className="group surface-card relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/5 sm:rounded-3xl dark:shadow-black/40"
              style={{ aspectRatio }}
            >
              {heroEntry ? (
                <Player
                  ref={playerRef}
                  component={HeroComposition}
                  inputProps={{
                    code: HERO_CODE,
                    title: "LaunchScene.tsx",
                    width: 860,
                    height: 480,
                  }}
                  durationInFrames={heroEntry.config.durationInFrames}
                  fps={heroEntry.config.fps}
                  compositionWidth={heroEntry.config.compositionWidth}
                  compositionHeight={heroEntry.config.compositionHeight}
                  style={{ width: "100%", height: "100%", display: "block" }}
                  loop
                  initiallyMuted
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
      </div>
    </section>
  );
}
