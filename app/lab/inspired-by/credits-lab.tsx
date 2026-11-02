"use client";

import { useEffect, useState } from "react";
import { Credits } from "@/app/(home)/inspired-by/credits";
import saved from "@/app/(home)/inspired-by/credits.json";
import {
  CREDIT_FONTS,
  CREDIT_MODES,
  CREDIT_ORDERS,
  type CreditsConfig,
  DEFAULT_CREDITS,
} from "@/app/(home)/inspired-by/credits-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { INSPIRED_BY } from "@/config/inspired-by";

type NumberKey = {
  [K in keyof CreditsConfig]: CreditsConfig[K] extends number ? K : never;
}[keyof CreditsConfig];

type Knob = {
  key: NumberKey;
  label: string;
  min: number;
  max: number;
  step: number;
};

/** Bounds are the tested range: past them the reel breaks or turns to mush. */
const KNOB_GROUPS: { title: string; knobs: Knob[] }[] = [
  {
    title: "Roller",
    knobs: [
      { key: "speed", label: "Speed, px/s", min: 8, max: 120, step: 1 },
      { key: "loopGap", label: "Loop gap, vh", min: 0, max: 1.5, step: 0.05 },
    ],
  },
  {
    title: "Cards",
    knobs: [
      { key: "perCard", label: "Names per card", min: 1, max: 4, step: 1 },
      { key: "hold", label: "Hold, s", min: 1, max: 6, step: 0.1 },
      { key: "fade", label: "Crossfade, ms", min: 0, max: 1600, step: 50 },
    ],
  },
  {
    title: "Type",
    knobs: [
      { key: "fontSize", label: "Size, px", min: 11, max: 32, step: 1 },
      { key: "tracking", label: "Tracking, em", min: 0, max: 0.4, step: 0.01 },
      { key: "dim", label: "Text at rest", min: 0.4, max: 1, step: 0.02 },
    ],
  },
  {
    title: "Layout",
    knobs: [
      { key: "avatar", label: "Avatar, px", min: 20, max: 80, step: 1 },
      { key: "gutter", label: "Axis gutter, px", min: 4, max: 48, step: 1 },
      { key: "rowGap", label: "Row gap, px", min: 12, max: 120, step: 2 },
      { key: "blockGap", label: "Block gap, px", min: 32, max: 320, step: 4 },
      { key: "mute", label: "Avatar grayscale", min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    title: "Projector",
    knobs: [
      { key: "weave", label: "Gate weave, px", min: 0, max: 2, step: 0.05 },
      { key: "flicker", label: "Flicker", min: 0, max: 0.2, step: 0.005 },
    ],
  },
];

const RAIL_KEY = "remocn:inspired-by:saved";

function newSeed() {
  return Math.floor(Math.random() * 1_000_000);
}

export function CreditsLab() {
  const [config, setConfig] = useState<CreditsConfig>({
    ...DEFAULT_CREDITS,
    ...(saved as Partial<CreditsConfig>),
  });
  const [rail, setRail] = useState<CreditsConfig[]>([]);
  const [written, setWritten] = useState<string | null>(null);
  const [panel, setPanel] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(RAIL_KEY);
    if (stored) setRail(JSON.parse(stored) as CreditsConfig[]);
  }, []);

  const set = <K extends keyof CreditsConfig>(
    key: K,
    value: CreditsConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    const json = JSON.stringify(config, null, 2);
    await navigator.clipboard?.writeText(json).catch(() => undefined);
    const response = await fetch("/api/lab/inspired-by", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    const body = (await response.json().catch(() => ({}))) as {
      path?: string;
    };
    setWritten(body.path ?? "write failed");
    const next = [config, ...rail].slice(0, 12);
    setRail(next);
    localStorage.setItem(RAIL_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clicking the canvas rolls a new seed; links don't navigate in the lab. */}
      <div
        className="cursor-crosshair"
        style={{ paddingRight: panel ? 380 : 0 }}
        onClickCapture={(event) => {
          event.preventDefault();
          set("seed", newSeed());
        }}
      >
        <Credits config={config} handles={INSPIRED_BY} />
      </div>

      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => setPanel(!panel)}>
          {panel ? "Hide panel" : "Show panel"}
        </Button>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          seed {config.seed}
        </span>
      </div>

      {panel && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-[380px] flex-col gap-4 overflow-y-auto border-l border-border bg-background/95 p-4 text-foreground backdrop-blur">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => set("seed", newSeed())}
            >
              New seed
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfig(DEFAULT_CREDITS)}
            >
              Reset
            </Button>
          </div>
          {written && (
            <p className="font-mono text-[11px] text-muted-foreground">
              wrote {written}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Mode"
              value={config.mode}
              options={CREDIT_MODES}
              onChange={(value) => set("mode", value)}
            />
            <Select
              label="Order"
              value={config.order}
              options={CREDIT_ORDERS}
              onChange={(value) => set("order", value)}
            />
            <Select
              label="Font"
              value={config.font}
              options={CREDIT_FONTS}
              onChange={(value) => set("font", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="uppercase" className="text-xs">
              Uppercase
            </Label>
            <Switch
              id="uppercase"
              checked={config.uppercase}
              onCheckedChange={(checked) => set("uppercase", checked)}
            />
          </div>

          <TextField
            id="slate"
            label="Slate"
            value={config.slate}
            onChange={(value) => set("slate", value)}
          />
          <TextField
            id="end-card"
            label="End card"
            value={config.endCard}
            onChange={(value) => set("endCard", value)}
          />

          {KNOB_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <div className="h-px bg-border" />
              <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                {group.title}
              </span>
              {group.knobs.map((knob) => (
                <KnobRow
                  key={knob.key}
                  knob={knob}
                  value={config[knob.key]}
                  onChange={(value) => set(knob.key, value)}
                />
              ))}
            </div>
          ))}

          {rail.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="h-px bg-border" />
              <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Saved
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rail.map((entry, i) => (
                  <Button
                    key={`${entry.seed}-${i}`}
                    size="sm"
                    variant="outline"
                    className="font-mono text-[11px]"
                    onClick={() => setConfig(entry)}
                  >
                    {entry.mode} · {entry.seed}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KnobRow({
  knob,
  value,
  onChange,
}: {
  knob: Knob;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = `knob-${knob.key}`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">
          {knob.label}
        </Label>
        <span className="font-mono text-xs tabular-nums">{value}</span>
      </div>
      <Slider
        id={id}
        value={value}
        min={knob.min}
        max={knob.max}
        step={knob.step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <NativeSelect
        size="sm"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
