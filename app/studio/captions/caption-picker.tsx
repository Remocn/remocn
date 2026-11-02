"use client";

import { Player, type PlayerRef } from "@remotion/player";
import {
  isInsideStudio,
  type StudioElementPayload,
  subscribeToCaptionStyleSelection,
} from "@remotion/studio-protocol";
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import { ComponentPreview } from "@/components/docs/component-preview";
import captionsMeta from "@/content/docs/captions/components/meta.json";
import {
  getCachedStudioElement,
  loadStudioElement,
} from "@/lib/studio-element";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import components from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import registry from "@/registry/remocn/registry.json";

// Same order as the Captions sidebar in the docs.
const styles = captionsMeta.pages.flatMap((page) => {
  const item = registry.items.find(
    (entry) => entry.type === "registry:component" && entry.name === page,
  );
  return item
    ? [
        {
          name: item.name,
          title: item.title?.replace(/^Caption /, "") ?? item.name,
          description: item.description ?? "",
        },
      ]
    : [];
});

const thinScrollbar =
  "[scrollbar-color:color-mix(in_oklab,currentColor_25%,transparent)_transparent] [scrollbar-width:thin]";

// Studio's current caption style, only while this page is its caption picker.
function useStudioCaptionStyle() {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const context = new URLSearchParams(window.location.search).get(
      "remotion-studio-context",
    );
    if (!isInsideStudio() || context !== "captions") return;
    return subscribeToCaptionStyleSelection(setSlug);
  }, []);
  return slug;
}

export function StudioCaptionPicker() {
  const [requestedName, setName] = useQueryState(
    "caption_style",
    parseAsString,
  );
  const style = styles.find((item) => item.name === requestedName);
  const name = style?.name ?? null;
  const selectedSlug = useStudioCaptionStyle();
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

  // Back on the grid: restore the scroll position and focus the card the
  // user came from.
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
  const cached = name ? getCachedStudioElement(name) : null;
  const loadedStyle =
    loaded?.name === name
      ? loaded
      : name && cached
        ? { name, payload: cached }
        : null;

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      {style && name ? (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          {loadedStyle?.payload ? (
            <ComponentPreview
              key={loadedStyle.name}
              name={loadedStyle.name}
              studioElement={loadedStyle.payload}
              layout="caption-picker"
              header={{
                start: <BackLink onClick={() => setName(null)} />,
                title: style.title,
                end: <DocsLink name={name} />,
              }}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="justify-self-start">
                  <BackLink onClick={() => setName(null)} />
                </div>
                <h1 className="truncate text-center text-sm font-semibold tracking-tight">
                  {style.title}
                </h1>
              </div>
              <output className="flex aspect-video w-[40%] items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                {loadedStyle ? "Could not load this style." : "Loading…"}
              </output>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={gridRef}
          className={cn("min-h-0 flex-1 overflow-y-auto p-4", thinScrollbar)}
        >
          <ul
            aria-label="Caption styles"
            className="grid grid-cols-2 gap-x-2 gap-y-3 min-[400px]:grid-cols-3 min-[540px]:grid-cols-4 min-[900px]:grid-cols-5 min-[1200px]:grid-cols-6"
          >
            {styles.map((item) => (
              <li key={item.name} className="min-w-0">
                <CaptionStyleCard
                  name={item.name}
                  title={item.title}
                  description={item.description}
                  selectedInStudio={item.name === selectedSlug}
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

// A live thumbnail of the style. Players mount only near the viewport and
// play on hover or keyboard focus, so 31 cards never animate at once.
function CaptionStyleCard({
  name,
  title,
  description,
  selectedInStudio,
  onOpen,
}: {
  name: string;
  title: string;
  description: string;
  selectedInStudio: boolean;
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
    const observer = new IntersectionObserver(
      ([item]) => setVisible(item.isIntersecting),
      { rootMargin: "200px" },
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
      aria-label={`Customize ${title}${selectedInStudio ? " (selected in Studio)" : ""}`}
      title={description}
      onClick={onOpen}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="group/card flex w-full flex-col gap-1.5 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div
        aria-hidden="true"
        className={cn(
          "surface-card pointer-events-none aspect-video w-full overflow-hidden rounded-lg transition-[transform,box-shadow] group-hover/card:-translate-y-0.5 group-hover/card:[box-shadow:var(--elevation-raised-hover)] motion-reduce:transition-none motion-reduce:group-hover/card:translate-y-0",
          selectedInStudio && "ring-2 ring-foreground",
        )}
      >
        <div ref={containerRef} className="size-full bg-[#262626]">
          {visible && entry && preview ? (
            <Player
              ref={playerRef}
              lazyComponent={entry.load}
              // Bigger type keeps the sample legible at thumbnail size; the
              // installed style keeps its own defaults.
              inputProps={{
                ...preview.defaults,
                fontSize: Math.max(
                  150,
                  Number(preview.defaults.fontSize) || 150,
                ),
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
      <span className="flex items-center gap-1.5 px-0.5 text-xs tracking-[-0.01em]">
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selectedInStudio
              ? "font-medium text-foreground"
              : "text-muted-foreground group-hover/card:text-foreground",
          )}
        >
          {title}
        </span>
        {selectedInStudio ? (
          <CheckIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-foreground"
          />
        ) : null}
      </span>
    </button>
  );
}

const linkClass =
  "flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40";

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("-ml-1", linkClass)}>
      <ArrowLeftIcon className="size-3.5" />
      All styles
    </button>
  );
}

function DocsLink({ name }: { name: string }) {
  return (
    <a
      href={`/docs/captions/components/${name}`}
      target="_blank"
      rel="noreferrer"
      className={linkClass}
    >
      Docs
      <ArrowUpRightIcon className="size-3.5" />
    </a>
  );
}
