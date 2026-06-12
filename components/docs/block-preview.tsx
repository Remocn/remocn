"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { PreviewStage } from "@/lib/ui-preview-internals";
import { blockExamples } from "./examples/blocks";

/**
 * Controls-free preview for composition blocks. A THIN wrapper over
 * `PreviewStage` (`lib/ui-preview-internals.tsx` — owns lazy-mount + autoplay)
 * plus `DynamicCodeBlock`: the live scene Player above, the copyable scene
 * snippet below. No Tabs, no customizer, no nuqs, no controls.
 *
 * Replaces both the vestigial `LiveExample` and `UiComponentPreview` for the
 * blocks tier — blocks have no `registry[name]` config and no honored knobs, so
 * the heavier ui-tier widget does not apply (see §0B.7).
 */

/** Shared "Unknown component" fallback — matches the existing docs widgets. */
function UnknownComponent({ name }: { name: string }) {
  return (
    <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
      Unknown block: <code>{name}</code>
    </div>
  );
}

export function BlockPreview({ name }: { name: string }) {
  const entry = blockExamples[name];

  if (!entry) {
    return <UnknownComponent name={name} />;
  }

  // The code field may be a string or a zero-arg function; normalize to string.
  const code = typeof entry.code === "function" ? entry.code() : entry.code;

  return (
    <div className="not-prose mb-6 flex w-full flex-col gap-4">
      <PreviewStage
        name={name}
        Component={entry.Component}
        inputProps={{}}
        durationInFrames={entry.durationInFrames}
        fps={entry.fps}
        compositionWidth={entry.width}
        compositionHeight={entry.height}
      />

      <div className="surface-card overflow-hidden rounded-2xl [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent">
        <DynamicCodeBlock lang="tsx" code={code} />
      </div>
    </div>
  );
}
