"use client";

import type { StudioElementPayload } from "@remotion/studio-protocol";
import { CheckIcon, LinkIcon, RotateCcwIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackEvent } from "@/lib/analytics";
import {
  getDefaults,
  type ResolvedComponentConfig,
} from "@/lib/customizer-config";
import { buildParsers, PreviewStage } from "@/lib/ui-preview-internals";
import registry, { loadComponentConfig } from "@/registry/__index__";
import { ComponentCustomizer } from "./component-customizer";
import { StudioActions } from "./studio-actions";

type PickerHeader = {
  start: React.ReactNode;
  title: string;
  end?: React.ReactNode;
};

export function ComponentPreview({
  name,
  studioElement,
  layout,
  header,
}: {
  name: string;
  studioElement?: StudioElementPayload;
  layout: "caption-picker" | null;
  /** Caption picker only: the header row around the style's actions. */
  header?: PickerHeader;
}) {
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
        <div
          className={
            layout === "caption-picker"
              ? "min-h-0 flex-1 animate-pulse rounded-2xl bg-muted"
              : "not-prose mb-6 aspect-[1.9/1] w-full animate-pulse rounded-2xl bg-muted"
          }
        />
      }
    >
      <Preview
        name={name}
        load={entry.load}
        studioElement={studioElement}
        layout={layout}
        header={header}
      />
    </Suspense>
  );
}

function Preview({
  name,
  load,
  studioElement,
  layout,
  header,
}: {
  name: string;
  studioElement?: StudioElementPayload;
  layout: "caption-picker" | null;
  header?: PickerHeader;
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load: () => Promise<{ default: React.ComponentType<any> }>;
}) {
  // Suspends until this component's config chunk resolves, then returns
  // synchronously from the cached promise. No other config is fetched.
  const config = use(loadComponentConfig(name));
  const trackEvent = useTrackEvent();
  const { parsers, urlKeys } = useMemo(
    () => buildParsers(name, config.controls),
    [name, config.controls],
  );
  const defaults = useMemo(
    () => getDefaults(config.controls),
    [config.controls],
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

  const code = useMemo(() => generateCode(config, values), [config, values]);
  const installPayload = useMemo(() => {
    if (!studioElement?.element.isCaptionStyle) return studioElement;
    // The generated transcript comes from Studio, never from the demo fixture.
    const { captions: _captions, ...styleProps } = values;
    return {
      ...studioElement,
      element: { ...studioElement.element, initialProps: styleProps },
    } as StudioElementPayload;
  }, [studioElement, values]);

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

  const stage = (className: string, controls = true) => (
    <PreviewStage
      name={name}
      load={load}
      inputProps={values}
      durationInFrames={
        config.getDurationInFrames?.(values) ?? config.durationInFrames
      }
      fps={config.fps}
      compositionWidth={config.compositionWidth}
      compositionHeight={config.compositionHeight}
      previewBackdrop={config.previewBackdrop}
      className={className}
      controls={controls}
    />
  );
  const studioActions = installPayload ? (
    <StudioActions name={name} payload={installPayload} />
  ) : null;

  // Remotion Studio's caption picker is a small fixed panel (~600x290), so
  // everything has to fit without scrolling the page: one header row with the
  // actions, then the preview beside compact options. The transcript control
  // is hidden: Studio supplies the captions.
  if (layout === "caption-picker") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="justify-self-start">{header?.start}</div>
          <h1 className="min-w-0 truncate text-center text-sm font-semibold tracking-tight">
            {header?.title}
          </h1>
          <div className="flex items-center gap-1 justify-self-end">
            {header?.end}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleReset}
              disabled={isDefault}
              aria-label="Reset options"
              title="Reset options"
              className="text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <RotateCcwIcon className="size-3.5" />
            </Button>
            {studioActions}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="surface-card aspect-video w-[40%] shrink-0 self-start overflow-hidden rounded-xl">
            {stage("aspect-auto h-full rounded-none", false)}
          </div>
          <div className="@container min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-color:color-mix(in_oklab,currentColor_25%,transparent)_transparent] [scrollbar-width:thin]">
            <div className="[&>div]:grid-cols-1 @min-[280px]:[&>div]:grid-cols-2">
              <ComponentCustomizer
                density="compact"
                controls={Object.fromEntries(
                  Object.entries(config.controls).filter(
                    ([key]) => key !== "captions",
                  ),
                )}
                values={values as Record<string, unknown>}
                onChange={handleCustomizeChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose mb-6 flex w-full flex-col gap-4">
      <Frame>
        <Tabs defaultValue="preview" className="gap-0">
          <FrameHeader className="flex-row items-center justify-between gap-3 px-2 py-2">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            {studioActions}
          </FrameHeader>
          <FramePanel className="overflow-hidden p-0">
            <TabsContent value="preview" className="mt-0">
              {stage("rounded-none")}
            </TabsContent>
            <TabsContent value="code" className="mt-0">
              <CodeBlock code={code} />
            </TabsContent>
          </FramePanel>
        </Tabs>
      </Frame>

      <Frame className="mt-2">
        <FrameHeader className="flex-row items-center justify-between px-3 py-2">
          <FrameTitle>Customize</FrameTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleCopyLink}
              aria-label="Copy share link"
              title="Copy share link"
              className="relative text-muted-foreground before:absolute before:-inset-x-0.5 before:-inset-y-1.5 before:content-[''] hover:text-foreground"
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
              className="relative text-muted-foreground before:absolute before:-inset-x-0.5 before:-inset-y-1.5 before:content-[''] hover:text-foreground disabled:opacity-40"
            >
              <RotateCcwIcon className="size-3.5" />
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-3">
          <ComponentCustomizer
            controls={config.controls}
            values={values as Record<string, unknown>}
            onChange={handleCustomizeChange}
          />
        </FramePanel>
      </Frame>
    </div>
  );
}

function generateCode(
  config: ResolvedComponentConfig,
  props: Record<string, unknown>,
) {
  if (config.snippet) return config.snippet(props);
  const propsString = Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === "string") return `  ${k}="${v}"`;
      return `  ${k}={${JSON.stringify(v)}}`;
    })
    .join("\n");
  return `import { ${config.componentName} } from "${config.importPath}";

<${config.componentName}
${propsString}
/>`;
}
