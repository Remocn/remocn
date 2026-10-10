"use client";

import { PreviewStage } from "@/lib/ui-preview-internals";
import registry from "@/registry/__index__";
import type { BackdropFill } from "@/registry/remocn/backdrop";

export function EmbedPlayer({
  name,
  ...stage
}: {
  name: string;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  previewBackdrop?: BackdropFill;
}) {
  const entry = Object.hasOwn(registry, name) ? registry[name] : undefined;
  if (!entry) {
    return (
      <p className="text-sm text-muted-foreground">
        No preview for <code>{name}</code>.
      </p>
    );
  }
  return <PreviewStage name={name} load={entry.load} className="" {...stage} />;
}
