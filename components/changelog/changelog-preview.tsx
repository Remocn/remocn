"use client";

import { Suspense, useMemo } from "react";
import { type ComponentConfig, getDefaults } from "@/lib/customizer-config";
import { PreviewStage } from "@/lib/ui-preview-internals";
import registry from "@/registry/__index__";

export function ChangelogPreview({ name }: { name: string }) {
  const entry = registry[name];

  if (!entry) {
    return (
      <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
        Unknown component: <code>{name}</code>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="not-prose mb-6 aspect-[1.9/1] w-full animate-pulse rounded-2xl bg-muted" />
      }
    >
      <Preview name={name} config={entry.config} load={entry.load} />
    </Suspense>
  );
}

function Preview({
  name,
  config,
  load,
}: {
  name: string;
  config: ComponentConfig;
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load: () => Promise<{ default: React.ComponentType<any> }>;
}) {
  const inputProps = useMemo(
    () => getDefaults(config.controls),
    [config.controls],
  );

  return (
    <div className="not-prose mb-6 w-full">
      <PreviewStage
        name={name}
        load={load}
        inputProps={inputProps}
        durationInFrames={config.durationInFrames}
        fps={config.fps}
        compositionWidth={config.compositionWidth}
        compositionHeight={config.compositionHeight}
        previewBackdrop={config.previewBackdrop}
      />
    </div>
  );
}
