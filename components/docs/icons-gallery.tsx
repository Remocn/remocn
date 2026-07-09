"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { Check, Copy, Search } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill } from "remotion";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import registry, { type RegistryEntry } from "@/registry/__index__";
import { AlertTriangleIconStatic } from "@/registry/remocn/icon-alert-triangle";
import { ArrowDownIconStatic } from "@/registry/remocn/icon-arrow-down";
import { ArrowLeftIconStatic } from "@/registry/remocn/icon-arrow-left";
import { ArrowRightIconStatic } from "@/registry/remocn/icon-arrow-right";
import { ArrowUpIconStatic } from "@/registry/remocn/icon-arrow-up";
import { AtSignIconStatic } from "@/registry/remocn/icon-at-sign";
import { BellIconStatic } from "@/registry/remocn/icon-bell";
import { BookmarkIconStatic } from "@/registry/remocn/icon-bookmark";
import { CalendarIconStatic } from "@/registry/remocn/icon-calendar";
import { CameraIconStatic } from "@/registry/remocn/icon-camera";
import { CheckCircleIconStatic } from "@/registry/remocn/icon-check-circle";
import { CheckIconStatic } from "@/registry/remocn/icon-check";
import { ChevronDownIconStatic } from "@/registry/remocn/icon-chevron-down";
import { ChevronLeftIconStatic } from "@/registry/remocn/icon-chevron-left";
import { ChevronRightIconStatic } from "@/registry/remocn/icon-chevron-right";
import { ChevronUpIconStatic } from "@/registry/remocn/icon-chevron-up";
import { ClockIconStatic } from "@/registry/remocn/icon-clock";
import { CodeIconStatic } from "@/registry/remocn/icon-code";
import { CopyIconStatic } from "@/registry/remocn/icon-copy";
import { DownloadIconStatic } from "@/registry/remocn/icon-download";
import { ExternalLinkIconStatic } from "@/registry/remocn/icon-external-link";
import { EyeOffIconStatic } from "@/registry/remocn/icon-eye-off";
import { EyeIconStatic } from "@/registry/remocn/icon-eye";
import { FileTextIconStatic } from "@/registry/remocn/icon-file-text";
import { FilterIconStatic } from "@/registry/remocn/icon-filter";
import { FlameIconStatic } from "@/registry/remocn/icon-flame";
import { FolderIconStatic } from "@/registry/remocn/icon-folder";
import { HeartIconStatic } from "@/registry/remocn/icon-heart";
import { HelpCircleIconStatic } from "@/registry/remocn/icon-help-circle";
import { HomeIconStatic } from "@/registry/remocn/icon-home";
import { ImageIconStatic } from "@/registry/remocn/icon-image";
import { InboxIconStatic } from "@/registry/remocn/icon-inbox";
import { InfoIconStatic } from "@/registry/remocn/icon-info";
import { KeyIconStatic } from "@/registry/remocn/icon-key";
import { LayoutGridIconStatic } from "@/registry/remocn/icon-layout-grid";
import { LinkIconStatic } from "@/registry/remocn/icon-link";
import { LoaderIconStatic } from "@/registry/remocn/icon-loader";
import { LockIconStatic } from "@/registry/remocn/icon-lock";
import { LogOutIconStatic } from "@/registry/remocn/icon-log-out";
import { MailIconStatic } from "@/registry/remocn/icon-mail";
import { MaximizeIconStatic } from "@/registry/remocn/icon-maximize";
import { MenuIconStatic } from "@/registry/remocn/icon-menu";
import { MessageCircleIconStatic } from "@/registry/remocn/icon-message-circle";
import { MicIconStatic } from "@/registry/remocn/icon-mic";
import { MoreHorizontalIconStatic } from "@/registry/remocn/icon-more-horizontal";
import { PartyPopperIconStatic } from "@/registry/remocn/icon-party-popper";
import { PauseIconStatic } from "@/registry/remocn/icon-pause";
import { PencilIconStatic } from "@/registry/remocn/icon-pencil";
import { PhoneIconStatic } from "@/registry/remocn/icon-phone";
import { PlayIconStatic } from "@/registry/remocn/icon-play";
import { PlusIconStatic } from "@/registry/remocn/icon-plus";
import { PlusCircleIconStatic } from "@/registry/remocn/icon-plus-circle";
import { RefreshCwIconStatic } from "@/registry/remocn/icon-refresh-cw";
import { SaveIconStatic } from "@/registry/remocn/icon-save";
import { SearchIconStatic } from "@/registry/remocn/icon-search";
import { SendIconStatic } from "@/registry/remocn/icon-send";
import { Share2IconStatic } from "@/registry/remocn/icon-share-2";
import { SettingsIconStatic } from "@/registry/remocn/icon-settings";
import { ShieldIconStatic } from "@/registry/remocn/icon-shield";
import { SkipForwardIconStatic } from "@/registry/remocn/icon-skip-forward";
import { SparklesIconStatic } from "@/registry/remocn/icon-sparkles";
import { StarIconStatic } from "@/registry/remocn/icon-star";
import { TerminalIconStatic } from "@/registry/remocn/icon-terminal";
import { ThumbsUpIconStatic } from "@/registry/remocn/icon-thumbs-up";
import { TimerIconStatic } from "@/registry/remocn/icon-timer";
import { ZapIconStatic } from "@/registry/remocn/icon-zap";
import { TrashIconStatic } from "@/registry/remocn/icon-trash";
import { UploadIconStatic } from "@/registry/remocn/icon-upload";
import { UserPlusIconStatic } from "@/registry/remocn/icon-user-plus";
import { UserIconStatic } from "@/registry/remocn/icon-user";
import { UsersIconStatic } from "@/registry/remocn/icon-users";
import { VideoIconStatic } from "@/registry/remocn/icon-video";
import { Volume2IconStatic } from "@/registry/remocn/icon-volume-2";
import { VolumeXIconStatic } from "@/registry/remocn/icon-volume-x";
import { XIconStatic } from "@/registry/remocn/icon-x";
import { XCircleIconStatic } from "@/registry/remocn/icon-x-circle";

export type IconCategory =
  | "Status & feedback"
  | "Actions & UI"
  | "Media & playback"
  | "People & communication"
  | "Time & planning"
  | "Files & dev"
  | "Devices & theme"
  | "Commerce"
  | "Charts & data"
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
    name: "icon-shield",
    label: "Shield",
    category: "Status & feedback",
    Static: ShieldIconStatic,
  },
  {
    name: "icon-help-circle",
    label: "Help Circle",
    category: "Status & feedback",
    Static: HelpCircleIconStatic,
  },
  {
    name: "icon-plus-circle",
    label: "Plus Circle",
    category: "Status & feedback",
    Static: PlusCircleIconStatic,
  },
  {
    name: "icon-x-circle",
    label: "X Circle",
    category: "Status & feedback",
    Static: XCircleIconStatic,
  },
  {
    name: "icon-calendar",
    label: "Calendar",
    category: "Time & planning",
    Static: CalendarIconStatic,
  },
  {
    name: "icon-clock",
    label: "Clock",
    category: "Time & planning",
    Static: ClockIconStatic,
  },
  {
    name: "icon-timer",
    label: "Timer",
    category: "Time & planning",
    Static: TimerIconStatic,
  },
  {
    name: "icon-home",
    label: "Home",
    category: "Files & dev",
    Static: HomeIconStatic,
  },
  {
    name: "icon-folder",
    label: "Folder",
    category: "Files & dev",
    Static: FolderIconStatic,
  },
  {
    name: "icon-file-text",
    label: "File Text",
    category: "Files & dev",
    Static: FileTextIconStatic,
  },
  {
    name: "icon-code",
    label: "Code",
    category: "Files & dev",
    Static: CodeIconStatic,
  },
  {
    name: "icon-terminal",
    label: "Terminal",
    category: "Files & dev",
    Static: TerminalIconStatic,
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
  {
    name: "icon-send",
    label: "Send",
    category: "Actions & UI",
    Static: SendIconStatic,
  },
  {
    name: "icon-menu",
    label: "Menu",
    category: "Actions & UI",
    Static: MenuIconStatic,
  },
  {
    name: "icon-more-horizontal",
    label: "More Horizontal",
    category: "Actions & UI",
    Static: MoreHorizontalIconStatic,
  },
  {
    name: "icon-maximize",
    label: "Maximize",
    category: "Actions & UI",
    Static: MaximizeIconStatic,
  },
  {
    name: "icon-layout-grid",
    label: "Layout Grid",
    category: "Actions & UI",
    Static: LayoutGridIconStatic,
  },
  {
    name: "icon-pencil",
    label: "Pencil",
    category: "Actions & UI",
    Static: PencilIconStatic,
  },
  {
    name: "icon-share-2",
    label: "Share 2",
    category: "Actions & UI",
    Static: Share2IconStatic,
  },
  {
    name: "icon-filter",
    label: "Filter",
    category: "Actions & UI",
    Static: FilterIconStatic,
  },
  {
    name: "icon-eye",
    label: "Eye",
    category: "Actions & UI",
    Static: EyeIconStatic,
  },
  {
    name: "icon-eye-off",
    label: "Eye Off",
    category: "Actions & UI",
    Static: EyeOffIconStatic,
  },
  {
    name: "icon-save",
    label: "Save",
    category: "Actions & UI",
    Static: SaveIconStatic,
  },
  {
    name: "icon-link",
    label: "Link",
    category: "Actions & UI",
    Static: LinkIconStatic,
  },
  {
    name: "icon-bookmark",
    label: "Bookmark",
    category: "Actions & UI",
    Static: BookmarkIconStatic,
  },
  {
    name: "icon-lock",
    label: "Lock",
    category: "Actions & UI",
    Static: LockIconStatic,
  },
  {
    name: "icon-key",
    label: "Key",
    category: "Actions & UI",
    Static: KeyIconStatic,
  },
  {
    name: "icon-log-out",
    label: "Log Out",
    category: "Actions & UI",
    Static: LogOutIconStatic,
  },
  {
    name: "icon-play",
    label: "Play",
    category: "Media & playback",
    Static: PlayIconStatic,
  },
  {
    name: "icon-pause",
    label: "Pause",
    category: "Media & playback",
    Static: PauseIconStatic,
  },
  {
    name: "icon-skip-forward",
    label: "Skip Forward",
    category: "Media & playback",
    Static: SkipForwardIconStatic,
  },
  {
    name: "icon-volume-2",
    label: "Volume 2",
    category: "Media & playback",
    Static: Volume2IconStatic,
  },
  {
    name: "icon-volume-x",
    label: "Volume X",
    category: "Media & playback",
    Static: VolumeXIconStatic,
  },
  {
    name: "icon-mic",
    label: "Mic",
    category: "Media & playback",
    Static: MicIconStatic,
  },
  {
    name: "icon-video",
    label: "Video",
    category: "Media & playback",
    Static: VideoIconStatic,
  },
  {
    name: "icon-camera",
    label: "Camera",
    category: "Media & playback",
    Static: CameraIconStatic,
  },
  {
    name: "icon-image",
    label: "Image",
    category: "Media & playback",
    Static: ImageIconStatic,
  },
  {
    name: "icon-user",
    label: "User",
    category: "People & communication",
    Static: UserIconStatic,
  },
  {
    name: "icon-users",
    label: "Users",
    category: "People & communication",
    Static: UsersIconStatic,
  },
  {
    name: "icon-user-plus",
    label: "User Plus",
    category: "People & communication",
    Static: UserPlusIconStatic,
  },
  {
    name: "icon-mail",
    label: "Mail",
    category: "People & communication",
    Static: MailIconStatic,
  },
  {
    name: "icon-message-circle",
    label: "Message Circle",
    category: "People & communication",
    Static: MessageCircleIconStatic,
  },
  {
    name: "icon-phone",
    label: "Phone",
    category: "People & communication",
    Static: PhoneIconStatic,
  },
  {
    name: "icon-at-sign",
    label: "At Sign",
    category: "People & communication",
    Static: AtSignIconStatic,
  },
  {
    name: "icon-inbox",
    label: "Inbox",
    category: "People & communication",
    Static: InboxIconStatic,
  },
  {
    name: "icon-heart",
    label: "Heart",
    category: "Emotion & accents",
    Static: HeartIconStatic,
  },
  {
    name: "icon-star",
    label: "Star",
    category: "Emotion & accents",
    Static: StarIconStatic,
  },
  {
    name: "icon-sparkles",
    label: "Sparkles",
    category: "Emotion & accents",
    Static: SparklesIconStatic,
  },
  {
    name: "icon-zap",
    label: "Zap",
    category: "Emotion & accents",
    Static: ZapIconStatic,
  },
  {
    name: "icon-flame",
    label: "Flame",
    category: "Emotion & accents",
    Static: FlameIconStatic,
  },
  {
    name: "icon-thumbs-up",
    label: "Thumbs Up",
    category: "Emotion & accents",
    Static: ThumbsUpIconStatic,
  },
  {
    name: "icon-party-popper",
    label: "Party Popper",
    category: "Emotion & accents",
    Static: PartyPopperIconStatic,
  },
  {
    name: "icon-arrow-right",
    label: "Arrow Right",
    category: "Arrows & navigation",
    Static: ArrowRightIconStatic,
  },
  {
    name: "icon-arrow-left",
    label: "Arrow Left",
    category: "Arrows & navigation",
    Static: ArrowLeftIconStatic,
  },
  {
    name: "icon-arrow-up",
    label: "Arrow Up",
    category: "Arrows & navigation",
    Static: ArrowUpIconStatic,
  },
  {
    name: "icon-arrow-down",
    label: "Arrow Down",
    category: "Arrows & navigation",
    Static: ArrowDownIconStatic,
  },
  {
    name: "icon-external-link",
    label: "External Link",
    category: "Arrows & navigation",
    Static: ExternalLinkIconStatic,
  },
  {
    name: "icon-chevron-up",
    label: "Chevron Up",
    category: "Arrows & navigation",
    Static: ChevronUpIconStatic,
  },
  {
    name: "icon-chevron-down",
    label: "Chevron Down",
    category: "Arrows & navigation",
    Static: ChevronDownIconStatic,
  },
  {
    name: "icon-chevron-left",
    label: "Chevron Left",
    category: "Arrows & navigation",
    Static: ChevronLeftIconStatic,
  },
  {
    name: "icon-chevron-right",
    label: "Chevron Right",
    category: "Arrows & navigation",
    Static: ChevronRightIconStatic,
  },
];

const CATEGORY_ORDER: IconCategory[] = [
  "Status & feedback",
  "Actions & UI",
  "Media & playback",
  "People & communication",
  "Time & planning",
  "Files & dev",
  "Devices & theme",
  "Commerce",
  "Charts & data",
  "Emotion & accents",
  "Arrows & navigation",
];

const MEDIA_SIZE = 80;
const GLYPH_SIZE = 48;
const COMPOSITION_SIZE = 80;

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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
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
        style={{ width: MEDIA_SIZE, height: MEDIA_SIZE }}
      >
        {playing && entry ? (
          <IconPlayer entry={entry} />
        ) : (
          <Static size={GLYPH_SIZE} strokeWidth={2} />
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

  const centeredComponent = useMemo(
    () => () =>
      load().then((m) => {
        const Icon = m.default as ComponentType<{ size?: number }>;
        return {
          default: () => (
            <AbsoluteFill
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <Icon size={GLYPH_SIZE} />
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
      durationInFrames={config.durationInFrames}
      fps={config.fps}
      compositionWidth={COMPOSITION_SIZE}
      compositionHeight={COMPOSITION_SIZE}
      style={{ width: MEDIA_SIZE, height: MEDIA_SIZE }}
      loop
      initiallyMuted
      acknowledgeRemotionLicense
    />
  );
}
