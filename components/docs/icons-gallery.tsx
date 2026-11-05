"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { installInStudio, setStudioDragData } from "@remotion/studio-protocol";
import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill } from "remotion";
import { CopyIcon } from "@/components/docs/copy-button";
import { FilterChip } from "@/components/docs/index/filter-chip";
import { FilterField } from "@/components/docs/index/filter-field";
import {
  ICONS,
  type IconCategory,
  type IconEntry,
} from "@/components/docs/index/icons/icons";
import { Remotion } from "@/components/ui/svgs/remotion";
import {
  getCachedStudioElement,
  loadStudioElement,
} from "@/lib/studio-element";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import registry, { type RegistryEntry } from "@/registry/__index__";
import {
  type PreviewManifestEntry,
  previewManifest,
} from "@/registry/__manifest__";

/** Tiles shown before "Show all" when no filter narrows the grid. */
const PAGE_SIZE = 48;
const MEDIA_SIZE = 32;
const GLYPH_SIZE = 26;
const COMPOSITION_SIZE = 80;
const COMPOSITION_GLYPH = 64;

/** Phones get the 44px chip height the other index filter bars use. */
const chip = "max-sm:h-11 max-sm:rounded-control-sm max-sm:px-3.5";

/** Categories with their icon counts, largest first. */
const CATEGORIES = Object.entries(
  ICONS.reduce<Record<string, number>>((counts, icon) => {
    counts[icon.category] = (counts[icon.category] ?? 0) + 1;
    return counts;
  }, {}),
)
  .map(([category, count]) => ({ category: category as IconCategory, count }))
  .sort((a, b) => b.count - a.count);

/**
 * The icon gallery: search, category chips and a tile grid. Hovering or
 * focusing a tile plays its motion; clicking copies the install command; the
 * corner button adds the icon to a running Remotion Studio.
 */
export function IconsGallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICONS.filter(
      (icon) =>
        (!category || icon.category === category) &&
        (!q ||
          icon.label.toLowerCase().includes(q) ||
          icon.name.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const narrowed = Boolean(query.trim() || category);
  const visible =
    narrowed || expanded ? filtered : filtered.slice(0, PAGE_SIZE);

  return (
    <div className="not-prose mt-4 flex flex-col gap-4" data-not-typeset>
      <FilterField
        aria-label="Search icons"
        placeholder={`Search ${ICONS.length} icons`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-11 sm:h-12"
      />
      <fieldset className="-mx-5 my-0 flex min-w-0 gap-1.5 border-0 py-0 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <legend className="sr-only">Icon categories</legend>
        <FilterChip
          active={!category}
          count={ICONS.length}
          onClick={() => setCategory(null)}
          className={chip}
        >
          All
        </FilterChip>
        {CATEGORIES.map((item) => (
          <FilterChip
            key={item.category}
            active={category === item.category}
            count={item.count}
            onClick={() =>
              setCategory((current) =>
                current === item.category ? null : item.category,
              )
            }
            className={chip}
          >
            {item.category}
          </FilterChip>
        ))}
      </fieldset>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-small text-muted-foreground">
          No icons match your search.
        </p>
      ) : (
        <ul className="grid grid-cols-4 gap-2 pt-1 sm:grid-cols-6">
          {visible.map((icon) => (
            <li key={icon.name}>
              <IconTile
                icon={icon}
                active={active === icon.name}
                onActivate={() => setActive(icon.name)}
                onDeactivate={() =>
                  setActive((current) =>
                    current === icon.name ? null : current,
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
        <p
          className="text-small text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          Showing {visible.length} of{" "}
          {narrowed ? filtered.length : ICONS.length}
        </p>
        {!narrowed && filtered.length > PAGE_SIZE && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-control-sm bg-secondary px-4 text-small font-medium text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-3 focus-visible:ring-ring sm:h-10 sm:w-auto dark:hover:bg-[#33363b]"
          >
            {expanded ? "Show fewer" : `Show all ${ICONS.length} icons`}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={cn(
                "size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]",
                expanded && "rotate-180",
              )}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function IconTile({
  icon,
  active,
  onActivate,
  onDeactivate,
}: {
  icon: IconEntry;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const entry = registry[icon.name];
  const preview = previewManifest[icon.name];
  const command = `npx shadcn@latest add @remocn/${icon.name}`;
  const playing = active && !reducedMotion && Boolean(entry && preview);
  const Static = icon.Static;
  const label = icon.name.replace(/^icon-/, "");

  const handleCopy = () => {
    void navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleActivate = () => {
    onActivate();
    void loadStudioElement(icon.name);
  };

  const handleDragStart = (event: React.DragEvent) => {
    const payload = getCachedStudioElement(icon.name);
    if (!payload) return;
    setStudioDragData({ dataTransfer: event.dataTransfer, payload });
  };

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    setInstallError(null);
    const payload = await loadStudioElement(icon.name);
    if (!payload) {
      setInstalling(false);
      return;
    }
    const result = await installInStudio({ payload });
    setInstalling(false);
    if (!result.success) {
      setInstallError(result.message);
      setTimeout(() => setInstallError(null), 5000);
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        draggable
        onDragStart={handleDragStart}
        onClick={handleCopy}
        onMouseEnter={handleActivate}
        onMouseLeave={onDeactivate}
        onFocus={handleActivate}
        onBlur={onDeactivate}
        title={command}
        aria-label={`Copy install command for ${icon.label}`}
        className={cn(
          "flex h-[104px] w-full flex-col items-center justify-center gap-3 rounded-control border border-hairline bg-surface px-1 text-muted-foreground outline-none transition-[border-color,box-shadow,color] duration-150",
          "hover:border-divider hover:text-foreground hover:shadow-[0_8px_20px_rgb(14_16_18/10%),0_1px_2px_rgb(14_16_18/8%)] focus-visible:ring-3 focus-visible:ring-ring dark:hover:shadow-[0_8px_20px_rgb(0_0_0/45%)]",
          active && "border-divider text-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className="flex items-center justify-center text-foreground"
          style={{ width: MEDIA_SIZE, height: MEDIA_SIZE }}
        >
          {playing && entry && preview ? (
            <IconPlayer load={entry.load} preview={preview} />
          ) : (
            <Static size={GLYPH_SIZE} strokeWidth={2} />
          )}
        </span>
        <span className="max-w-full text-center text-caption leading-4 [overflow-wrap:anywhere]">
          {label}
        </span>
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2 right-2 flex size-[22px] items-center justify-center rounded-tag bg-secondary text-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <svg
            viewBox="0 0 24 24"
            className="size-[11px] fill-none stroke-current stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <CopyIcon className="size-[11px]" />
        )}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied install command for ${icon.label}` : ""}
      </span>
      <button
        type="button"
        onClick={handleInstall}
        aria-label={`Add ${icon.label} to Remotion Studio`}
        title="Add to Remotion Studio"
        className="absolute top-2 left-2 flex size-[22px] items-center justify-center rounded-tag text-muted-foreground opacity-0 outline-none transition-opacity before:absolute before:-inset-1 group-hover:opacity-100 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:hidden"
      >
        {installing ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-3 animate-spin fill-none stroke-current stroke-[2.4] [stroke-linecap:round]"
          >
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
        ) : (
          <Remotion className="size-3" />
        )}
      </button>
      {installError ? (
        <span
          title={installError}
          className="absolute inset-x-1.5 bottom-1.5 truncate rounded-tag bg-background/90 px-1.5 py-0.5 text-micro text-muted-foreground"
        >
          {installError}
        </span>
      ) : null}
    </div>
  );
}

function IconPlayer({
  load,
  preview,
}: {
  load: RegistryEntry["load"];
  preview: PreviewManifestEntry;
}) {
  const playerRef = useRef<PlayerRef>(null);

  const centeredComponent = useMemo(
    () => () =>
      load().then((m) => {
        const Icon = m.default as ComponentType<{ size?: number }>;
        return {
          default: () => (
            <AbsoluteFill
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <Icon size={COMPOSITION_GLYPH} />
            </AbsoluteFill>
          ),
        };
      }),
    [load],
  );

  useEffect(() => {
    let raf = 0;
    let tries = 0;
    let cancelled = false;
    const pump = () => {
      if (cancelled) return;
      const player = playerRef.current;
      if (player) {
        player.play();
        if (player.getCurrentFrame() > 0) return;
      }
      tries += 1;
      if (tries < 120) raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Player
      ref={playerRef}
      lazyComponent={centeredComponent}
      durationInFrames={preview.durationInFrames}
      fps={preview.fps}
      compositionWidth={COMPOSITION_SIZE}
      compositionHeight={COMPOSITION_SIZE}
      style={{ width: MEDIA_SIZE, height: MEDIA_SIZE }}
      loop
      initiallyMuted
      acknowledgeRemotionLicense
    />
  );
}
