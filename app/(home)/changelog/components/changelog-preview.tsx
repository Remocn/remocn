"use client";

import registry from "@/lib/previews";
import { sitePreview } from "@/lib/previews/site-preview";
import { PreviewStage } from "@/lib/ui-preview-internals";

export function ChangelogPreview({ name }: { name: string }) {
  const entry = registry[name];
  const preview = sitePreview(name);

  if (!entry || !preview) {
    return (
      <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
        Unknown component: <code>{name}</code>
      </div>
    );
  }

  return (
    <div className="not-prose my-6 w-full">
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
