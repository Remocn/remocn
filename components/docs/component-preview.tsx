"use client";

import type { PlayerRef } from "@remotion/player";
import type { StudioElementPayload } from "@remotion/studio-protocol";
import { RotateCcwIcon } from "lucide-react";
import {
  type ReactNode,
  Suspense,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import type {
  ControlConfig,
  ResolvedComponentConfig,
} from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import registry, { loadComponentConfig } from "@/registry/__index__";
import { CustomizePanel } from "./blocks/customize-panel";
import { DocsPlayer } from "./blocks/player/docs-player";
import { PlayerFallback, UnknownBlock } from "./blocks/player/player-fallback";
import {
  PlayerStage,
  type StageComposition,
} from "./blocks/player/player-stage";
import { BLOCK_SPACING } from "./blocks/spacing";
import { useCustomizer } from "./blocks/use-customizer";
import { ComponentCustomizer } from "./component-customizer";
import { StudioActions } from "./studio-actions";

type Layout = "caption-picker" | null;

type PickerHeader = {
  start: ReactNode;
  title: string;
  end?: ReactNode;
};

export function ComponentPreview({
  name,
  studioElement,
  layout = null,
  header,
}: {
  name: string;
  studioElement?: StudioElementPayload;
  /** `"caption-picker"`: the compact layout for Remotion Studio's caption picker. */
  layout?: Layout;
  /** Caption picker only: the header row around the style's actions. */
  header?: PickerHeader;
}) {
  const entry = registry[name];
  if (!entry) return <UnknownBlock kind="component" name={name} />;

  if (layout === "caption-picker") {
    return (
      <Suspense
        fallback={
          <div className="min-h-0 flex-1 animate-pulse rounded-card bg-muted" />
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

  return (
    <div className={cn("not-prose", BLOCK_SPACING)}>
      <Suspense fallback={<PlayerFallback />}>
        <Preview
          name={name}
          load={entry.load}
          studioElement={studioElement}
          layout={layout}
        />
      </Suspense>
    </div>
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
  layout: Layout;
  header?: PickerHeader;
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
  const installPayload = useMemo(() => {
    if (!studioElement?.element.isCaptionStyle) return studioElement;
    // The generated transcript comes from Studio, never from the demo fixture.
    const { captions: _captions, ...styleProps } = values;
    return {
      ...studioElement,
      element: { ...studioElement.element, initialProps: styleProps },
    } as StudioElementPayload;
  }, [studioElement, values]);

  const composition: StageComposition = {
    load,
    inputProps: values,
    durationInFrames:
      config.getDurationInFrames?.(values) ?? config.durationInFrames,
    fps: config.fps,
    compositionWidth: config.compositionWidth,
    compositionHeight: config.compositionHeight,
    previewBackdrop: config.previewBackdrop,
  };
  const studioActions = installPayload ? (
    <StudioActions name={name} payload={installPayload} />
  ) : null;

  if (layout === "caption-picker") {
    return (
      <CaptionPickerPreview
        name={name}
        header={header}
        composition={composition}
        // Studio supplies the captions, so the transcript control is hidden.
        controls={Object.fromEntries(
          Object.entries(config.controls).filter(([key]) => key !== "captions"),
        )}
        values={values}
        isDefault={isDefault}
        onChange={change}
        onReset={reset}
        actions={studioActions}
      />
    );
  }

  return (
    <DocsPlayer
      name={name}
      code={code}
      actions={studioActions}
      composition={composition}
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

/**
 * Remotion Studio's caption picker is a small fixed panel (~600x290), so
 * everything has to fit without scrolling the page: one header row with the
 * actions, then the dark player surface with the stage beside compact options.
 */
function CaptionPickerPreview({
  name,
  header,
  composition,
  controls,
  values,
  isDefault,
  onChange,
  onReset,
  actions,
}: {
  name: string;
  header?: PickerHeader;
  composition: StageComposition;
  controls: ControlConfig;
  values: Record<string, unknown>;
  isDefault: boolean;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
  actions: ReactNode;
}) {
  const playerRef = useRef<PlayerRef | null>(null);
  const [mounted, setMounted] = useState(false);
  const mount = useCallback(() => setMounted(true), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">{header?.start}</div>
        <h1 className="min-w-0 truncate text-center text-sm font-semibold tracking-tight">
          {header?.title}
        </h1>
        {/* The narrow Studio panel would otherwise get the 44px phone buttons. */}
        <div className="flex items-center gap-1 justify-self-end [&_button]:h-8">
          {header?.end}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onReset}
            disabled={isDefault}
            aria-label="Reset options"
            title="Reset options"
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <RotateCcwIcon className="size-3.5" />
          </Button>
          {actions}
        </div>
      </div>
      <section
        aria-label={`${name.replaceAll("-", " ")} preview`}
        className="flex min-h-0 flex-1 gap-2 rounded-card border border-transparent bg-dark-surface p-2 text-[#fafafa] dark:border-hairline dark:bg-surface"
      >
        <PlayerStage
          name={name.replaceAll("-", " ")}
          composition={composition}
          playerRef={playerRef}
          mounted={mounted}
          onMount={mount}
          className="w-[40%] shrink-0 self-start"
        />
        <div className="@container min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-color:rgb(255_255_255/0.25)_transparent] [scrollbar-width:thin]">
          <ComponentCustomizer
            density="compact"
            controls={controls}
            values={values}
            onChange={onChange}
          />
        </div>
      </section>
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
