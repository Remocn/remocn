"use client";

import { PreviewStage } from "@/lib/ui-preview-internals";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";

export function ChangelogPreview({ name }: { name: string }) {
  const entry = registry[name];
  const preview = previewManifest[name];

  if (!entry || !preview) {
    return (
      <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
        Unknown component: <code>{name}</code>
      </div>
    );
  }

  return (
    <div className="not-prose mb-6 w-full">
      <PreviewStage
        name={name}
        load={entry.load}
        inputProps={preview.defaults}
        durationInFrames={preview.durationInFrames}
        fps={preview.fps}
        compositionWidth={preview.compositionWidth}
        compositionHeight={preview.compositionHeight}
        previewBackdrop={preview.previewBackdrop}
      />
    </div>
  );
}
