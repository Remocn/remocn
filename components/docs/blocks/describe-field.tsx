"use client";

import { Button } from "@ui-sdk/react/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible";
import { Field } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import {
  type FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTrackEvent } from "@/lib/analytics";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import {
  type DeviceModel,
  describeStatus,
  type Post,
  runDescribe,
} from "@/lib/describe/client";
import { moodsFor } from "@/lib/describe/moods";
import {
  askDeviceModel,
  deviceModelReady,
  languageOf,
} from "@/lib/describe/on-device";
import { sanitizePatch } from "@/lib/describe/patch";
import { MAX_TEXT } from "@/lib/describe/policy";
import type { Preset } from "@/lib/describe/types";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const BROWSER_MODEL: DeviceModel = {
  ready: deviceModelReady,
  ask: askDeviceModel,
  language: languageOf,
};

const CHIP =
  "inline-flex h-[26px] shrink-0 cursor-pointer items-center rounded-full px-2.5 text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 disabled:cursor-default disabled:opacity-50 max-md:h-8";

const MAX_CHIPS = 6;

/** What the placeholder types out, one after another. */
const EXAMPLES = [
  "slower and warmer",
  "feel like a terminal",
  "bold type, punchier",
  "calm, on a light page",
];

type HistoryItem = { text: string; summary: string };

const HISTORY_KEY = "remocn:describe-history";
const HISTORY_SIZE = 12;

/**
 * Requests the visitor applied, newest first, kept in this browser across
 * pages: "slower and warmer" works on most components.
 */
function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        setItems(
          saved
            .filter(
              (item): item is HistoryItem =>
                typeof item?.text === "string" &&
                typeof item?.summary === "string",
            )
            .slice(0, HISTORY_SIZE),
        );
      }
    } catch {}
  }, []);
  const add = (item: HistoryItem) => {
    setItems((prev) => {
      const next = [
        item,
        ...prev.filter(
          (old) => old.text.toLowerCase() !== item.text.toLowerCase(),
        ),
      ].slice(0, HISTORY_SIZE);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  return { items, add };
}

const ANIMATE_KEY = "remocn:describe-animate";

/** Whether the agent shows its work; the visitor's choice, kept in this browser. */
function useShowAgent(): [boolean, (next: boolean) => void] {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(ANIMATE_KEY) === "off") setShow(false);
    } catch {}
  }, []);
  const change = (next: boolean) => {
    setShow(next);
    try {
      localStorage.setItem(ANIMATE_KEY, next ? "on" : "off");
    } catch {}
  };
  return [show, change];
}

const HIDDEN_KEY = "remocn:describe-hidden";

/**
 * Whether the visitor folded the dock away to see what it covers; kept in
 * this browser, so it stays folded on the next page too.
 */
function useHidden(): [boolean, (next: boolean) => void] {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(HIDDEN_KEY) === "1") setHidden(true);
    } catch {}
  }, []);
  const change = (next: boolean) => {
    setHidden(next);
    try {
      if (next) localStorage.setItem(HIDDEN_KEY, "1");
      else localStorage.removeItem(HIDDEN_KEY);
    } catch {}
  };
  return [hidden, change];
}

async function fetchPresets(name: string): Promise<Preset[]> {
  try {
    const response = await fetch(
      `/api/describe/presets?name=${encodeURIComponent(name)}`,
    );
    if (!response.ok) return [];
    const { presets } = (await response.json()) as { presets: Preset[] };
    return Array.isArray(presets) ? presets : [];
  } catch {
    return [];
  }
}

/** Types the examples out and back while the field is empty and idle. */
function useTypedExample(active: boolean): string {
  const [text, setText] = useState(EXAMPLES[0]);
  useEffect(() => {
    if (!active) return;
    let example = 0;
    let length = EXAMPLES[0].length;
    let direction = -1;
    let hold = 40;
    const timer = setInterval(() => {
      if (hold > 0) {
        hold--;
        return;
      }
      length += direction;
      if (length <= 0) {
        example = (example + 1) % EXAMPLES.length;
        direction = 1;
        length = 0;
        hold = 4;
      }
      if (direction === 1 && length >= EXAMPLES[example].length) {
        direction = -1;
        hold = 30;
      }
      setText(EXAMPLES[example].slice(0, length));
    }, 55);
    return () => clearInterval(timer);
  }, [active]);
  return active ? text : EXAMPLES[0];
}

/** Keeps the dock centred over the preview's column, which the layout moves. */
function useAnchorBox(anchor: () => HTMLElement | null) {
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const element = anchor();
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setBox({ left: rect.left + rect.width / 2, width: rect.width });
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [anchor]);
  return box;
}

/**
 * The describe dock: a field that floats at the bottom of the viewport over
 * the preview, where a sentence ("slower, dark background") or a preset chip
 * tunes the component. The panel's agent then walks the controls.
 */
export function DescribeField({
  name,
  title,
  swatch,
  controls,
  values,
  onApply,
  anchor,
  post,
  device = BROWSER_MODEL,
  loadPresets = fetchPresets,
}: {
  name: string;
  title?: string;
  /** A colour of the component, for the chip that says what is tuned. */
  swatch?: string;
  controls: ControlConfig;
  values: Record<string, unknown>;
  /**
   * Applies a patch; `origin` is where the agent's cursor starts, and
   * `animate` whether the agent shows its work or sets the values at once.
   */
  onApply: (
    patch: Record<string, unknown>,
    origin?: HTMLElement | null,
    options?: { animate: boolean },
  ) => void | Promise<void>;
  /** The element the dock centres over: the preview. */
  anchor?: () => HTMLElement | null;
  post?: Post;
  device?: DeviceModel | null;
  loadPresets?: (name: string) => Promise<Preset[]>;
}) {
  const trackEvent = useTrackEvent();
  const reducedMotion = usePrefersReducedMotion();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [status, setStatus] = useState<ReturnType<
    typeof describeStatus
  > | null>(null);
  const [own, setOwn] = useState<Preset[]>([]);
  const [mounted, setMounted] = useState(false);
  const history = useHistory();
  const [showAgent, setShowAgent] = useShowAgent();
  const switchId = useId();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hidden, setHidden] = useHidden();
  // Where focus goes after the dock folds or unfolds: the control that
  // replaced the one just pressed, so keyboard users don't land on <body>.
  const moveFocus = useRef(false);
  const showButton = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const request = useRef(0);
  const submitButton = useRef<HTMLButtonElement>(null);
  const anchorOf = useRef(anchor);
  anchorOf.current = anchor;
  const [findAnchor] = useState(() => () => anchorOf.current?.() ?? null);
  const box = useAnchorBox(findAnchor);
  const typed = useTypedExample(!text && !focused && !reducedMotion);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (hidden) showButton.current?.focus();
    else form.current?.querySelector("input")?.focus();
  }, [hidden]);

  const fold = (next: boolean) => {
    moveFocus.current = true;
    setHistoryOpen(false);
    setHidden(next);
  };

  useEffect(() => {
    let live = true;
    loadPresets(name).then((presets) => {
      if (live) setOwn(presets);
    });
    return () => {
      live = false;
    };
  }, [name, loadPresets]);

  const chips = useMemo(() => {
    const moods = moodsFor(controls, getDefaults(controls));
    const fitting = own
      .map((preset) => ({
        ...preset,
        props: sanitizePatch(controls, preset.props),
      }))
      .filter((preset) => Object.keys(preset.props).length > 0);
    const seen = new Set<string>();
    return [...fitting, ...moods]
      .filter((preset) => {
        const label = preset.label.toLowerCase();
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      })
      .slice(0, MAX_CHIPS);
  }, [own, controls]);

  const run = async (
    patch: Record<string, unknown>,
    origin: HTMLElement | null,
  ) => {
    setTuning(true);
    try {
      await onApply(patch, origin, { animate: showAgent });
    } finally {
      setTuning(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const sentence = text.trim();
    if (!sentence || busy || tuning) return;
    const id = ++request.current;
    setBusy(true);
    try {
      const result = await runDescribe({
        name,
        text: sentence,
        values,
        controls,
        post,
        device,
      });
      if (id !== request.current) return;
      const next = describeStatus(result, controls);
      setStatus(next);
      // An applied request moves to the history and the field is free for
      // the next; a refused one stays, to be reworded.
      if (next.tone !== "rejected") {
        history.add({ text: sentence, summary: next.text });
        setText("");
      }
      trackEvent("customizer_described", {
        component: name,
        tier: result.tier ?? "none",
        ai: result.ai,
        understood: result.understood,
        props: Object.keys(result.patch).length,
      });
      setBusy(false);
      await run(result.patch, submitButton.current);
    } catch (error) {
      if (id !== request.current) return;
      setStatus({
        tone: "partial",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      if (id === request.current) setBusy(false);
    }
  };

  const reuse = (item: HistoryItem) => {
    setText(item.text);
    setHistoryOpen(false);
    form.current?.querySelector("input")?.focus();
  };

  const applyPreset = (preset: Preset, origin: HTMLElement) => {
    if (busy || tuning) return;
    setStatus(null);
    void run(preset.props, origin);
    trackEvent("customizer_preset_applied", {
      component: name,
      preset: preset.id,
    });
  };

  const working = busy || tuning;

  // Folded, the dock is a small pill at the right edge of where it was, so
  // it no longer covers the preview or the controls under it.
  const width = box ? Math.min(600, box.width - 32) : 0;
  const folded = (
    <div
      data-agent-hidden=""
      data-describe-dock=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <Button
        ref={showButton}
        onClick={() => fold(false)}
        style={box ? { left: box.left + width / 2 } : undefined}
        className={cn(
          "pointer-events-auto absolute bottom-6 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-card pr-3 pl-3.5 text-[13px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--color-border),0_8px_24px_-8px_rgb(14_16_18/24%)] outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
          box
            ? "-translate-x-full max-md:right-4 max-md:left-auto! max-md:translate-x-0"
            : "right-4",
          "max-md:bottom-[max(12px,env(safe-area-inset-bottom))] max-md:h-11",
        )}
      >
        Describe
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3">
          <path
            d="m6 15 6-6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </div>
  );

  const dock = (
    // The agent bridge sets props directly; this field calls a paid model.
    <div
      data-agent-hidden=""
      data-describe-dock=""
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background/75"
      />
      <div
        style={box ? { left: box.left, width } : undefined}
        className={cn(
          "pointer-events-auto absolute bottom-6 flex flex-col gap-2.5 rounded-2xl bg-card py-2.5 pr-2.5 pl-3.5 text-card-foreground shadow-[inset_0_0_0_1px_var(--color-border),0_18px_50px_-12px_rgb(14_16_18/28%),0_2px_6px_rgb(14_16_18/6%)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500",
          box
            ? "-translate-x-1/2 max-md:inset-x-4 max-md:w-auto! max-md:translate-x-0"
            : "inset-x-4 mx-auto max-w-[600px]",
          "max-md:bottom-[max(12px,env(safe-area-inset-bottom))]",
        )}
      >
        <Collapsible
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          className="flex flex-col"
        >
          {/* The dock sits at the bottom of the screen, so history opens upwards. */}
          <CollapsiblePanel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
            <ul className="mb-2 flex max-h-52 flex-col gap-px overflow-y-auto border-b border-border pb-2">
              {history.items.map((item) => (
                <li key={item.text}>
                  <Button
                    onClick={() => reuse(item)}
                    className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted"
                  >
                    <span className="w-full truncate text-[13px] leading-[18px] text-foreground">
                      {item.text}
                    </span>
                    <span className="w-full truncate text-xs leading-4 text-muted-foreground">
                      {item.summary}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </CollapsiblePanel>
          <div className="flex min-h-5 items-center gap-2.5 px-0.5">
            <label
              htmlFor={switchId}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none"
            >
              Show agent
              <Switch
                id={switchId}
                checked={showAgent}
                onCheckedChange={(checked) => setShowAgent(checked)}
                disabled={working}
                className="relative h-4 w-7 shrink-0 cursor-pointer rounded-full bg-muted-foreground/30 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-default disabled:opacity-50 data-checked:bg-foreground"
              >
                <SwitchThumb className="absolute top-0.5 left-0.5 size-3 rounded-full bg-card transition-transform duration-150 ease-[cubic-bezier(0.19,1,0.22,1)] data-checked:translate-x-3 motion-reduce:transition-none" />
              </Switch>
            </label>
            <p
              aria-live="polite"
              className={cn(
                "min-w-0 flex-1 truncate text-xs leading-4",
                status?.tone === "rejected"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground",
              )}
            >
              {status?.text}
            </p>
            {history.items.length > 0 ? (
              <CollapsibleTrigger className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 [&[data-open]_svg]:rotate-180">
                History
                <span className="tabular-nums text-muted-foreground/70">
                  {history.items.length}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-3 transition-transform duration-200 motion-reduce:transition-none"
                >
                  <path
                    d="m6 15 6-6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </CollapsibleTrigger>
            ) : null}
            <Button
              aria-label="Hide"
              title="Hide"
              onClick={() => fold(true)}
              className="-my-1 -mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 max-md:size-8"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
                <path
                  d="m6 9 6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </Collapsible>
        <form
          ref={form}
          onSubmit={submit}
          className="flex items-center gap-2.5"
        >
          {title ? (
            <span className="inline-flex h-[26px] max-w-40 shrink-0 items-center gap-1.5 rounded-[7px] bg-muted pr-2 pl-1.5 text-xs font-medium text-foreground max-md:hidden">
              <i
                aria-hidden="true"
                className="size-3.5 shrink-0 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/10%)]"
                style={{ background: swatch ?? "var(--color-primary-bright)" }}
              />
              <span className="truncate">{title}</span>
            </span>
          ) : null}
          <Field className="relative flex min-w-0 flex-1 items-center">
            <Input
              type="text"
              aria-label="Describe"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="go"
              maxLength={MAX_TEXT}
              placeholder={focused ? "Describe the look…" : undefined}
              value={text}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onValueChange={(next) => setText(next)}
              className="h-8 w-full min-w-0 bg-transparent text-[15px] leading-[22px] outline-none placeholder:text-muted-foreground/70 max-md:text-base"
            />
            {!text && !focused ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-[15px] text-muted-foreground/70"
              >
                Try “{typed}
                <span className="mx-px inline-block h-[17px] w-[1.5px] bg-primary-bright motion-safe:animate-pulse" />
                ”
              </span>
            ) : null}
          </Field>
          <Button
            ref={submitButton}
            type="submit"
            aria-label={working ? "Tuning" : "Apply"}
            disabled={working || !text.trim()}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-foreground text-background outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-default disabled:opacity-40 max-md:size-10"
          >
            {working ? (
              <span
                aria-hidden="true"
                className="size-3.5 rounded-full border-2 border-background/40 border-t-background motion-safe:animate-spin"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-[15px]"
              >
                <path
                  d="M12 19V5m-7 7 7-7 7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Button>
        </form>
        {chips.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <fieldset
              aria-label="Presets"
              className="m-0 flex min-w-0 gap-1.5 overflow-x-auto border-0 p-0 [scrollbar-width:none]"
            >
              {chips.map((preset) => (
                <Button
                  key={preset.id}
                  onClick={(event) => applyPreset(preset, event.currentTarget)}
                  title={preset.description}
                  disabled={working}
                  className={CHIP}
                >
                  {preset.label}
                </Button>
              ))}
            </fieldset>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(hidden ? folded : dock, document.body);
}
