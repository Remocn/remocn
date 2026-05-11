"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowRight, Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Dither from "@/components/Dither";
import { Button } from "@/components/ui/button";
import { SECTION, SPRING_BOUNCE, SPRING_SOFT } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";

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
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-44 sm:pb-28">
      <div className="w-full h-screen absolute top-0 left-0">
        <Dither
          waveColor={[
            0.25098039215686274, 0.25098039215686274, 0.25098039215686274,
          ]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={1}
          colorNum={6}
          pixelSize={2}
          waveAmplitude={0.35}
          waveFrequency={5.5}
          waveSpeed={0.01}
        />
      </div>
      <div className={SECTION}>
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.08}>
            <h1 className="mt-8 max-w-8xl text-balance font-sans text-4xl font-semibold leading-[1.05] -tracking-[0.04em] text-[#EDEDED] sm:text-5xl md:text-7xl">
              Cinematic video components
              <br />
              Now copy-pasteable
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="mt-6 max-w-2xl text-balance text-base sm:text-xl font-light leading-relaxed text-white">
              Build product demos, changelogs, and launch videos in React. Open
              source and delightfully easy
            </p>
          </FadeUp>

          <FadeUp delay={0.24}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SOFT}
              >
                <Button className="hover:bg-white h-14 px-10">
                  <Link
                    href="/docs/getting-started/introduction"
                    className="inline-flex items-center gap-2"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "hero_browse",
                        destination: "/docs/getting-started/introduction",
                      })
                    }
                  >
                    Browse components
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </div>

      <FadeUp delay={0.32} className="relative mt-10 w-full">
        <motion.div
          className="relative flex justify-center"
          initial={{ y: 40 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...SPRING_BOUNCE, delay: 0.1 }}
        >
          <div
            className="group relative w-[92vw] max-w-6xl overflow-hidden rounded-2xl sm:rounded-3xl"
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
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
                autoPlay
                loop
                acknowledgeRemotionLicense
              />
            ) : null}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
            >
              <span
                aria-hidden
                className="pointer-events-none flex size-14 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none data-[show=true]:opacity-100"
                data-show={!playing}
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
