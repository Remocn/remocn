"use client";

import { CheckIcon, LinkIcon, RotateCcwIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackEvent } from "@/lib/analytics";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import { buildParsers, PreviewStage } from "@/lib/ui-preview-internals";
import registry from "@/registry/__index__";
import { ComponentCustomizer } from "./component-customizer";
import {
  loadUiScene,
  UI_PREVIEW_TIMING,
  UI_SCENE_LOADERS,
  type UiPreviewTiming,
} from "./examples/ui-preview-scenes";

/** Shared "Unknown component" fallback — matches the existing docs widgets. */
function UnknownComponent({ name }: { name: string }) {
  return (
    <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
      Unknown component: <code>{name}</code>
    </div>
  );
}

export function UiComponentPreview({ name }: { name: string }) {
  const timing = UI_PREVIEW_TIMING[name];
  const entry = registry[name];

  // Q1 — join the example timing with the registry config (controls) and a lazy
  // scene loader. The scene (component + honored list + code template) is fetched
  // inside `UiPreview` via `use()`. Any miss here → the shared Unknown fallback.
  if (!timing || !entry || !(name in UI_SCENE_LOADERS)) {
    return <UnknownComponent name={name} />;
  }

  return (
    <Suspense
      fallback={
        <div className="not-prose mb-6 aspect-[1.9/1] w-full animate-pulse rounded-2xl bg-muted" />
      }
    >
      <UiPreview name={name} timing={timing} controls={entry.config.controls} />
    </Suspense>
  );
}

function UiPreview({
  name,
  timing,
  controls,
}: {
  name: string;
  timing: UiPreviewTiming;
  controls: ControlConfig;
}) {
  // Suspends on first render until this component's scene chunk resolves, then
  // returns synchronously from the cached promise. Gives us the scene component,
  // its honored-control list, and its code template — no other scene is fetched.
  const scene = use(loadUiScene(name));
  const honored = scene.controls;
  const trackEvent = useTrackEvent();

  // visibleControls = config.controls ∩ honored[name]. This drops state/speed
  // and every structural-but-unthreaded knob — no global blacklist needed.
  const visibleControls = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(controls).filter(([k]) => honored.includes(k)),
      ) as ControlConfig,
    [controls, honored],
  );

  const hasControls = Object.keys(visibleControls).length > 0;

  const { parsers, urlKeys } = useMemo(
    () => buildParsers(name, visibleControls),
    [name, visibleControls],
  );
  const defaults = useMemo(
    () => getDefaults(visibleControls),
    [visibleControls],
  );

  const [values, setValues] = useQueryStates(parsers, {
    urlKeys,
    clearOnDefault: true,
    shallow: true,
  });

  const isDefault = useMemo(
    () => Object.entries(defaults).every(([k, v]) => values[k] === v),
    [defaults, values],
  );

  // Honored-only code (Q4): the scene's own template interpolates ONLY honored
  // keys, ONLY when a value differs from its default, and NEVER emits a prop the
  // component ignores. The same `values` feeds the Player → guaranteed parity.
  const code = useMemo(() => scene.code(values), [scene, values]);

  const [copied, setCopied] = useState(false);
  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    trackEvent("customized_link_shared", { component: name });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setValues(null);
    trackEvent("customizer_reset", { component: name });
  };

  useEffect(() => {
    trackEvent("docs_component_viewed", { component: name });
  }, [name, trackEvent]);

  const customizeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  useEffect(() => {
    const timers = customizeTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);
  const handleCustomizeChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    const existing = customizeTimers.current.get(key);
    if (existing) clearTimeout(existing);
    customizeTimers.current.set(
      key,
      setTimeout(() => {
        trackEvent("component_customized", { component: name, prop: key });
        customizeTimers.current.delete(key);
      }, 500),
    );
  };

  return (
    <div className="not-prose mb-6 flex w-full flex-col gap-4">
      <Tabs defaultValue="preview" className="gap-3">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-0">
          <PreviewStage
            name={name}
            Component={scene.Scene}
            inputProps={values}
            // D2 — timing is sourced from the EXAMPLE, not the config.
            durationInFrames={timing.durationInFrames}
            fps={timing.fps}
            compositionWidth={timing.width}
            compositionHeight={timing.height}
            previewBackdrop={timing.previewBackdrop}
          />
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <CodeBlock code={code} />
        </TabsContent>
      </Tabs>

      {/* Empty-panel collapse (Q5): no honored controls → only the Tabs. */}
      {hasControls && (
        <div className="overflow-hidden ">
          <div className="flex items-center justify-between pt-4 pb-2">
            <span className="text-sm font-medium text-foreground">
              Customize
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleCopyLink}
                aria-label="Copy share link"
                title="Copy share link"
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <LinkIcon className="size-3.5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleReset}
                disabled={isDefault}
                aria-label="Reset to defaults"
                title="Reset to defaults"
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <RotateCcwIcon className="size-3.5" />
              </Button>
            </div>
          </div>
          <ComponentCustomizer
            controls={visibleControls}
            values={values as Record<string, unknown>}
            onChange={handleCustomizeChange}
          />
        </div>
      )}
    </div>
  );
}
