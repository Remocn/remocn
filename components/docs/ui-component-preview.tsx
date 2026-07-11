"use client";

import { CheckIcon, LinkIcon, RotateCcwIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CodeBlock } from "@/components/docs/code-block";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackEvent } from "@/lib/analytics";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import { buildParsers, PreviewStage } from "@/lib/ui-preview-internals";
import registry from "@/registry/__index__";
import { ComponentCustomizer } from "./component-customizer";
import { type ExampleEntry, examples } from "./examples";
import {
  accordionExampleCode,
  accordionExampleControls,
} from "./examples/accordion-example";
import {
  alertDialogExampleCode,
  alertDialogExampleControls,
} from "./examples/alert-dialog-example";
import {
  blurInExampleCode,
  blurInExampleControls,
} from "./examples/blur-in-example";
import {
  buttonExampleCode,
  buttonExampleControls,
} from "./examples/button-example";
import {
  checkboxExampleCode,
  checkboxExampleControls,
} from "./examples/checkbox-example";
import {
  comboboxExampleCode,
  comboboxExampleControls,
} from "./examples/combobox-example";
import {
  commandMenuExampleCode,
  commandMenuExampleControls,
} from "./examples/command-menu-example";
import {
  contextMenuExampleCode,
  contextMenuExampleControls,
} from "./examples/context-menu-example";
import {
  cursorExampleCode,
  cursorExampleControls,
} from "./examples/cursor-example";
import {
  dialogExampleCode,
  dialogExampleControls,
} from "./examples/dialog-example";
import {
  drawerExampleCode,
  drawerExampleControls,
} from "./examples/drawer-example";
import {
  dropdownMenuExampleCode,
  dropdownMenuExampleControls,
} from "./examples/dropdown-menu-example";
import {
  inputExampleCode,
  inputExampleControls,
} from "./examples/input-example";
import {
  messageBubbleExampleCode,
  messageBubbleExampleControls,
} from "./examples/message-bubble-example";
import {
  popoverExampleCode,
  popoverExampleControls,
} from "./examples/popover-example";
import {
  progressExampleCode,
  progressExampleControls,
} from "./examples/progress-example";
import {
  radioExampleCode,
  radioExampleControls,
} from "./examples/radio-example";
import {
  resizableExampleCode,
  resizableExampleControls,
} from "./examples/resizable-example";
import {
  selectExampleCode,
  selectExampleControls,
} from "./examples/select-example";
import {
  sheetExampleCode,
  sheetExampleControls,
} from "./examples/sheet-example";
import {
  skeletonExampleCode,
  skeletonExampleControls,
} from "./examples/skeleton-example";
import {
  sliderExampleCode,
  sliderExampleControls,
} from "./examples/slider-example";
import {
  stepperExampleCode,
  stepperExampleControls,
} from "./examples/stepper-example";
import {
  switchExampleCode,
  switchExampleControls,
} from "./examples/switch-example";
import { tabsExampleCode, tabsExampleControls } from "./examples/tabs-example";
import {
  toastExampleCode,
  toastExampleControls,
} from "./examples/toast-example";
import {
  toggleGroupExampleCode,
  toggleGroupExampleControls,
} from "./examples/toggle-group-example";
import {
  tooltipExampleCode,
  tooltipExampleControls,
} from "./examples/tooltip-example";
import {
  typingIndicatorExampleCode,
  typingIndicatorExampleControls,
} from "./examples/typing-indicator-example";

/**
 * Per-component honored-key allowlist + code template, co-located with each
 * scene file (`<name>ExampleControls` + `<name>ExampleCode`). The preview shows
 * ONLY the controls a scene actually threads into its component (visible =
 * honored, never a blacklist), and the Code tab emits ONLY those honored props.
 *
 * Each fan-out worker adds one line here per migrated component (import the two
 * exports from `./examples/<name>-example`, register them by registry name).
 * Phase 0 seeds the button pilot.
 */
interface UiSceneMeta {
  /** Honored control keys (visible knobs); everything else is timeline-owned. */
  controls: readonly string[];
  /** Function template emitting the timeline code for the honored props. */
  code: (values: Record<string, unknown>) => string;
}

const UI_SCENE_META: Record<string, UiSceneMeta> = {
  button: { controls: buttonExampleControls, code: buttonExampleCode },
  input: { controls: inputExampleControls, code: inputExampleCode },
  toast: { controls: toastExampleControls, code: toastExampleCode },
  "message-bubble": {
    controls: messageBubbleExampleControls,
    code: messageBubbleExampleCode,
  },
  "typing-indicator": {
    controls: typingIndicatorExampleControls,
    code: typingIndicatorExampleCode,
  },
  popover: { controls: popoverExampleControls, code: popoverExampleCode },
  accordion: { controls: accordionExampleControls, code: accordionExampleCode },
  tooltip: { controls: tooltipExampleControls, code: tooltipExampleCode },
  dialog: { controls: dialogExampleControls, code: dialogExampleCode },
  sheet: { controls: sheetExampleControls, code: sheetExampleCode },
  drawer: { controls: drawerExampleControls, code: drawerExampleCode },
  "alert-dialog": {
    controls: alertDialogExampleControls,
    code: alertDialogExampleCode,
  },
  checkbox: { controls: checkboxExampleControls, code: checkboxExampleCode },
  radio: { controls: radioExampleControls, code: radioExampleCode },
  switch: { controls: switchExampleControls, code: switchExampleCode },
  slider: { controls: sliderExampleControls, code: sliderExampleCode },
  progress: { controls: progressExampleControls, code: progressExampleCode },
  combobox: { controls: comboboxExampleControls, code: comboboxExampleCode },
  select: { controls: selectExampleControls, code: selectExampleCode },
  "command-menu": {
    controls: commandMenuExampleControls,
    code: commandMenuExampleCode,
  },
  "dropdown-menu": {
    controls: dropdownMenuExampleControls,
    code: dropdownMenuExampleCode,
  },
  "context-menu": {
    controls: contextMenuExampleControls,
    code: contextMenuExampleCode,
  },
  cursor: { controls: cursorExampleControls, code: cursorExampleCode },
  resizable: { controls: resizableExampleControls, code: resizableExampleCode },
  skeleton: { controls: skeletonExampleControls, code: skeletonExampleCode },
  stepper: { controls: stepperExampleControls, code: stepperExampleCode },
  tabs: { controls: tabsExampleControls, code: tabsExampleCode },
  "toggle-group": {
    controls: toggleGroupExampleControls,
    code: toggleGroupExampleCode,
  },
  "blur-in": { controls: blurInExampleControls, code: blurInExampleCode },
};

/**
 * Honored-only code generator (Q4). Built from the scene's `<name>ExampleCode`
 * function template — it interpolates ONLY honored keys, ONLY when a value
 * differs from its control default, and NEVER emits a prop the component
 * ignores. Same `visibleValues` feeds the Player + this generator → parity.
 * Does NOT call the legacy `config.snippet`.
 */
function generateUiCode(
  name: string,
  _exampleEntry: ExampleEntry,
  visibleValues: Record<string, unknown>,
): string {
  const meta = UI_SCENE_META[name];
  if (!meta) return "";
  return meta.code(visibleValues);
}

/** Shared "Unknown component" fallback — matches the existing docs widgets. */
function UnknownComponent({ name }: { name: string }) {
  return (
    <div className="not-prose mb-6 rounded-lg border border-fd-border p-4 text-sm text-fd-muted-foreground">
      Unknown component: <code>{name}</code>
    </div>
  );
}

export function UiComponentPreview({ name }: { name: string }) {
  const exampleEntry = examples[`${name}-example`];
  const entry = registry[name];
  const meta = UI_SCENE_META[name];

  // Q1 — join the example (scene + timing) with the registry config (controls)
  // and the per-scene honored list. Any miss → the shared Unknown fallback.
  if (!exampleEntry || !entry || !meta) {
    return <UnknownComponent name={name} />;
  }

  return (
    <Suspense
      fallback={
        <div className="not-prose mb-6 aspect-[1.9/1] w-full animate-pulse rounded-2xl bg-muted" />
      }
    >
      <UiPreview
        name={name}
        exampleEntry={exampleEntry}
        controls={entry.config.controls}
        honored={meta.controls}
      />
    </Suspense>
  );
}

function UiPreview({
  name,
  exampleEntry,
  controls,
  honored,
}: {
  name: string;
  exampleEntry: ExampleEntry;
  controls: ControlConfig;
  honored: readonly string[];
}) {
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

  const code = useMemo(
    () => generateUiCode(name, exampleEntry, values),
    [name, exampleEntry, values],
  );

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
            Component={exampleEntry.Component}
            inputProps={values}
            // D2 — timing is sourced from the EXAMPLE, not the config.
            durationInFrames={exampleEntry.durationInFrames}
            fps={exampleEntry.fps}
            compositionWidth={exampleEntry.width}
            compositionHeight={exampleEntry.height}
            previewBackdrop={exampleEntry.previewBackdrop}
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
