"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowRight, Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type CSSProperties, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SECTION, SPRING_SOFT } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";

function BentoCard({
  name,
  title,
  description,
  className = "",
  inputProps,
}: {
  name: string;
  title: string;
  description: string;
  className?: string;
  inputProps?: Record<string, unknown>;
}) {
  const entry = registry[name];
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);
  const hoverTracked = useRef(false);
  const trackEvent = useTrackEvent();

  const handleEnter = () => {
    playerRef.current?.play();
    setPlaying(true);
    if (!hoverTracked.current) {
      hoverTracked.current = true;
      trackEvent("preview_played", {
        component: name,
        surface: "bento",
        trigger: "hover",
      });
    }
  };
  const handleLeave = () => {
    playerRef.current?.pause();
    setPlaying(false);
  };
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) {
      p.pause();
      setPlaying(false);
      trackEvent("preview_paused", { component: name, surface: "bento" });
    } else {
      p.play();
      setPlaying(true);
      trackEvent("preview_played", {
        component: name,
        surface: "bento",
        trigger: "click",
      });
    }
  }, [name, trackEvent]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover-to-play is decorative video preview
    <motion.div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      whileHover={{ y: -4 }}
      transition={SPRING_SOFT}
      className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl ${className}`}
      style={{
        boxShadow: `0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Spotlight overlay (driven by parent --mx/--my) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(500px circle at var(--mx) var(--my), rgba(255,255,255,0.07), transparent 40%)",
        }}
      />

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A090E]">
        {entry ? (
          <Player
            ref={playerRef}
            component={entry.Component}
            inputProps={inputProps ?? {}}
            durationInFrames={entry.config.durationInFrames}
            fps={entry.config.fps}
            compositionWidth={entry.config.compositionWidth}
            compositionHeight={entry.config.compositionHeight}
            style={{ width: "100%", height: "100%" }}
            loop
            acknowledgeRemotionLicense
          />
        ) : null}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause preview" : "Play preview"}
          className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:hidden"
        >
          <span
            aria-hidden
            className="pointer-events-none flex size-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 translate-x-0.5" />
            )}
          </span>
        </button>
      </div>
      <div className="relative flex-1 p-5 sm:p-6">
        <h3 className="font-[var(--font-display)] text-base font-medium text-[#EDEDED]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[#8B8A91]">{description}</p>
      </div>
    </motion.div>
  );
}

export function BentoRegistry() {
  const gridRef = useRef<HTMLDivElement>(null);
  const grid2Ref = useRef<HTMLDivElement>(null);
  const trackEvent = useTrackEvent();

  const handleMove = (
    e: React.MouseEvent<HTMLDivElement>,
    target: HTMLDivElement | null,
  ) => {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    target.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <section id="components" className="relative py-20 sm:py-32">
      <div className={SECTION}>
        <FadeUp>
          <div className="mb-12 sm:mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold -tracking-wide text-[#EDEDED] md:text-5xl">
                A registry of motion
              </h2>
              <p className="mt-4 text-[#8B8A91]">
                Transitions, primitives, text reveals — production-ready and
                hover to play
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SOFT}
            >
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-white/10 bg-white/4 px-5 text-[#EDEDED] backdrop-blur-xl hover:border-white/20 hover:bg-white/6 hover:text-[#EDEDED]"
              >
                <Link
                  href="/docs/getting-started/introduction"
                  className="inline-flex items-center gap-2"
                  onClick={() =>
                    trackEvent("cta_clicked", {
                      cta: "bento_browse",
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

        <FadeUp delay={0.1}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: spotlight cursor tracking is purely visual */}
          <div
            ref={gridRef}
            onMouseMove={(e) => handleMove(e, gridRef.current)}
            className="grid gap-4 sm:gap-6 md:grid-cols-3 md:grid-rows-2"
            style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}
          >
            <BentoCard
              name="ai-generation-canvas"
              title="AI Generation Canvas"
              description="From prompt to UI in a single composition"
              className="md:col-span-2 md:row-span-2"
            />
            <BentoCard
              name="shimmer-sweep"
              title="Shimmer Sweep"
              description="Light pass across text for AI accents"
              inputProps={{ text: "Generating" }}
            />
            <BentoCard
              name="ecosystem-constellation"
              title="Ecosystem Constellation"
              description="Orbits of integration logos around your brand"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.18}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: spotlight cursor tracking is purely visual */}
          <div
            ref={grid2Ref}
            onMouseMove={(e) => handleMove(e, grid2Ref.current)}
            className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 md:grid-cols-2"
            style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}
          >
            <BentoCard
              name="grid-pixelate-wipe"
              title="Grid Pixelate Wipe"
              description="The screen breaks into squares and reassembles into a new scene"
            />
            <BentoCard
              name="frosted-glass-wipe"
              title="Frosted Glass Wipe"
              description="An elegant transition through a sheet of glass"
            />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
