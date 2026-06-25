"use client";

import { Suspense } from "react";
import { PreviewStage } from "@/lib/ui-preview-internals";
import { examples } from "./examples";

export function ComponentExample({ name }: { name: string }) {
  const entry = examples[`${name}-example`];

  if (!entry) {
    return (
      <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
        Unknown example: <code>{name}</code>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="not-prose mb-6 aspect-[1.9/1] w-full animate-pulse rounded-2xl bg-muted" />
      }
    >
      <div className="not-prose mb-6">
        <PreviewStage
          name={`${name}-example`}
          Component={entry.Component}
          inputProps={{}}
          durationInFrames={entry.durationInFrames}
          fps={entry.fps}
          compositionWidth={entry.width}
          compositionHeight={entry.height}
          previewBackdrop={entry.previewBackdrop}
        />
      </div>
    </Suspense>
  );
}
