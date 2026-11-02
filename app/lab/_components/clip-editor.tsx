"use client";

import { useMemo, useState } from "react";
import {
  CATALOG,
  defaultBackground,
  defaultEnd,
  nativeDuration,
} from "@/app/(home)/components/landing/sections/hero/tiles/clips";
import {
  CLIP_ENDS,
  type ClipSpec,
  CUTS,
} from "@/app/(home)/components/landing/sections/hero/tiles/config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs whitespace-nowrap transition-colors",
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

export function Range({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="py-1">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <Slider
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  );
}

export function newClip(name: string): ClipSpec {
  return {
    name,
    start: 0,
    zoom: 1,
    end: defaultEnd(name),
    background: defaultBackground(name),
    radius: 0.25,
    cut: "auto",
    props: {},
  };
}

export function PropsEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">
        Props over the docs defaults (JSON)
      </Label>
      <textarea
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          try {
            const parsed = JSON.parse(text || "{}");
            setError(false);
            onChange(parsed);
          } catch {
            setError(true);
          }
        }}
        className={cn(
          "min-h-20 rounded-md border bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground outline-none",
          error ? "border-destructive" : "border-border",
        )}
      />
    </div>
  );
}

export function ClipRow({
  clip,
  index,
  count,
  label,
  open,
  solo,
  reel = true,
  onToggle,
  onSolo,
  onMove,
  onRemove,
  onChange,
}: {
  clip: ClipSpec;
  index: number;
  count: number;
  label?: string;
  open: boolean;
  solo?: boolean;
  reel?: boolean;
  onToggle: () => void;
  onSolo?: () => void;
  onMove?: (delta: number) => void;
  onRemove?: () => void;
  onChange: (patch: Partial<ClipSpec>) => void;
}) {
  const native = nativeDuration(clip.name);
  const id = `clip-${index}`;
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted"
        >
          <span
            className="size-4 shrink-0 rounded-[4px] border border-border"
            style={{ background: clip.background }}
          />
          <span className="font-mono text-[11px] text-muted-foreground">
            {label ?? index + 1}
          </span>
          <span className="truncate text-xs text-foreground">{clip.name}</span>
        </button>
        {onSolo && (
          <Button
            size="xs"
            variant={solo ? "default" : "ghost"}
            onClick={onSolo}
          >
            Solo
          </Button>
        )}
        {onMove && (
          <>
            <Button
              size="xs"
              variant="ghost"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              Up
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              Down
            </Button>
          </>
        )}
        {onRemove && (
          <Button size="xs" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t border-border p-2.5">
          <Range
            id={`${id}-start`}
            label={`Start frame (of ${native})`}
            value={clip.start}
            min={0}
            max={Math.max(native - 1, 0)}
            step={1}
            onChange={(start) => onChange({ start })}
          />
          <Range
            id={`${id}-zoom`}
            label="Zoom"
            value={clip.zoom}
            min={0.3}
            max={4}
            step={0.05}
            onChange={(zoom) => onChange({ zoom })}
          />
          {reel && (
            <Range
              id={`${id}-radius`}
              label="Shape radius (morph)"
              value={clip.radius}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(radius) => onChange({ radius })}
            />
          )}
          <Label className="text-xs text-muted-foreground">
            After its timeline ends
          </Label>
          <Segmented
            options={CLIP_ENDS}
            value={clip.end}
            onChange={(end) => onChange({ end })}
          />
          {reel && (
            <>
              <Label className="text-xs text-muted-foreground">
                Cut into the next clip
              </Label>
              <Segmented
                options={["auto", ...CUTS] as const}
                value={clip.cut}
                onChange={(cut) => onChange({ cut })}
              />
            </>
          )}
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor={`${id}-bg`}
              className="text-xs text-muted-foreground"
            >
              Background
            </Label>
            <div className="flex items-center gap-2">
              <input
                id={`${id}-bg`}
                type="color"
                value={
                  /^#[0-9a-f]{6}$/i.test(clip.background)
                    ? clip.background
                    : "#0E1012"
                }
                onChange={(event) =>
                  onChange({ background: event.target.value })
                }
                className="size-7 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="font-mono text-[11px] text-muted-foreground">
                {clip.background}
              </span>
            </div>
          </div>
          <PropsEditor
            key={clip.name}
            value={clip.props}
            onChange={(props) => onChange({ props })}
          />
        </div>
      )}
    </div>
  );
}

export function CatalogPicker({ onAdd }: { onAdd: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return CATALOG.filter((name) => words.every((word) => name.includes(word)));
  }, [query]);
  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${CATALOG.length} catalog items`}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-foreground/30"
      />
      <div className="flex max-h-56 flex-col overflow-y-auto rounded-md border border-border">
        {results.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onAdd(name)}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted"
          >
            <span className="truncate">{name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {nativeDuration(name)}f
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <span className="px-2.5 py-2 text-xs text-muted-foreground">
            Nothing matches
          </span>
        )}
      </div>
    </div>
  );
}
