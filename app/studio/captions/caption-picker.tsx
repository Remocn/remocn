"use client";

import { Player, type PlayerRef } from "@remotion/player";
import type { StudioElementPayload } from "@remotion/studio-protocol";
import { ArrowLeftIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import { ComponentPreview } from "@/components/docs/component-preview";
import { loadStudioElement } from "@/lib/studio-element";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import components from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import registry from "@/registry/remocn/registry.json";

const styles = registry.items.filter(
  (item) =>
    item.type === "registry:component" && item.name.startsWith("caption-"),
);

export function StudioCaptionPicker() {
  const [requestedName, setName] = useQueryState(
    "caption_style",
    parseAsString,
  );
  const style = styles.find((item) => item.name === requestedName);
  const name = style?.name ?? null;
  const [loaded, setLoaded] = useState<{
    name: string;
    payload: StudioElementPayload | null;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const lastOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    loadStudioElement(name).then((payload) => {
      if (!cancelled) setLoaded({ name, payload });
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  useLayoutEffect(() => {
    if (name || !gridRef.current) return;
    gridRef.current.scrollTop = scrollRef.current;
    if (lastOpenedRef.current) {
      gridRef.current
        .querySelector<HTMLButtonElement>(
          `[data-caption-style="${lastOpenedRef.current}"]`,
        )
        ?.focus({ preventScroll: true });
    }
  }, [name]);

  // A previous payload must never be installable while another style loads.
  const loadedStyle = loaded?.name === name ? loaded : null;

  return (
    <main className="remocn-caption-picker dark flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <style>{`
        /* Include portalled option menus without changing the saved site theme. */
        body:has(.remocn-caption-picker), .remocn-caption-picker {
          color-scheme: dark; font-family: Arial, Helvetica, sans-serif;
          --background: #1f2428; --foreground: #ffffff;
          --muted: #2b3239; --muted-foreground: #a6a7a9;
          --border: #3a424a; --input: #3a424a; --ring: #0b84f3;
          --primary: #0b84f3; --primary-foreground: #ffffff;
          --accent: #2b3239; --accent-foreground: #ffffff;
          --popover: #2b3239; --popover-foreground: #ffffff;
        }
        .remocn-caption-picker button, .remocn-caption-picker a,
        .remocn-caption-picker label, .remocn-caption-picker [role="slider"],
        .remocn-caption-picker input[type="color"] { cursor: default !important; }
        .remocn-caption-picker [data-caption-options] { container-type: inline-size; }
        .remocn-caption-picker [data-caption-options] > div { grid-template-columns: minmax(0, 1fr); gap: 8px; }
        .remocn-caption-picker [data-caption-options] .text-sm,
        .remocn-caption-picker [data-caption-options] [role="slider"] span { font-size: 12px; }
        @container (min-width: 380px) {
          .remocn-caption-picker [data-caption-options] > div { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
      {style && name ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <header className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setName(null)}
              className="flex items-center gap-1.5 rounded-sm text-xs text-muted-foreground hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeftIcon size={14} /> All styles
            </button>
            <h1
              className="min-w-0 flex-1 truncate text-sm font-semibold"
              title={style.description}
            >
              {style.title?.replace(/^Caption /, "")}
            </h1>
            <a
              href={`/docs/captions/components/${name}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm text-xs text-muted-foreground hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Docs ↗
            </a>
          </header>
          {loadedStyle?.payload ? (
            <ComponentPreview
              key={name}
              name={name}
              studioElement={loadedStyle.payload}
              layout="caption-picker"
            />
          ) : (
            <output className="flex min-h-0 flex-1 items-center justify-center text-xs text-muted-foreground">
              {loadedStyle
                ? "Could not load this style. Try another style."
                : "Loading style…"}
            </output>
          )}
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Sample preview · Studio adds your generated transcript
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul
            aria-label="Caption styles"
            className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-x-3 gap-y-4"
          >
            {styles.map((item) => (
              <li key={item.name} className="min-w-0">
                <CaptionStyleCard
                  name={item.name}
                  title={item.title?.replace(/^Caption /, "") ?? item.name}
                  description={item.description ?? ""}
                  onOpen={() => {
                    scrollRef.current = gridRef.current?.scrollTop ?? 0;
                    lastOpenedRef.current = item.name;
                    setName(item.name);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

// Actual caption components, mounted only near the viewport. Like Remotion's
// Element cards, previews animate on hover / keyboard focus, not all at once.
function CaptionStyleCard({
  name,
  title,
  description,
  onOpen,
}: {
  name: string;
  title: string;
  description: string;
  onOpen: () => void;
}) {
  const preview = previewManifest[name];
  const entry = components[name];
  const playerRef = useRef<PlayerRef>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const playing = visible && !reducedMotion && (hovered || focused);
  const { containerRef } = useAutoplay(playerRef, playing);
  const initialFrame = Math.min(96, (preview?.durationInFrames ?? 1) - 1);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([item]) => setVisible(item.isIntersecting),
      {
        rootMargin: "100px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (playing) return;
    playerRef.current?.pause();
    playerRef.current?.seekTo(initialFrame);
  }, [playing, initialFrame]);

  return (
    <button
      ref={buttonRef}
      type="button"
      data-caption-style={name}
      aria-label={`Customize ${title}`}
      title={description}
      onClick={onOpen}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="group flex w-full flex-col gap-2 rounded-sm text-left text-muted-foreground hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none relative aspect-video w-full overflow-hidden rounded-md border border-transparent bg-[#262626] transition-colors group-hover:border-[#59636d]"
      >
        <div ref={containerRef} className="size-full">
          {visible && entry && preview ? (
            <Player
              ref={playerRef}
              lazyComponent={entry.load}
              // Enlarge only the gallery sample, never the installed style.
              inputProps={{
                ...preview.defaults,
                fontSize: Math.max(96, Number(preview.defaults.fontSize) || 96),
              }}
              durationInFrames={preview.durationInFrames}
              fps={preview.fps}
              compositionWidth={preview.compositionWidth}
              compositionHeight={preview.compositionHeight}
              initialFrame={initialFrame}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              spaceKeyToPlayOrPause={false}
              loop
              acknowledgeRemotionLicense
            />
          ) : null}
        </div>
      </div>
      <span className="flex w-full items-center justify-between gap-2 text-[13px] leading-4">
        <span className="truncate">{title}</span>
        <span className="shrink-0 text-[10px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
          Customize
        </span>
      </span>
    </button>
  );
}
