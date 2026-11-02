"use client";

import { useEffect, useState } from "react";
import {
  HeroHeadline,
  TILE_SLOT,
} from "@/app/(home)/components/landing/sections/hero/hero-headline";
import { AeTileComposition } from "@/app/(home)/components/landing/sections/hero/tiles/ae-tile";
import {
  AE_MODES,
  aeDuration,
  type ClipSpec,
  DEFAULT_CONFIG,
  type HeroTilesConfig,
  resolveReel,
  TRANSITIONS,
  VIDEO_MODES,
} from "@/app/(home)/components/landing/sections/hero/tiles/config";
import saved from "@/app/(home)/components/landing/sections/hero/tiles/hero-tiles.json";
import {
  type TilePlayback,
  TilePlayer,
} from "@/app/(home)/components/landing/sections/hero/tiles/tile-player";
import { VideoTileComposition } from "@/app/(home)/components/landing/sections/hero/tiles/video-tile";
import {
  CatalogPicker,
  ClipRow,
  newClip,
  Range,
  Segmented,
} from "@/app/lab/_components/clip-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RAIL_KEY = "lab:hero-tiles:rail:v2";

type Section = "video" | "ae";

type Knob = {
  section: Section;
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

const KNOBS: Knob[] = [
  {
    section: "video",
    key: "beat",
    label: "Beat (frames)",
    min: 36,
    max: 150,
    step: 2,
  },
  {
    section: "video",
    key: "transitionFrames",
    label: "Cut length (frames)",
    min: 0,
    max: 24,
    step: 1,
  },
  {
    section: "video",
    key: "tilt",
    label: "Rest tilt (deg)",
    min: -12,
    max: 0,
    step: 0.5,
  },
  {
    section: "video",
    key: "sway",
    label: "Sway on cut (deg)",
    min: 0,
    max: 10,
    step: 0.5,
  },
  {
    section: "video",
    key: "deckDepth",
    label: "Deck depth",
    min: 1,
    max: 3,
    step: 1,
  },
  {
    section: "video",
    key: "morph",
    label: "Morph squash",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    section: "ae",
    key: "period",
    label: "Period (frames)",
    min: 24,
    max: 90,
    step: 2,
  },
  {
    section: "ae",
    key: "bounce",
    label: "Bounce height",
    min: 0,
    max: 0.35,
    step: 0.01,
  },
  {
    section: "ae",
    key: "tilt",
    label: "Rest tilt (deg)",
    min: 0,
    max: 10,
    step: 0.5,
  },
  {
    section: "ae",
    key: "stallAt",
    label: "Stall at (%)",
    min: 80,
    max: 99,
    step: 1,
  },
  {
    section: "ae",
    key: "delay",
    label: "Delay vs video (frames)",
    min: 0,
    max: 120,
    step: 2,
  },
];

function readRail(): HeroTilesConfig[] {
  try {
    return JSON.parse(localStorage.getItem(RAIL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function HeroTilesLab() {
  const [config, setConfig] = useState<HeroTilesConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...(saved as HeroTilesConfig),
  }));
  const [rail, setRail] = useState<HeroTilesConfig[]>([]);
  const [written, setWritten] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<TilePlayback>("paused");
  const [aeState, setAeState] = useState<TilePlayback>("paused");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [soloIndex, setSoloIndex] = useState<number | null>(null);

  useEffect(() => setRail(readRail()), []);

  const clips = config.video.clips;
  const solo = soloIndex !== null ? clips[soloIndex] : undefined;
  const previewConfig: HeroTilesConfig = solo
    ? {
        ...config,
        video: { ...config.video, clips: [solo], transitionFrames: 0 },
      }
    : config;
  const reel = resolveReel(previewConfig);

  const setVideo = (patch: Partial<HeroTilesConfig["video"]>) =>
    setConfig((prev) => ({ ...prev, video: { ...prev.video, ...patch } }));
  const setAe = (patch: Partial<HeroTilesConfig["ae"]>) =>
    setConfig((prev) => ({ ...prev, ae: { ...prev.ae, ...patch } }));
  const setClips = (update: (clips: ClipSpec[]) => ClipSpec[]) =>
    setConfig((prev) => ({
      ...prev,
      video: { ...prev.video, clips: update(prev.video.clips) },
    }));

  const moveClip = (index: number, delta: number) => {
    const target = index + delta;
    setClips((list) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOpenIndex((open) =>
      open === index ? target : open === target ? index : open,
    );
    setSoloIndex((s) => (s === index ? target : s === target ? index : s));
  };

  const removeClip = (index: number) => {
    setClips((list) => list.filter((_, i) => i !== index));
    setOpenIndex(null);
    setSoloIndex(null);
  };

  const reseed = () =>
    setConfig((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 2 ** 31),
    }));

  const save = async () => {
    const json = JSON.stringify(config, null, 2);
    await navigator.clipboard?.writeText(json).catch(() => undefined);
    const nextRail = [
      config,
      ...rail.filter((c) => JSON.stringify(c) !== JSON.stringify(config)),
    ].slice(0, 12);
    setRail(nextRail);
    localStorage.setItem(RAIL_KEY, JSON.stringify(nextRail));
    const response = await fetch("/api/lab/hero-tiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    const body = (await response.json().catch(() => ({}))) as { path?: string };
    setWritten(body.path ?? "write failed");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center gap-10 px-6">
        <button
          type="button"
          aria-label="New variation"
          onClick={reseed}
          className="absolute inset-0 cursor-pointer outline-none"
        />
        <div className="pointer-events-none relative flex flex-col items-center gap-6">
          <HeroHeadline
            videoTile={
              <TilePlayer
                component={VideoTileComposition}
                config={previewConfig}
                durationInFrames={reel.durationInFrames}
                respectReducedMotion={false}
                onPlayback={setVideoState}
                className={TILE_SLOT}
              />
            }
            aeTile={
              <TilePlayer
                component={AeTileComposition}
                config={config}
                durationInFrames={aeDuration(config)}
                respectReducedMotion={false}
                onPlayback={setAeState}
                className={TILE_SLOT}
              />
            }
          />
          <span className="font-mono text-xs text-muted-foreground">
            {solo
              ? `solo ${solo.name}`
              : `seed ${config.seed}, ${reel.cuts
                  .slice(0, -1)
                  .map((c) => c.kind)
                  .join(", ")}, click for new cuts`}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            video {videoState}, ae {aeState}
          </span>
        </div>
      </div>

      <aside className="sticky top-0 flex h-screen w-[400px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-border bg-background/95 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            seed {config.seed}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={reseed}>
              New cuts
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </div>
        {written && (
          <p className="font-mono text-[11px] text-muted-foreground">
            wrote {written}
          </p>
        )}

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">
              Clip ({clips.length}, {(reel.durationInFrames / 30).toFixed(1)}s
              loop)
            </Label>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setClips(() => DEFAULT_CONFIG.video.clips);
                setOpenIndex(null);
                setSoloIndex(null);
              }}
            >
              Reset
            </Button>
          </div>
          {clips.map((clip, index) => (
            <ClipRow
              key={`${clip.name}-${index}`}
              clip={clip}
              index={index}
              count={clips.length}
              open={openIndex === index}
              solo={soloIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              onSolo={() => setSoloIndex(soloIndex === index ? null : index)}
              onMove={(delta) => moveClip(index, delta)}
              onRemove={() => removeClip(index)}
              onChange={(patch) =>
                setClips((list) =>
                  list.map((c, i) => (i === index ? { ...c, ...patch } : c)),
                )
              }
            />
          ))}
          <Label className="mt-2 text-xs text-muted-foreground">
            Add from the catalog
          </Label>
          <CatalogPicker
            onAdd={(name) => {
              setClips((list) => [...list, newClip(name)]);
              setOpenIndex(clips.length);
            }}
          />
        </section>

        <section className="flex flex-col gap-2">
          <Label className="text-xs font-semibold">Video tile</Label>
          <Segmented
            options={VIDEO_MODES}
            value={config.video.mode}
            onChange={(mode) => setVideo({ mode })}
          />
          <Label className="text-xs text-muted-foreground">
            Cuts set to auto
          </Label>
          <Segmented
            options={TRANSITIONS}
            value={config.video.transition}
            onChange={(transition) => setVideo({ transition })}
          />
          {KNOBS.filter((k) => k.section === "video").map((knob) => (
            <Range
              key={knob.key}
              id={`video-${knob.key}`}
              label={knob.label}
              value={config.video[knob.key as "beat"]}
              min={knob.min}
              max={knob.max}
              step={knob.step}
              onChange={(value) => setVideo({ [knob.key]: value })}
            />
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <Label className="text-xs font-semibold">After Effects tile</Label>
          <Segmented
            options={AE_MODES}
            value={config.ae.mode}
            onChange={(mode) => setAe({ mode })}
          />
          {KNOBS.filter((k) => k.section === "ae").map((knob) => (
            <Range
              key={knob.key}
              id={`ae-${knob.key}`}
              label={knob.label}
              value={config.ae[knob.key as "period"]}
              min={knob.min}
              max={knob.max}
              step={knob.step}
              onChange={(value) => setAe({ [knob.key]: value })}
            />
          ))}
        </section>

        {rail.length > 0 && (
          <section className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Saved</Label>
            {rail.map((item, i) => (
              <button
                key={`${item.seed}-${i}`}
                type="button"
                onClick={() => {
                  setConfig(item);
                  setOpenIndex(null);
                  setSoloIndex(null);
                }}
                className="rounded-md bg-muted px-2.5 py-2 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
              >
                {item.video.mode} / {item.ae.mode},{" "}
                {item.video.clips.map((c) => c.name).join(", ")}
              </button>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
