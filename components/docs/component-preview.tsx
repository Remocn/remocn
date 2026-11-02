"use client";

import type { StudioElementPayload } from "@remotion/studio-protocol";
import { Suspense, use, useMemo } from "react";
import type { ResolvedComponentConfig } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import registry, { loadComponentConfig } from "@/registry/__index__";
import { CustomizePanel } from "./blocks/customize-panel";
import { DocsPlayer } from "./blocks/player/docs-player";
import { PlayerFallback, UnknownBlock } from "./blocks/player/player-fallback";
import { BLOCK_SPACING } from "./blocks/spacing";
import { useCustomizer } from "./blocks/use-customizer";
import { StudioActions } from "./studio-actions";

export function ComponentPreview({
  name,
  studioElement,
}: {
  name: string;
  studioElement?: StudioElementPayload;
}) {
  const entry = registry[name];
  if (!entry) return <UnknownBlock kind="component" name={name} />;

  return (
    <div className={cn("not-prose", BLOCK_SPACING)}>
      <Suspense fallback={<PlayerFallback />}>
        <Preview name={name} load={entry.load} studioElement={studioElement} />
      </Suspense>
    </div>
  );
}

function Preview({
  name,
  load,
  studioElement,
}: {
  name: string;
  studioElement?: StudioElementPayload;
  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
  load: () => Promise<{ default: React.ComponentType<any> }>;
}) {
  // Suspends until this component's config chunk resolves, then returns
  // synchronously from the cached promise. No other config is fetched.
  const config = use(loadComponentConfig(name));
  const { values, isDefault, change, reset } = useCustomizer(
    name,
    config.controls,
  );
  const code = useMemo(() => generateCode(config, values), [config, values]);

  return (
    <DocsPlayer
      name={name}
      code={code}
      actions={
        studioElement ? (
          <StudioActions name={name} payload={studioElement} />
        ) : null
      }
      composition={{
        load,
        inputProps: values,
        durationInFrames:
          config.getDurationInFrames?.(values) ?? config.durationInFrames,
        fps: config.fps,
        compositionWidth: config.compositionWidth,
        compositionHeight: config.compositionHeight,
        previewBackdrop: config.previewBackdrop,
      }}
    >
      {Object.keys(config.controls).length > 0 ? (
        <CustomizePanel
          name={name}
          controls={config.controls}
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

function generateCode(
  config: ResolvedComponentConfig,
  props: Record<string, unknown>,
) {
  if (config.snippet) return config.snippet(props);
  const propsString = Object.entries(props)
    .map(([k, v]) => {
      // A JSX string attribute can't escape a quote; multi-line text reads better
      // as an expression too.
      if (typeof v === "string" && !/["\n]/.test(v)) return `  ${k}="${v}"`;
      return `  ${k}={${JSON.stringify(v)}}`;
    })
    .join("\n");
  return `import { ${config.componentName} } from "${config.importPath}";

<${config.componentName}
${propsString}
/>`;
}
