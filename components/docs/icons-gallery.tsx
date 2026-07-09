"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Check, Copy, Search } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import registry, { type RegistryEntry } from "@/registry/__index__";
import { AlertTriangleIconStatic } from "@/registry/remocn/icon-alert-triangle";
import { BellIconStatic } from "@/registry/remocn/icon-bell";
import { CheckCircleIconStatic } from "@/registry/remocn/icon-check-circle";
import { CheckIconStatic } from "@/registry/remocn/icon-check";
import { CopyIconStatic } from "@/registry/remocn/icon-copy";
import { DownloadIconStatic } from "@/registry/remocn/icon-download";
import { InfoIconStatic } from "@/registry/remocn/icon-info";
import { LoaderIconStatic } from "@/registry/remocn/icon-loader";
import { PlusIconStatic } from "@/registry/remocn/icon-plus";
import { RefreshCwIconStatic } from "@/registry/remocn/icon-refresh-cw";
import { SearchIconStatic } from "@/registry/remocn/icon-search";
import { SettingsIconStatic } from "@/registry/remocn/icon-settings";
import { TrashIconStatic } from "@/registry/remocn/icon-trash";
import { UploadIconStatic } from "@/registry/remocn/icon-upload";
import { XIconStatic } from "@/registry/remocn/icon-x";

export type IconCategory =
  | "Status & feedback"
  | "Actions & UI"
  | "Emotion & accents"
  | "Arrows & navigation";

export interface IconEntry {
  name: string;
  label: string;
  category: IconCategory;
  Static: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}

export const ICONS: IconEntry[] = [
  {
    name: "icon-check",
    label: "Check",
    category: "Status & feedback",
    Static: CheckIconStatic,
  },
  {
    name: "icon-check-circle",
    label: "Check Circle",
    category: "Status & feedback",
    Static: CheckCircleIconStatic,
  },
  {
    name: "icon-x",
    label: "X",
    category: "Status & feedback",
    Static: XIconStatic,
  },
  {
    name: "icon-alert-triangle",
    label: "Alert Triangle",
    category: "Status & feedback",
    Static: AlertTriangleIconStatic,
  },
  {
    name: "icon-info",
    label: "Info",
    category: "Status & feedback",
    Static: InfoIconStatic,
  },
  {
    name: "icon-loader",
    label: "Loader",
    category: "Status & feedback",
    Static: LoaderIconStatic,
  },
  {
    name: "icon-refresh-cw",
    label: "Refresh Cw",
    category: "Status & feedback",
    Static: RefreshCwIconStatic,
  },
  {
    name: "icon-search",
    label: "Search",
    category: "Actions & UI",
    Static: SearchIconStatic,
  },
  {
    name: "icon-bell",
    label: "Bell",
    category: "Actions & UI",
    Static: BellIconStatic,
  },
  {
    name: "icon-download",
    label: "Download",
    category: "Actions & UI",
    Static: DownloadIconStatic,
  },
  {
    name: "icon-upload",
    label: "Upload",
    category: "Actions & UI",
    Static: UploadIconStatic,
  },
  {
    name: "icon-copy",
    label: "Copy",
    category: "Actions & UI",
    Static: CopyIconStatic,
  },
  {
    name: "icon-settings",
    label: "Settings",
    category: "Actions & UI",
    Static: SettingsIconStatic,
  },
  {
    name: "icon-trash",
    label: "Trash",
    category: "Actions & UI",
    Static: TrashIconStatic,
  },
  {
    name: "icon-plus",
    label: "Plus",
    category: "Actions & UI",
    Static: PlusIconStatic,
  },
];

const CATEGORY_ORDER: IconCategory[] = [
  "Status & feedback",
  "Actions & UI",
  "Emotion & accents",
  "Arrows & navigation",
];

const TILE_SIZE = 56;

export function IconsGallery() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICONS;
    return ICONS.filter(
      (icon) =>
        icon.label.toLowerCase().includes(q) ||
        icon.name.toLowerCase().includes(q),
    );
  }, [query]);

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        icons: filtered.filter((icon) => icon.category === category),
      })).filter((group) => group.icons.length > 0),
    [filtered],
  );

  return (
    <div className="not-prose flex flex-col gap-8">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter icons…"
          className="w-full rounded-lg border border-fd-border bg-fd-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {ICONS.length === 0
            ? "Icons are coming soon."
            : "No icons match your filter."}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {group.category}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
              {group.icons.map((icon) => (
                <IconTile
                  key={icon.name}
                  icon={icon}
                  active={active === icon.name}
                  onActivate={() => setActive(icon.name)}
                  onDeactivate={() =>
                    setActive((current) =>
                      current === icon.name ? null : current,
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}
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
  const entry = registry[icon.name];
  const command = `npx shadcn@latest add @remocn/${icon.name}`;
  const playing = active && !reducedMotion && Boolean(entry);
  const Static = icon.Static;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      title={command}
      aria-label={`Copy install command for ${icon.label}`}
      className={cn(
        "surface-card group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl p-3 text-muted-foreground transition-colors",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      <span
        className="flex items-center justify-center"
        style={{ width: TILE_SIZE, height: TILE_SIZE }}
      >
        {playing && entry ? (
          <IconPlayer entry={entry} />
        ) : (
          <Static size={TILE_SIZE} strokeWidth={2} />
        )}
      </span>
      <span className="max-w-full truncate text-xs">{icon.label}</span>
      <span className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </span>
    </button>
  );
}

function IconPlayer({ entry }: { entry: RegistryEntry }) {
  const playerRef = useRef<PlayerRef>(null);
  const { config, load } = entry;

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
      lazyComponent={load}
      durationInFrames={config.durationInFrames}
      fps={config.fps}
      compositionWidth={config.compositionWidth}
      compositionHeight={config.compositionHeight}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
      loop
      initiallyMuted
      acknowledgeRemotionLicense
    />
  );
}
