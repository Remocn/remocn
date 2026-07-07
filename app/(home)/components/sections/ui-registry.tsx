"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ComponentType, type ReactNode, useRef } from "react";
import { SpotlightSurface } from "@/components/spotlight-surface";
import { blockExamples } from "@/components/docs/examples/blocks";
import { examples } from "@/components/docs/examples";
import { SPRING_SOFT } from "@/config/site";
import { cn } from "@/lib/utils";
import { FadeUp } from "../fade-up";
import { InstallCommand } from "../install-command";
import { SectionHeading } from "../section-heading";
import { useAutoplay } from "../use-autoplay";

interface SceneEntry {
  Component: ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

const atomEntry = (name: string): SceneEntry | undefined =>
  examples[`${name}-example`] as SceneEntry | undefined;
const flowEntry = (name: string): SceneEntry | undefined =>
  blockExamples[name] as SceneEntry | undefined;

const EYEBROW = "remocn-ui";
const TITLE = "shadcn, on the timeline";
const LEAD =
  "The shadcn primitives you already know — Button, Input, Select, Dialog — but their states are scripted on the Remotion frame. No useState, no event handlers: every pixel is a pure function of the timeline.";

interface Atom {
  name: string;
  title: string;
  description: string;
}

const ATOMS: Atom[] = [
  { name: "select", title: "Select", description: "Panel reveals, then an item check lands" },
  { name: "input", title: "Input", description: "Focus ring and a typed value reveal" },
  { name: "switch", title: "Switch", description: "Track fill with a sliding thumb" },
  {
    name: "command-menu",
    title: "Command Menu",
    description: "⌘K palette opens, then filters",
  },
];

const PRIMITIVE_CHIPS = [
  "button",
  "input",
  "checkbox",
  "switch",
  "select",
  "dialog",
  "toast",
  "command-menu",
  "tabs",
  "slider",
  "tooltip",
  "stepper",
  "message-bubble",
  "typing-indicator",
];

function ScenePlayer({ entry }: { entry: SceneEntry | undefined }) {
  const ref = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(ref, Boolean(entry));

  if (!entry) return null;

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <Player
        ref={ref}
        component={entry.Component}
        inputProps={{}}
        durationInFrames={entry.durationInFrames}
        fps={entry.fps}
        compositionWidth={entry.width}
        compositionHeight={entry.height}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        clickToPlay={false}
        loop
        initiallyMuted
        acknowledgeRemotionLicense
      />
    </div>
  );
}

function PreviewSurface({
  entry,
  className,
}: {
  entry: SceneEntry | undefined;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={SPRING_SOFT}
      className={cn(
        "surface-card relative aspect-video overflow-hidden rounded-2xl shadow-xl shadow-black/5 sm:rounded-3xl dark:shadow-black/30",
        className,
      )}
    >
      <ScenePlayer entry={entry} />
    </motion.div>
  );
}

function PreviewCardLink({
  href,
  entry,
  label,
  className,
  surfaceClassName,
  children,
}: {
  href: string;
  entry: SceneEntry | undefined;
  label: string;
  className?: string;
  surfaceClassName?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:rounded-3xl",
        className,
      )}
    >
      <PreviewSurface entry={entry} className={surfaceClassName} />
      {children}
    </Link>
  );
}

function AtomCard({ atom, className }: { atom: Atom; className?: string }) {
  return (
    <PreviewCardLink
      href={`/docs/ui/components/${atom.name}`}
      entry={atomEntry(atom.name)}
      label={`Open the ${atom.title} documentation`}
      surfaceClassName="sm:rounded-2xl"
      className={cn("flex flex-col", className)}
    >
      <div className="flex items-start justify-between gap-2 px-1 pt-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {atom.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {atom.description}
          </p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground"
        />
      </div>
    </PreviewCardLink>
  );
}

function PrimitiveChips({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {PRIMITIVE_CHIPS.map((name) => (
        <Link
          key={name}
          href={`/docs/ui/components/${name}`}
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          {name}
        </Link>
      ))}
      <Link
        href="/docs/ui"
        className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        + more
      </Link>
    </div>
  );
}

function UiRegistryIntro({ className }: { className?: string }) {
  return (
    <div className={className}>
      <SectionHeading eyebrow={EYEBROW} title={TITLE} lead={LEAD} />
      <FadeUp delay={0.06}>
        <PrimitiveChips className="mt-6" />
        <InstallCommand
          command="npx shadcn add @remocn/signup-flow"
          size="sm"
          className="mt-7"
        />
      </FadeUp>
    </div>
  );
}

export function UiRegistry() {
  return (
    <section id="ui-registry" className="relative py-20 sm:py-20">
      <div className="section">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <UiRegistryIntro />

          <FadeUp delay={0.12}>
            <PreviewCardLink
              href="/docs/ui/blocks/signup-flow"
              entry={flowEntry("signup-flow")}
              label="Open the Signup Flow documentation"
            />
          </FadeUp>
        </div>

        <FadeUp delay={0.18}>
          <SpotlightSurface className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {ATOMS.map((atom) => (
              <AtomCard key={atom.name} atom={atom} />
            ))}
          </SpotlightSurface>
        </FadeUp>
      </div>
    </section>
  );
}
