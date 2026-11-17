"use client";

import type { AgentComponent } from "@ui-sdk/react/agent";
import { elementOf } from "@ui-sdk/react/observe";
import { formatHex, interpolate } from "culori";
import type { ControlConfig, ControlType } from "@/lib/customizer-config";
import type { Patch } from "@/lib/describe/types";

type Step = { ref: string; action: string; args?: unknown[] };
type Agent = {
  snapshot: () => AgentComponent[];
  act: (input: {
    steps: Step[];
  }) => Promise<{ ok: boolean; error?: { message: string } }>;
};

/** Which bridge component holds a control's value, by control type. */
const KIND: Record<ControlType["type"], string> = {
  text: "input",
  list: "textarea",
  number: "slider",
  "number-input": "number-input",
  color: "color-picker",
  select: "select",
  font: "select",
  boolean: "switch",
};

export interface TunePace {
  /** The cursor's flight to the next target. */
  move: number;
  /** A value gliding to its target: a slider, a colour. */
  glide: number;
  /** A popup opening, and the pause on a control after it changed. */
  settle: number;
}

export const PACE: TunePace = { move: 320, glide: 360, settle: 180 };
export const INSTANT: TunePace = { move: 0, glide: 0, settle: 0 };

/** The colour a picker shows while its prop is auto (color-control.tsx). */
const AUTO_SWATCH = "#808080";
const FRAMES = 10;

const wait = (ms: number) =>
  ms > 0
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();

/** A part of an open popup, which ui-sdk renders in the top layer. */
function visible(selector: string, text?: string): HTMLElement | null {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].filter(
    (element) =>
      element.getClientRects().length > 0 &&
      (text === undefined || element.textContent?.trim() === text),
  );
  return found.at(-1) ?? null;
}

function stepped(value: number, control: { min: number; step: number }) {
  const steps = Math.round((value - control.min) / control.step);
  return Number((control.min + steps * control.step).toFixed(6));
}

export interface TuneCallbacks {
  /** Moves the cursor to an element over `duration` ms; null hides it. */
  onStep?: (element: HTMLElement | null, duration: number) => void;
  /** A popup opened: the cursor has to come back on top of it. */
  onPopup?: () => void;
}

/**
 * Applies a patch the way the browser's agent would: through the ui-sdk
 * bridge, one control at a time, so each change runs the control's own API
 * and `onValueChange` with `source: "agent"`. With a pace it also shows the
 * work: the cursor flies to each control, a colour opens its picker and
 * steers the thumb to the new colour, a select opens and picks the item, a
 * slider glides. Closed groups are opened first. Whatever the bridge
 * couldn't set comes back, for the caller to apply directly.
 */
export async function tuneWithAgent({
  agent,
  root,
  controls,
  values,
  patch,
  pace = PACE,
  onStep,
  onPopup,
}: {
  agent: Agent;
  root: HTMLElement;
  controls: ControlConfig;
  values: Record<string, unknown>;
  patch: Patch;
  pace?: TunePace;
} & TuneCallbacks): Promise<Patch> {
  const show = pace.move > 0;
  const missed: Patch = {};
  /**
   * The bridge refs of a control's parts, from a fresh snapshot. Fresh
   * because a control inside a closed group is off the page (`offPage`) until
   * the group opens, and only then gets refs the agent can act on.
   */
  const refsOf = (key: string) => {
    const refs = new Map<string, string>();
    for (const entry of agent.snapshot()) {
      if (entry.offPage || entry.component === "collapsible") continue;
      const element = elementOf(entry.ref);
      if (!(element instanceof HTMLElement) || !root.contains(element))
        continue;
      if (
        element.closest<HTMLElement>("[data-control]")?.dataset.control !== key
      ) {
        continue;
      }
      if (!refs.has(entry.component)) refs.set(entry.component, entry.ref);
    }
    return refs;
  };

  /** The collapsible group around an element, with whether it is open now. */
  const groupOf = (element: HTMLElement) => {
    const holder = element.parentElement?.closest<HTMLElement>(
      '[data-slot="collapsible"]',
    );
    if (!holder) return null;
    for (const entry of agent.snapshot()) {
      if (
        entry.component === "collapsible" &&
        elementOf(entry.ref) === holder
      ) {
        return { ref: entry.ref, element: holder, open: entry.open === true };
      }
    }
    return null;
  };

  const wrapper = (key: string) =>
    root.querySelector<HTMLElement>(`[data-control="${CSS.escape(key)}"]`);
  // In the order the panel shows them, so the cursor reads top to bottom.
  const keys = Object.keys(patch)
    .filter((key) => controls[key])
    .sort((a, b) => {
      const ea = wrapper(a);
      const eb = wrapper(b);
      if (!ea || !eb) return 0;
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1;
    });

  const run = async (...steps: Step[]) => (await agent.act({ steps })).ok;
  const fly = async (element: HTMLElement | null) => {
    if (!show || !element) return;
    onStep?.(element, pace.move);
    await wait(pace.move);
  };

  async function tuneColor(
    refs: Map<string, string>,
    from: unknown,
    to: unknown,
  ) {
    const picker = refs.get("color-picker");
    const popover = refs.get("popover");
    if (!picker) return false;
    if (!show || !popover) {
      if (to === "" && popover) {
        return run({
          ref: popover,
          action: "press",
          args: ["Use theme color"],
        });
      }
      return run({ ref: picker, action: "setValue", args: [to] });
    }
    if (!(await run({ ref: popover, action: "setOpen", args: [true] }))) {
      return false;
    }
    onPopup?.();
    await wait(pace.settle);
    let ok: boolean;
    if (to === "") {
      await fly(visible("button", "Use theme color"));
      ok = await run({
        ref: popover,
        action: "press",
        args: ["Use theme color"],
      });
    } else {
      const start = typeof from === "string" && from ? from : AUTO_SWATCH;
      const mix = interpolate([start, String(to)], "oklch");
      await fly(visible('[data-slot="color-picker-area-thumb"]'));
      ok = true;
      for (let i = 1; i <= FRAMES && ok; i++) {
        const t = i / FRAMES;
        const color = i === FRAMES ? to : formatHex(mix(1 - (1 - t) ** 3));
        ok = await run({ ref: picker, action: "setValue", args: [color] });
        // The thumb moves with the colour; the cursor keeps hold of it.
        const thumb = visible('[data-slot="color-picker-area-thumb"]');
        if (thumb) onStep?.(thumb, pace.glide / FRAMES);
        await wait(pace.glide / FRAMES);
      }
      await wait(pace.settle);
    }
    await run({ ref: popover, action: "setOpen", args: [false] });
    return ok;
  }

  async function tuneSelect(ref: string, to: unknown) {
    if (!show) return run({ ref, action: "setValue", args: [to] });
    if (!(await run({ ref, action: "setOpen", args: [true] }))) return false;
    onPopup?.();
    await wait(pace.settle);
    await fly(visible('[data-slot="select-item"]', String(to)));
    const ok = await run({ ref, action: "setValue", args: [to] });
    if (visible('[data-slot="select-content"]')) {
      await run({ ref, action: "setOpen", args: [false] });
    }
    return ok;
  }

  async function tuneNumber(
    ref: string,
    control: ControlType & { type: "number" },
    element: HTMLElement,
    from: unknown,
    to: number,
  ) {
    if (!show || typeof from !== "number") {
      return run({ ref, action: "setValue", args: [to] });
    }
    const thumb = () =>
      element.querySelector<HTMLElement>('[data-slot="slider-thumb"]');
    await fly(thumb());
    for (let i = 1; i <= FRAMES; i++) {
      const t = i / FRAMES;
      const value =
        i === FRAMES
          ? to
          : stepped(from + (to - from) * (1 - (1 - t) ** 3), control);
      if (!(await run({ ref, action: "setValue", args: [value] })))
        return false;
      // The thumb moves with the value; the cursor keeps hold of it.
      const held = thumb();
      if (held) onStep?.(held, pace.glide / FRAMES);
      await wait(pace.glide / FRAMES);
    }
    return true;
  }

  for (const key of keys) {
    const control = controls[key];
    const element = wrapper(key);
    const from = values[key];
    const to = patch[key];
    if (!element) {
      missed[key] = to;
      continue;
    }

    const group = groupOf(element);
    if (group && !group.open) {
      // A closed group is opened the way a person would: go to its header,
      // open it, give the panel a moment to unfold.
      const header = group.element.querySelector<HTMLElement>(
        '[data-slot="collapsible-trigger"]',
      );
      header?.scrollIntoView?.({
        block: "nearest",
        behavior: show ? "smooth" : "auto",
      });
      await fly(header);
      header?.setAttribute("data-agent-active", "");
      await run({ ref: group.ref, action: "setOpen", args: [true] });
      await wait(Math.max(pace.settle, 16));
      header?.removeAttribute("data-agent-active");
    }

    const refs = refsOf(key);
    const ref = refs.get(KIND[control.type]) ?? refs.get("textarea");
    if (!ref && !refs.has("color-picker")) {
      missed[key] = to;
      continue;
    }

    element.scrollIntoView?.({
      block: "nearest",
      behavior: show ? "smooth" : "auto",
    });
    await fly(element);
    element.setAttribute("data-agent-active", "");

    let ok = false;
    if (control.type === "color") ok = await tuneColor(refs, from, to);
    else if (control.type === "select" || control.type === "font") {
      ok = await tuneSelect(ref as string, to);
    } else if (control.type === "number" && typeof to === "number") {
      ok = await tuneNumber(ref as string, control, element, from, to);
    } else if (control.type === "boolean") {
      ok = await run({ ref: ref as string, action: "setChecked", args: [to] });
    } else {
      const value = Array.isArray(to) ? to.join("\n") : to;
      ok = await run({ ref: ref as string, action: "setValue", args: [value] });
    }
    if (!ok) missed[key] = to;

    await wait(pace.settle);
    element.removeAttribute("data-agent-active");
  }
  onStep?.(null, 0);
  return missed;
}
