"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Pause, Play } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { PEACH, SECTION, SPRING_SOFT } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

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
      <div className={SECTION}>
        <SectionHeading
          eyebrow="It's just React"
          title="Type a prop, ship a frame"
          lead="Every component is plain React driven by the Remotion API. Change a value and the preview reacts in real time — no timeline scrubbing."
        />
      </div>

      {/* Break out of the section width so the wide composition has room. */}
      <div className="mx-auto mt-12 w-full max-w-[100rem] px-4 sm:mt-16 sm:px-6">
        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={SPRING_SOFT}
            className="surface-card group relative overflow-hidden rounded-2xl shadow-2xl shadow-black/5 sm:rounded-3xl dark:shadow-black/40"
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
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
