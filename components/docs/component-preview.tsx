"use client";

import { Player } from "@remotion/player";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { CheckIcon, LinkIcon, RotateCcwIcon } from "lucide-react";
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackEvent } from "@/lib/analytics";
import {
  type ComponentConfig,
  type ControlConfig,
  getDefaults,
} from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { ComponentCustomizer } from "./component-customizer";

export function ComponentPreview({ name }: { name: string }) {
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
        <div className="not-prose mb-6 aspect-video w-full animate-pulse rounded-xl bg-muted" />
      }
    >
      <Preview name={name} config={entry.config} Component={entry.Component} />
    </Suspense>
  );
}

function buildParsers(name: string, controls: ControlConfig) {
  const parsers: Record<string, any> = {};
  const urlKeys: Record<string, string> = {};
  const prefix = name.replace(/-/g, "_");

  for (const [key, ctrl] of Object.entries(controls)) {
    urlKeys[key] = `${prefix}_${key}`;
    if (ctrl.type === "text") {
      parsers[key] = parseAsString.withDefault(ctrl.default);
    } else if (ctrl.type === "number") {
      parsers[key] = parseAsFloat.withDefault(ctrl.default);
    } else if (ctrl.type === "color") {
      parsers[key] = parseAsString.withDefault(ctrl.default);
    } else if (ctrl.type === "select") {
      parsers[key] = parseAsStringLiteral(
        ctrl.options as readonly string[],
      ).withDefault(ctrl.default);
    } else if (ctrl.type === "boolean") {
      parsers[key] = parseAsBoolean.withDefault(ctrl.default);
    }
  }
  return { parsers, urlKeys };
}

function Preview({
  name,
  config,
  Component,
}: {
  name: string;
  config: ComponentConfig;
  Component: React.ComponentType<any>;
}) {
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
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
            <Player
              component={Component}
              inputProps={values}
              durationInFrames={config.durationInFrames}
              fps={config.fps}
              compositionWidth={config.compositionWidth}
              compositionHeight={config.compositionHeight}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
              autoPlay
              acknowledgeRemotionLicense
            />
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <div className="overflow-hidden rounded-xl bg-muted [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-transparent">
            <DynamicCodeBlock lang="tsx" code={code} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="overflow-hidden rounded-xl bg-muted">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Customize
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy share link"
              title="Copy share link"
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-background hover:text-foreground",
              )}
            >
              {copied ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <LinkIcon className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isDefault}
              aria-label="Reset to defaults"
              title="Reset to defaults"
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-background hover:text-foreground",
                "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
              )}
            >
              <RotateCcwIcon className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="px-5 pb-5">
          <ComponentCustomizer
            controls={config.controls}
            values={values as Record<string, unknown>}
            onChange={handleCustomizeChange}
          />
        </div>
      </div>
    </div>
  );
}

function generateCode(config: ComponentConfig, props: Record<string, unknown>) {
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
