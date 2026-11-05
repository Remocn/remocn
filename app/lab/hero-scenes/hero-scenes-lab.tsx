"use client";

import { useState } from "react";
import { PromptComposer } from "@/app/(home)/components/landing/sections/hero/prompt-composer";
import {
  CONTENT_MODES,
  DEFAULT_SCENES_CONFIG,
  SCENE_SET_OPTIONS,
  type ScenesConfig,
  SWAP_TRANSITIONS,
} from "@/app/(home)/components/landing/sections/hero/scenes/config";
import saved from "@/app/(home)/components/landing/sections/hero/scenes/hero-scenes.json";
import { DEFAULT_LIVE_CLIPS } from "@/app/(home)/components/landing/sections/hero/scenes/live-clips";
import { SceneField } from "@/app/(home)/components/landing/sections/hero/scenes/scene-field";
import { SCENE_SETS } from "@/app/(home)/components/landing/sections/hero/scenes/sets";
import { liveSet } from "@/app/(home)/components/landing/sections/hero/scenes/sets/live";
import type { ClipSpec } from "@/app/(home)/components/landing/sections/hero/tiles/config";
import {
  CatalogPicker,
  ClipRow,
  newClip,
} from "@/app/lab/_components/clip-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Group = Exclude<keyof ScenesConfig, "live">;

const PROMPTS = ["Acme", "Ledger", "Pulse", "Notes"];
const SLOT_FORMATS = ["16:9", "1:1", "16:9", "1:1", "16:9", "9:16"];

function SlotEditor({
  clips,
  prompt,
  onPrompt,
  pinned,
  onPinned,
  onChange,
}: {
  clips: ClipSpec[][];
  prompt: number;
  onPrompt: (prompt: number) => void;
  pinned: boolean;
  onPinned: (pinned: boolean) => void;
  onChange: (clips: ClipSpec[][]) => void;
}) {
  const [slot, setSlot] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const slots = clips[prompt] ?? [];

  const update = (index: number, next: ClipSpec) =>
    onChange(
      clips.map((row, p) =>
        p === prompt ? row.map((clip, i) => (i === index ? next : clip)) : row,
      ),
    );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Cards per prompt</Label>
        <Button
          size="xs"
          variant={pinned ? "default" : "ghost"}
          onClick={() => onPinned(!pinned)}
        >
          {pinned ? "Showing this prompt" : "Following composer"}
        </Button>
      </div>
      <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
        {PROMPTS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => onPrompt(i)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs transition-colors",
              i === prompt
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </div>
      {slots.map((clip, i) => (
        <div
          key={`${prompt}-${i}`}
          className={cn("rounded-lg", slot === i && "ring-2 ring-primary/40")}
        >
          <ClipRow
            clip={clip}
            index={i}
            count={slots.length}
            label={`${i + 1} ${SLOT_FORMATS[i]}`}
            open={open === i}
            reel={false}
            onToggle={() => {
              setSlot(i);
              setOpen(open === i ? null : i);
            }}
            onChange={(patch) => update(i, { ...clip, ...patch })}
          />
        </div>
      ))}
      <Label className="mt-1 text-xs text-muted-foreground">
        Put into slot {slot + 1} ({SLOT_FORMATS[slot]})
      </Label>
      <CatalogPicker
        onAdd={(name) => {
          update(slot, newClip(name));
          setOpen(slot);
        }}
      />
    </div>
  );
}

const KNOBS: {
  group: Group;
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    group: "frame",
    key: "float",
    label: "Float distance (px)",
    min: 0,
    max: 14,
    step: 0.5,
  },
  {
    group: "frame",
    key: "floatPeriod",
    label: "Float period (s)",
    min: 4,
    max: 16,
    step: 0.5,
  },
  {
    group: "frame",
    key: "floatTilt",
    label: "Float tilt (deg)",
    min: 0,
    max: 3,
    step: 0.1,
  },
  {
    group: "frame",
    key: "parallax",
    label: "Cursor parallax (px)",
    min: 0,
    max: 40,
    step: 1,
  },
  {
    group: "frame",
    key: "depthSpread",
    label: "Depth spread",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    group: "swap",
    key: "stagger",
    label: "Stagger between cards (ms)",
    min: 0,
    max: 500,
    step: 10,
  },
  {
    group: "swap",
    key: "duration",
    label: "Pass time (ms)",
    min: 200,
    max: 1600,
    step: 10,
  },
  {
    group: "swap",
    key: "cell",
    label: "Dither dot grid (px)",
    min: 2,
    max: 8,
    step: 1,
  },
  {
    group: "swap",
    key: "band",
    label: "Dither band width",
    min: 0.08,
    max: 0.6,
    step: 0.01,
  },
  {
    group: "swap",
    key: "passes",
    label: "Working passes before reveal",
    min: 0,
    max: 3,
    step: 1,
  },
  {
    group: "swap",
    key: "dim",
    label: "Dim other scenes",
    min: 0,
    max: 0.6,
    step: 0.05,
  },
  {
    group: "play",
    key: "speed",
    label: "Playback speed",
    min: 0.5,
    max: 2,
    step: 0.05,
  },
  {
    group: "play",
    key: "loopGap",
    label: "Pause between loops (s)",
    min: 0.2,
    max: 4,
    step: 0.1,
  },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs transition-colors",
            option === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function HeroScenesLab() {
  const [config, setConfig] = useState<ScenesConfig>(() => ({
    ...DEFAULT_SCENES_CONFIG,
    ...(saved as Partial<ScenesConfig>),
    live: (saved as Partial<ScenesConfig>).live ?? DEFAULT_LIVE_CLIPS,
  }));
  const [prompt, setPrompt] = useState(0);
  const [pinned, setPinned] = useState(true);
  const [panel, setPanel] = useState(true);
  const [written, setWritten] = useState<string | null>(null);

  const set = <G extends Group>(group: G, patch: Partial<ScenesConfig[G]>) =>
    setConfig((prev) => ({ ...prev, [group]: { ...prev[group], ...patch } }));

  const save = async () => {
    const json = JSON.stringify(config, null, 2);
    await navigator.clipboard?.writeText(json).catch(() => undefined);
    const response = await fetch("/api/lab/hero-scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    const body = (await response.json().catch(() => ({}))) as { path?: string };
    setWritten(body.path ?? "write failed");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col overflow-x-clip pt-[130px] pb-[320px]">
        <SceneField
          config={config}
          set={
            config.swap.set === "live"
              ? liveSet(config.live)
              : SCENE_SETS[config.swap.set]
          }
          pinned={config.swap.set === "live" && pinned ? prompt : undefined}
        />
        <PromptComposer />
      </div>

      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {panel && (
          <div className="flex max-h-[85vh] w-[400px] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Scenes lab</Label>
              <Button size="sm" onClick={save}>
                Save
              </Button>
            </div>
            {written && (
              <p className="font-mono text-[11px] text-muted-foreground">
                wrote {written}
              </p>
            )}
            <Label className="text-xs text-muted-foreground">Scene set</Label>
            <Segmented
              options={SCENE_SET_OPTIONS}
              value={config.swap.set}
              onChange={(value) => set("swap", { set: value })}
            />
            {config.swap.set === "live" && (
              <SlotEditor
                clips={config.live}
                prompt={prompt}
                onPrompt={(next) => {
                  setPrompt(next);
                  setPinned(true);
                }}
                pinned={pinned}
                onPinned={setPinned}
                onChange={(live) => setConfig((prev) => ({ ...prev, live }))}
              />
            )}
            <Label className="text-xs text-muted-foreground">Content</Label>
            <Segmented
              options={CONTENT_MODES}
              value={config.swap.mode}
              onChange={(mode) => set("swap", { mode })}
            />
            <Label className="text-xs text-muted-foreground">
              Swap transition
            </Label>
            <Segmented
              options={SWAP_TRANSITIONS}
              value={config.swap.transition}
              onChange={(transition) => set("swap", { transition })}
            />
            {KNOBS.map((knob) => {
              const value = (config[knob.group] as Record<string, number>)[
                knob.key
              ];
              return (
                <div key={`${knob.group}-${knob.key}`} className="py-0.5">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <Label className="text-xs text-muted-foreground">
                      {knob.label}
                    </Label>
                    <span className="font-mono text-xs tabular-nums">
                      {value}
                    </span>
                  </div>
                  <Slider
                    value={value}
                    min={knob.min}
                    max={knob.max}
                    step={knob.step}
                    onValueChange={(next) =>
                      set(knob.group, {
                        [knob.key]: Array.isArray(next) ? next[0] : next,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        <Button size="sm" variant="secondary" onClick={() => setPanel(!panel)}>
          {panel ? "Hide panel" : "Show panel"}
        </Button>
      </div>
    </div>
  );
}
