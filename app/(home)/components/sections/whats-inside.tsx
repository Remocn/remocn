"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowUpRight, Component, Shuffle, Sparkles, Type, Waves } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type ComponentType, useRef } from "react";
import { SPRING_SOFT } from "@/config/site";
import { cn } from "@/lib/utils";
import { shaderGrainGradientConfig } from "@/registry/remocn/shader-grain-gradient/config";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";
import { useAutoplay } from "../use-autoplay";

const EYEBROW = "What's inside";
const TITLE = "Five kinds of building blocks";
const LEAD =
  "Every remocn component belongs to one of these families. Compose them on the Remotion timeline to build a full video, one scene at a time.";

interface VizProps {
  play: boolean;
}

function TypographyViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const letters = "Motion".split("");

  if (reduced || !play) {
    return (
      <span className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Motion
      </span>
    );
  }

  return (
    <div className="flex text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
      {letters.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className="will-change-[transform,opacity]"
          animate={{
            opacity: [0, 1, 1, 0],
            y: [18, 0, 0, -18],
          }}
          transition={{
            duration: 3.4,
            times: [0, 0.2, 0.78, 1],
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.4,
            delay: i * 0.09,
            ease: "easeInOut",
          }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

function TransitionsViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="flex h-full w-[200%] will-change-transform"
        animate={active ? { x: ["0%", "0%", "-50%", "-50%"] } : { x: "-50%" }}
        transition={{
          duration: 3,
          times: [0, 0.35, 0.65, 1],
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.65, 0, 0.35, 1],
        }}
      >
        <div className="flex h-full w-1/2 shrink-0 items-center justify-center bg-muted/50">
          <span className="font-mono text-3xl font-medium text-muted-foreground">
            01
          </span>
        </div>
        <div className="flex h-full w-1/2 shrink-0 items-center justify-center bg-foreground">
          <span className="font-mono text-3xl font-medium text-background">02</span>
        </div>
      </motion.div>
    </div>
  );
}

const SHADER_PREVIEW_WIDTH = 480;
const SHADER_PREVIEW_HEIGHT = 270;
const SHADER_PREVIEW_FPS = 20;

const loadShaderGrainGradient = () =>
  import("@/registry/remocn/shader-grain-gradient").then((m) => ({
    default: m.ShaderGrainGradient,
  }));

function ShadersViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef, play && !reduced);

  const durationInFrames = Math.round(
    (shaderGrainGradientConfig.durationInFrames * SHADER_PREVIEW_FPS) /
      shaderGrainGradientConfig.fps,
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 will-change-transform">
        <Player
          ref={playerRef}
          lazyComponent={loadShaderGrainGradient}
          inputProps={{}}
          durationInFrames={durationInFrames}
          fps={SHADER_PREVIEW_FPS}
          compositionWidth={SHADER_PREVIEW_WIDTH}
          compositionHeight={SHADER_PREVIEW_HEIGHT}
          style={{ width: "100%", height: "100%" }}
          loop
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}

function AnimatedIconsViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;
  const times = [0, 0.5, 0.85, 1];

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-14 text-foreground"
      animate={active ? { scale: [0.9, 1, 1.08, 0.9], rotate: [-8, 0, 0, -8] } : undefined}
      transition={{
        duration: 3,
        times,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      <motion.path
        d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9z"
        animate={
          active ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : { pathLength: 1, opacity: 1 }
        }
        transition={{
          duration: 3,
          times,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
}

function UiPrimitivesViz({ play }: VizProps) {
  const reduced = useReducedMotion();
  const active = play && !reduced;
  const times = [0, 0.15, 0.85, 1];

  return (
    <div className="relative h-9 w-16 overflow-hidden rounded-full border border-border bg-muted">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-primary"
        animate={active ? { opacity: [0, 1, 1, 0] } : { opacity: 1 }}
        transition={{
          duration: 3,
          times,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.span
        className="absolute top-1 left-1 size-7 rounded-full bg-background"
        animate={active ? { x: [0, 28, 28, 0] } : { x: 28 }}
        transition={{
          duration: 3,
          times,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

interface Category {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  Viz: ComponentType<VizProps>;
  span: string;
}

const CATEGORIES: Category[] = [
  {
    title: "Typography",
    description: "Text that animates itself in — blur-ins, line reveals, kinetic builds.",
    href: "/docs/typography",
    icon: Type,
    Viz: TypographyViz,
    span: "lg:col-span-3",
  },
  {
    title: "Shaders",
    description: "GPU backgrounds — animated noise, gradients, and meshes.",
    href: "/docs/shaders/getting-started/introduction",
    icon: Waves,
    Viz: ShadersViz,
    span: "lg:col-span-3",
  },
  {
    title: "Transitions",
    description: "Scene-to-scene cuts — pushes, dissolves, and shader wipes.",
    href: "/docs/transitions",
    icon: Shuffle,
    Viz: TransitionsViz,
    span: "lg:col-span-2",
  },
  {
    title: "Animated Icons",
    description: "Lucide icons redrawn for video, each with its own action.",
    href: "/docs/icons/gallery",
    icon: Sparkles,
    Viz: AnimatedIconsViz,
    span: "lg:col-span-2",
  },
  {
    title: "UI Primitives",
    description: "shadcn components scripted on the frame — buttons, switches, dialogs.",
    href: "/docs/ui",
    icon: Component,
    Viz: UiPrimitivesViz,
    span: "sm:col-span-2 lg:col-span-2",
  },
];

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const { Viz, icon: Icon } = category;

  return (
    <FadeUp delay={index * 0.06} className={cn("h-full", category.span)}>
      <Link
        href={category.href}
        aria-label={`Explore ${category.title}`}
        className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <motion.article
          ref={ref}
          whileHover={{ y: -4 }}
          transition={SPRING_SOFT}
          className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card"
        >
          <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-border bg-muted/20 sm:h-44 [background-image:radial-gradient(circle,color-mix(in_oklab,var(--color-foreground)_6%,transparent)_1px,transparent_1px)] [background-size:16px_16px]">
            <Viz play={inView} />
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {category.title}
              </h3>
              <ArrowUpRight
                aria-hidden
                className="ml-auto size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground"
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              {category.description}
            </p>
          </div>
        </motion.article>
      </Link>
    </FadeUp>
  );
}

export function WhatsInside() {
  return (
    <section
      id="whats-inside"
      className="relative py-20 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_640px]"
    >
      <div className="section">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} lead={LEAD} />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6 lg:gap-6">
          {CATEGORIES.map((category, i) => (
            <CategoryCard key={category.title} category={category} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
