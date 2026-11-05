"use client";

import { type ReactNode, useState } from "react";
import type { ClipSpec } from "@/app/(home)/components/landing/sections/hero/tiles/config";
import {
  BentoClipsContext,
  SAVED_BENTO,
} from "@/app/(home)/components/landing/sections/whats-inside/bento-clip";
import {
  BENTO_SLOTS,
  type BentoClips,
  type BentoSlot,
  DEFAULT_BENTO,
} from "@/app/(home)/components/landing/sections/whats-inside/bento-clips";
import {
  CatalogPicker,
  ClipRow,
  newClip,
} from "@/app/lab/_components/clip-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Target = BentoSlot | "typography";

const SLOT_LABELS: Record<BentoSlot, string> = {
  transitions: "Transitions",
  captions: "Captions",
  backgrounds: "Backgrounds",
  numbers: "Numbers",
  productScenes: "Product scenes",
  logoStings: "Logo stings",
};

function remixWord(name: string): ClipSpec {
  return {
    ...newClip(name),
    background: "transparent",
    props: { text: "Arrive.", fontSize: 200, color: "currentColor" },
  };
}

export function BentoLab({ children }: { children: ReactNode }) {
  const [clips, setClips] = useState<BentoClips>(SAVED_BENTO);
  const [target, setTarget] = useState<Target>("typography");
  const [open, setOpen] = useState<string | null>(null);
  const [panel, setPanel] = useState(true);
  const [written, setWritten] = useState<string | null>(null);

  const setRemix = (typography: ClipSpec[]) =>
    setClips((prev) => ({ ...prev, typography }));

  const save = async () => {
    const json = JSON.stringify(clips, null, 2);
    await navigator.clipboard?.writeText(json).catch(() => undefined);
    const response = await fetch("/api/lab/whats-inside", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    const body = (await response.json().catch(() => ({}))) as { path?: string };
    setWritten(body.path ?? "write failed");
  };

  const add = (name: string) => {
    if (target === "typography") {
      setRemix([...clips.typography, remixWord(name)]);
      setOpen(`typography-${clips.typography.length}`);
      return;
    }
    setClips((prev) => ({ ...prev, [target]: newClip(name) }));
    setOpen(target);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <BentoClipsContext value={clips}>{children}</BentoClipsContext>

      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {panel && (
          <div className="flex max-h-[85vh] w-[400px] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold">Bento lab</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setClips(DEFAULT_BENTO)}
                >
                  Defaults
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

            <button
              type="button"
              onClick={() => setTarget("typography")}
              className={cn(
                "rounded-md text-left text-xs font-semibold",
                target === "typography"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              Typography remix, in play order
            </button>
            {clips.typography.map((clip, index) => {
              const key = `typography-${index}`;
              return (
                <ClipRow
                  key={key}
                  clip={clip}
                  index={index}
                  count={clips.typography.length}
                  open={open === key}
                  reel={false}
                  onToggle={() => {
                    setTarget("typography");
                    setOpen(open === key ? null : key);
                  }}
                  onMove={(delta) => {
                    const next = [...clips.typography];
                    const [moved] = next.splice(index, 1);
                    next.splice(index + delta, 0, moved);
                    setRemix(next);
                  }}
                  onRemove={() =>
                    setRemix(clips.typography.filter((_, i) => i !== index))
                  }
                  onChange={(patch) =>
                    setRemix(
                      clips.typography.map((item, i) =>
                        i === index ? { ...item, ...patch } : item,
                      ),
                    )
                  }
                />
              );
            })}

            <Label className="mt-2 text-xs font-semibold text-muted-foreground">
              Tiles
            </Label>
            {BENTO_SLOTS.map((id, index) => (
              <div
                key={id}
                className={cn(
                  "rounded-lg",
                  target === id && "ring-2 ring-primary/40",
                )}
              >
                <ClipRow
                  clip={clips[id]}
                  index={index}
                  count={BENTO_SLOTS.length}
                  label={SLOT_LABELS[id]}
                  open={open === id}
                  reel={false}
                  onToggle={() => {
                    setTarget(id);
                    setOpen(open === id ? null : id);
                  }}
                  onChange={(patch) =>
                    setClips((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], ...patch },
                    }))
                  }
                />
              </div>
            ))}

            <Label className="mt-1 text-xs text-muted-foreground">
              {target === "typography"
                ? "Add to the typography remix"
                : `Put into ${SLOT_LABELS[target]}`}
            </Label>
            <CatalogPicker onAdd={add} />
          </div>
        )}
        <Button size="sm" variant="secondary" onClick={() => setPanel(!panel)}>
          {panel ? "Hide panel" : "Show panel"}
        </Button>
      </div>
    </div>
  );
}
