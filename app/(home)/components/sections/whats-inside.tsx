"use client";

import {
  ArrowUpRight,
  Component,
  Shuffle,
  Sparkles,
  Type,
  Waves,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../section-heading";

// The shader viz is the only scene that pulls @remotion/player + the shader
// runtime. Load it client-only so that weight leaves the initial landing
// bundle; the track labels and links stay server-rendered.
const ShadersViz = dynamic(
  () => import("./shaders-viz").then((m) => ({ default: m.ShadersViz })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-muted/20" />,
  },
);

// Same deal for the transitions scene — a real registry transition
// (zoomBlur in a TransitionSeries) playing in @remotion/player.
const TransitionsViz = dynamic(
  () =>
    import("./transitions-viz").then((m) => ({ default: m.TransitionsViz })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-muted/20" />,
  },
);

const EYEBROW = "What’s inside";
const TITLE = "Five kinds of building blocks";
const LEAD =
  "Every remocn component belongs to one of these families. Your agent composes them on the timeline, one scene at a time.";

const FPS = 30;

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
      animate={
        active
          ? { scale: [0.9, 1, 1.08, 0.9], rotate: [-8, 0, 0, -8] }
          : undefined
      }
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
          active
            ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }
            : { pathLength: 1, opacity: 1 }
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

interface Clip {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  Viz: ComponentType<VizProps>;
  /** Clip length in timeline seconds — sets its share of the track width. */
  seconds: number;
  /** Screen-studio-style saturated track color for the pill. */
  fill: string;
}

const CLIPS: Clip[] = [
  {
    title: "Typography",
    description:
      "Words that arrive with weight instead of just appearing on screen.",
    href: "/docs/typography",
    icon: Type,
    Viz: TypographyViz,
    seconds: 3.5,
    fill: "oklch(0.62 0.12 60)",
  },
  {
    title: "Shaders",
    description:
      "Backgrounds that move — the kind sitting behind every good hero shot.",
    href: "/docs/shaders/getting-started/introduction",
    icon: Waves,
    Viz: ShadersViz,
    seconds: 3,
    fill: "oklch(0.54 0.14 285)",
  },
  {
    title: "Transitions",
    description: "Cuts between scenes that don’t look like a slideshow.",
    href: "/docs/transitions",
    icon: Shuffle,
    Viz: TransitionsViz,
    seconds: 2,
    fill: "oklch(0.57 0.1 220)",
  },
  {
    title: "Animated Icons",
    description: "Icons that actually do the thing they stand for.",
    href: "/docs/icons/gallery",
    icon: Sparkles,
    Viz: AnimatedIconsViz,
    seconds: 2,
    fill: "oklch(0.58 0.1 150)",
  },
  {
    title: "UI Primitives",
    description:
      "Fake app screens — buttons, dialogs and menus that behave like the real thing.",
    href: "/docs/ui",
    icon: Component,
    Viz: UiPrimitivesViz,
    seconds: 2.5,
    fill: "oklch(0.54 0.13 330)",
  },
];

const TOTAL_SECONDS = CLIPS.reduce((sum, clip) => sum + clip.seconds, 0);
/** Cumulative clip start times, as 0–1 fractions of the whole track. */
const CLIP_STARTS = CLIPS.reduce<number[]>((starts, _, i) => {
  starts.push(
    i === 0 ? 0 : starts[i - 1] + CLIPS[i - 1].seconds / TOTAL_SECONDS,
  );
  return starts;
}, []);

function clipIndexAt(progress: number) {
  for (let i = CLIP_STARTS.length - 1; i >= 0; i--) {
    if (progress >= CLIP_STARTS[i]) return i;
  }
  return 0;
}

function formatTimecode(seconds: number) {
  const frames = Math.round(seconds * FPS);
  return `${Math.floor(frames / FPS)}:${String(frames % FPS).padStart(2, "0")}`;
}

const RULER_STEPS = 13;

function TimelineRuler() {
  return (
    <div
      aria-hidden
      className="relative flex h-6 select-none items-end border-b border-border/60"
    >
      {Array.from({ length: RULER_STEPS + 1 }, (_, i) => {
        const seconds = (TOTAL_SECONDS / RULER_STEPS) * i;
        return (
          <div
            key={i}
            className="absolute bottom-0 flex flex-col items-start gap-1"
            style={{ left: `${(i / RULER_STEPS) * 100}%` }}
          >
            {i % 2 === 0 && i < RULER_STEPS && (
              <span className="font-mono text-[10px] leading-none text-muted-foreground/50 tabular-nums">
                {formatTimecode(seconds)}
              </span>
            )}
            <span
              className={cn("w-px bg-border", i % 2 === 0 ? "h-2" : "h-1")}
            />
          </div>
        );
      })}
    </div>
  );
}

export function WhatsInside() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.3 });
  const reduced = useReducedMotion();

  const progress = useMotionValue(0);
  const playheadLeft = useTransform(progress, (v) => `${v * 100}%`);
  const [playheadIndex, setPlayheadIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useMotionValueEvent(progress, "change", (v) => {
    const idx = clipIndexAt(v);
    if (idx !== playheadIndex) setPlayheadIndex(idx);
  });

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(progress, [0, 1], {
      duration: TOTAL_SECONDS,
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
    });
    return () => controls.stop();
  }, [inView, reduced, progress]);

  const activeIndex = hoverIndex ?? playheadIndex;
  const activeClip = CLIPS[activeIndex];
  const ActiveViz = activeClip.Viz;

  return (
    <section
      ref={sectionRef}
      id="whats-inside"
      className="relative py-14 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_760px]"
    >
      <div className="section">
        <SectionHeading
          eyebrow={EYEBROW}
          title={TITLE}
          lead={LEAD}
          animated={false}
        />

        {/* Monitor — the preview canvas above the timeline, editor-style. */}
        <div className="relative mt-10 h-56 overflow-hidden rounded-2xl border border-border bg-muted/20 sm:mt-12 sm:h-72">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeClip.title}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
            >
              <ActiveViz play={inView} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="relative min-w-[640px]">
            <TimelineRuler />

            <div className="relative mt-2">
              {/* Playhead spans the ruler gap and the track. */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -top-8 bottom-0 z-10 flex flex-col items-center"
                  style={{ left: playheadLeft }}
                >
                  <span className="size-2 shrink-0 rounded-[2px] bg-primary" />
                  <span className="w-px flex-1 bg-primary" />
                </motion.div>
              )}

              <div className="flex gap-1.5">
                {CLIPS.map((clip, i) => {
                  const active = i === activeIndex;
                  const Icon = clip.icon;
                  return (
                    <Link
                      key={clip.title}
                      href={clip.href}
                      aria-label={`Explore ${clip.title}`}
                      style={{
                        flexGrow: clip.seconds,
                        flexBasis: 0,
                        backgroundColor: clip.fill,
                      }}
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                      onFocus={() => setHoverIndex(i)}
                      onBlur={() => setHoverIndex(null)}
                      className={cn(
                        "group relative flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl px-3 transition-[opacity,filter] duration-200 sm:h-14",
                        "inset-shadow-[0_1px_0_--theme(--color-white/25%)]",
                        active
                          ? "opacity-100"
                          : "opacity-55 saturate-75 hover:opacity-80",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Icon
                          aria-hidden
                          className="size-3.5 shrink-0 text-white/80"
                        />
                        <span className="truncate text-xs font-medium text-white">
                          {clip.title}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] leading-none text-white/60 tabular-nums">
                        {clip.seconds.toFixed(1)}s
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex min-h-12 items-start justify-between gap-4">
              <motion.p
                key={activeClip.title}
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground"
              >
                <span className="font-medium text-foreground">
                  {activeClip.title}
                </span>{" "}
                — {activeClip.description}
              </motion.p>
              <Link
                href={activeClip.href}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                Explore
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
