"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { PEACH, SECTION, SPRING_SOFT } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";

export function LandingCodeShowcase() {
  const entry = registry["landing-code-showcase"];
  const aspectRatio =
    entry &&
    `${entry.config.compositionWidth} / ${entry.config.compositionHeight}`;
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
        component: "landing-code-showcase",
        surface: "landing_code_showcase",
      });
    } else {
      p.play();
      setPlaying(true);
      trackEvent("preview_played", {
        component: "landing-code-showcase",
        surface: "landing_code_showcase",
        trigger: "click",
      });
    }
  }, [trackEvent]);

  return (
    <section id="showcase" className="relative py-20 sm:py-32">
      {/* Header sits inside the standard SECTION width for readable copy */}
      <div className={SECTION}>
        <FadeUp>
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold  -tracking-wide text-[#EDEDED] md:text-5xl">
              Type a prop
              <span className="text-[#8B8A91]"> ship a frame</span>
            </h2>
            <p className="mt-4 text-[#8B8A91]">
              Every component is just React. Watch the preview react to your
              code in real time
            </p>
          </div>
        </FadeUp>
      </div>

      {/* Showcase block breaks out of the section width so the player has
          room for the wide composition. */}
      <div className="mx-auto w-full max-w-[100rem] px-4 sm:px-6">
        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={SPRING_SOFT}
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/6 bg-white/2 backdrop-blur-2xl"
            style={{
              boxShadow: `0 30px 80px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <div className="w-full" style={{ aspectRatio }}>
              {entry ? (
                <Player
                  ref={playerRef}
                  component={entry.Component}
                  inputProps={{ accentColor: PEACH }}
                  durationInFrames={entry.config.durationInFrames}
                  fps={entry.config.fps}
                  compositionWidth={entry.config.compositionWidth}
                  compositionHeight={entry.config.compositionHeight}
                  style={{ width: "100%", height: "100%", display: "block" }}
                  autoPlay
                  loop
                  acknowledgeRemotionLicense
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span
                aria-hidden
                data-show={!playing}
                className="pointer-events-none flex size-14 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none data-[show=true]:opacity-100"
              >
                {playing ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-0.5" />
                )}
              </span>
            </button>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
