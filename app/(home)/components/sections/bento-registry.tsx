"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowRight, Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SPRING_SOFT } from "@/config/site";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { SpotlightSurface } from "@/components/spotlight-surface";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

/** Copyable `npx shadcn add` pill shown in each card footer. */
function InstallPill({ name }: { name: string }) {
  const command = `npx shadcn@latest add remocn/${name}`;
  const [copied, setCopied] = useState(false);
  const trackEvent = useTrackEvent();

  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    trackEvent("install_command_copied", {
      component: name,
      surface: "bento",
      package_manager: "npm",
    });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="outline"
      type="button"
      onClick={copy}
      aria-label={`Copy install command for ${name}`}
      className="mt-4 flex w-full items-center gap-2.5 rounded-xl border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-ring/40"
    >
      <span aria-hidden className="select-none text-muted-foreground/50">
        $
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-foreground/90">
        npx shadcn@latest add{" "}
        <span className="text-foreground">remocn/{name}</span>
      </span>
      <span aria-hidden className="shrink-0 text-muted-foreground/70">
        {copied ? (
          <Check className="size-3.5 text-foreground" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </span>
    </Button>
  );
}

function BentoCard({
  name,
  title,
  description,
  className = "",
  inputProps,
  featured = false,
}: {
  name: string;
  title: string;
  description: string;
  className?: string;
  inputProps?: Record<string, unknown>;
  /**
   * Large 2×2 card: the preview grows to fill the extra height (inside a dark
   * frame that blends the letterbox) and the footer stays compact, instead of
   * a fixed 16/9 preview leaving a tall empty gap above the install pill.
   */
  featured?: boolean;
}) {
  const entry = registry[name];
  const playerRef = useRef<PlayerRef>(null);

  // Reliable autoplay — `<Player autoPlay>` mounts a tick before its imperative
  // handle is ready (worse under Strict Mode's dev double-mount) and silently
  // stalls; mount paused and drive play() via the ref on the next animation
  // frame with a one-shot retry. Mirrors PreviewStage / use-player-controls.ts.
  useEffect(() => {
    if (!entry) return;
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
  }, [entry]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={SPRING_SOFT}
      className={cn(
        "surface-card group relative flex flex-col overflow-hidden rounded-2xl shadow-xl shadow-black/5 sm:rounded-3xl dark:shadow-black/30",
        className,
      )}
    >
      {/* Spotlight overlay (driven by parent --mx/--my) — theme-aware. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(500px circle at var(--mx) var(--my), color-mix(in oklab, var(--color-foreground) 8%, transparent), transparent 40%)",
        }}
      />

      <div
        className={cn(
          "relative w-full overflow-hidden",
          // Featured: media grows to fill the tall 2×2 card (md+). The frame
          // matches the ai-generation-canvas composition background (#0a0a0a)
          // so the Player's letterbox bars blend seamlessly in both themes.
          featured
            ? "aspect-[16/9] bg-[#0a0a0a] md:aspect-auto md:min-h-0 md:flex-1"
            : "aspect-[16/9] bg-muted",
        )}
      >
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
      </div>
      <div
        className={cn(
          "relative flex flex-col border-t border-border p-5 sm:p-6",
          featured ? "flex-none" : "flex-1",
        )}
      >
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className={featured ? undefined : "mt-auto"}>
          <InstallPill name={name} />
        </div>
      </div>
    </motion.div>
  );
}

export function BentoRegistry() {
  const trackEvent = useTrackEvent();

  return (
    <section id="components" className="relative py-20 sm:py-20">
      <div className="section">
        <SectionHeading
          eyebrow="The registry"
          title="A registry of motion"
          lead="Transitions, primitives and text reveals — production-ready, autoplaying, and one command away."
          action={
            <Button
              variant="outline"
              size="lg"
              className="h-11 gap-2 rounded-full px-5"
              render={
                <Link
                  href="/docs/components"
                  onClick={() =>
                    trackEvent("cta_clicked", {
                      cta: "bento_browse",
                      destination: "/docs/components",
                    })
                  }
                />
              }
            >
              Browse all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        <FadeUp delay={0.1} className="mt-12 sm:mt-16">
          <SpotlightSurface className="grid gap-4 sm:gap-6 md:grid-cols-3 md:grid-rows-2">
            <BentoCard
              name="ai-generation-canvas"
              title="AI Generation Canvas"
              description="From prompt to UI in a single composition"
              className="md:col-span-2 md:row-span-2"
              featured
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
          </SpotlightSurface>
        </FadeUp>

        <FadeUp delay={0.18}>
          <SpotlightSurface className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
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
          </SpotlightSurface>
        </FadeUp>
      </div>
    </section>
  );
}
