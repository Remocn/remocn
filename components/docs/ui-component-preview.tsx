"use client";

import { Suspense, use, useMemo } from "react";
import type { ControlConfig } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import registry, { loadComponentConfig } from "@/registry/__index__";
import { CustomizePanel } from "./blocks/customize-panel";
import { DocsPlayer } from "./blocks/player/docs-player";
import { PlayerFallback, UnknownBlock } from "./blocks/player/player-fallback";
import { BLOCK_SPACING } from "./blocks/spacing";
import { useCustomizer } from "./blocks/use-customizer";
import {
  loadUiScene,
  UI_PREVIEW_TIMING,
  UI_SCENE_LOADERS,
  type UiPreviewTiming,
} from "./examples/ui-preview-scenes";

export function UiComponentPreview({ name }: { name: string }) {
  const timing = UI_PREVIEW_TIMING[name];
  const entry = registry[name];

  // Join the example timing with the registry config (controls) and a lazy
  // scene loader. The scene (component + honored list + code template) is
  // fetched inside `UiPreview` via `use()`.
  if (!timing || !entry || !(name in UI_SCENE_LOADERS)) {
    return <UnknownBlock kind="component" name={name} />;
  }

  return (
    <div className={cn("not-prose", BLOCK_SPACING)}>
      <Suspense fallback={<PlayerFallback />}>
        <UiPreview name={name} timing={timing} />
      </Suspense>
    </div>
  );
}

function UiPreview({
  name,
  timing,
}: {
  name: string;
  timing: UiPreviewTiming;
}) {
  // Suspends on first render until this component's scene chunk resolves:
  // the scene component, its honored-control list and its code template.
  const scene = use(loadUiScene(name));
  const controls: ControlConfig = use(loadComponentConfig(name)).controls;
  const honored = scene.controls;

  // config.controls ∩ honored: drops state/speed and every structural knob
  // the scene doesn't thread through.
  const visibleControls = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(controls).filter(([k]) => honored.includes(k)),
      ) as ControlConfig,
    [controls, honored],
  );

  const { values, isDefault, change, reset } = useCustomizer(
    name,
    visibleControls,
  );

  // The scene's template interpolates only honored keys that differ from
  // their default; the same `values` feed the Player, so code and preview match.
  const code = useMemo(() => scene.code(values), [scene, values]);

  return (
    <DocsPlayer
      name={name}
      code={code}
      composition={{
        Component: scene.Scene,
        inputProps: values,
        // Timing is sourced from the example, not the config.
        durationInFrames: timing.durationInFrames,
        fps: timing.fps,
        compositionWidth: timing.width,
        compositionHeight: timing.height,
        previewBackdrop: timing.previewBackdrop,
      }}
    >
      {Object.keys(visibleControls).length > 0 ? (
        <CustomizePanel
          name={name}
          controls={visibleControls}
          values={values}
          code={code}
          isDefault={isDefault}
          onChange={change}
          onReset={reset}
        />
      ) : null}
    </DocsPlayer>
  );
}
