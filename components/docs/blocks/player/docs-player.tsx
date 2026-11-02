"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { PlayerRef } from "@remotion/player";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { cn } from "@/lib/utils";
import { PlayerBar } from "./player-bar";
import { PlayerStage, type StageComposition } from "./player-stage";

const TAB =
  "flex h-7 cursor-pointer items-center rounded-[9px] px-3 text-caption text-dark-subtle outline-none transition-[color] duration-150 hover:text-[#fafafa] focus-visible:ring-2 focus-visible:ring-white/40 max-md:relative max-md:after:absolute max-md:after:inset-x-0 max-md:after:-inset-y-[3px] data-active:bg-[#2b2e31] data-active:text-[#fafafa] max-md:h-[38px] max-md:text-small max-md:leading-[18px] dark:data-active:bg-secondary";

/**
 * The dark docs player: an optional Preview / Code toolbar (with page actions
 * on the right), the live Remotion stage, its transport bar, and whatever the
 * caller stacks below (the customize panel). Light and dark themes share the
 * same always-dark surface; dark mode only lifts it onto the card colour.
 */
export function DocsPlayer({
  name,
  composition,
  code,
  actions,
  children,
  className,
}: {
  name: string;
  composition: StageComposition;
  /** Snippet for the Code tab; without it the toolbar only shows `actions`. */
  code?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const playerRef = useRef<PlayerRef | null>(null);
  const [mounted, setMounted] = useState(false);
  const mount = useCallback(() => setMounted(true), []);
  const title = name.replaceAll("-", " ");
  const label = `${title} preview`;

  const preview = (
    <>
      <PlayerStage
        name={title}
        composition={composition}
        playerRef={playerRef}
        mounted={mounted}
        onMount={mount}
      />
      <PlayerBar
        label={label}
        playerRef={playerRef}
        mounted={mounted}
        onMount={mount}
        durationInFrames={composition.durationInFrames}
        fps={composition.fps}
      />
    </>
  );

  return (
    <section
      aria-label={label}
      className={cn(
        "not-prose flex flex-col gap-2 rounded-card border border-transparent bg-dark-surface p-2 text-[#fafafa] dark:border-hairline dark:bg-surface",
        className,
      )}
    >
      {code ? (
        <TabsPrimitive.Root
          defaultValue="preview"
          className="@container flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-1.5 px-1 max-md:px-0">
            <TabsPrimitive.List className="flex items-center gap-0.5 rounded-control-sm bg-dark-raised p-[3px] dark:bg-surface-muted">
              <TabsPrimitive.Tab value="preview" className={TAB}>
                Preview
              </TabsPrimitive.Tab>
              <TabsPrimitive.Tab value="code" className={TAB}>
                Code
              </TabsPrimitive.Tab>
            </TabsPrimitive.List>
            {actions}
          </div>
          <TabsPrimitive.Panel
            value="preview"
            keepMounted
            className="flex flex-col gap-2 outline-none"
          >
            {preview}
          </TabsPrimitive.Panel>
          <TabsPrimitive.Panel value="code" className="outline-none">
            <CodeBlock
              code={code}
              className="h-[calc(56.25cqw+60px)] rounded-control-sm border-dark-border max-md:h-auto max-md:max-h-96"
              bodyClassName="overflow-y-auto"
            />
          </TabsPrimitive.Panel>
        </TabsPrimitive.Root>
      ) : (
        <>
          {actions ? (
            <div className="flex items-center justify-end px-1">{actions}</div>
          ) : null}
          {preview}
        </>
      )}
      {children}
    </section>
  );
}
