import { defineTimeline } from "@/lib/remocn/timeline";

// Each step of `steps` is a group of key caps that rises in, presses its
// chords one after another so the last chord fires at the step's `at`, and
// releases. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type KeystrokeElementId = `step:${number}`;

export type KeystrokeModifier = "fn" | "ctrl" | "alt" | "shift" | "meta";

export interface KeystrokeCue {
  /** Frame the step's last chord fires. */
  at: number;
  /** Chords separated by spaces, keys by `+`: "mod+k", "g i". */
  keys: string;
  /** Frames the keys stay down. */
  hold?: number;
}

export interface KeystrokeTimingProps {
  steps?: readonly KeystrokeCue[];
  platform?: string;
  linger?: number;
}

export const KEYSTROKE_STEPS: readonly KeystrokeCue[] = [
  { at: 20, keys: "mod+k" },
  { at: 78, keys: "g i" },
  { at: 114, keys: "shift+mod+p" },
];

export const PRESS = 3;
const PRESS_GAP = 3;
const RELEASE_GAP = 3;
const LEAD = 7;
const BEAT = 2;
export const HOLD = 8;
export const MAX_FRAMES = 600;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const within = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => clamp(finite(value, fallback), min, max);
const round = (value: number) => Math.round(value * 1000) / 1000 + 0;
const fpsOf = (fps: number | undefined) => Math.max(1, finite(fps, 30));

export const MODIFIERS = new Map<string, KeystrokeModifier>([
  ["fn", "fn"],
  ["ctrl", "ctrl"],
  ["control", "ctrl"],
  ["alt", "alt"],
  ["option", "alt"],
  ["opt", "alt"],
  ["shift", "shift"],
  ["cmd", "meta"],
  ["command", "meta"],
  ["meta", "meta"],
  ["win", "meta"],
  ["super", "meta"],
]);

const modOf = (windows: boolean): KeystrokeModifier =>
  windows ? "ctrl" : "meta";

export function splitChord(token: string) {
  const parts = token.split("+");
  const names: string[] = [];
  for (const [index, part] of parts.entries()) {
    if (part !== "") names.push(part);
    else if (index === parts.length - 1 && parts[index - 1] === "") {
      names.push("+");
    }
  }
  return names;
}

/** Keys in each chord of `keys`, as the caps parse them. */
export function chordSizesOf(keys: string, platform?: string): number[] {
  if (typeof keys !== "string") return [];
  const windows = platform === "windows";
  return keys
    .trim()
    .split(/\s+/)
    .filter((token) => token !== "")
    .map((token) => {
      const held = new Set<KeystrokeModifier>();
      let plain = 0;
      for (const part of splitChord(token)) {
        const name = part.toLowerCase();
        const modifier = name === "mod" ? modOf(windows) : MODIFIERS.get(name);
        if (modifier) held.add(modifier);
        else plain += 1;
      }
      return held.size + plain;
    })
    .filter((size) => size > 0);
}

export interface KeystrokeChordPlan {
  enter: number;
  fire: number;
  keys: { press: number; release: number }[];
}

/** Each chord's keys go down `PRESS_GAP` apart and come up in reverse. */
export function planChords(sizes: readonly number[], hold: number) {
  const timing: KeystrokeChordPlan[] = [];
  let enter = 0;
  for (const size of sizes) {
    const last = size - 1;
    const fire = enter + LEAD + PRESS_GAP * last + PRESS;
    const keys = Array.from({ length: size }, (_, index) => ({
      press: fire - PRESS - PRESS_GAP * (last - index),
      release: fire + hold + RELEASE_GAP * (last - index),
    }));
    timing.push({ enter, fire, keys });
    enter = fire + hold + RELEASE_GAP * last + BEAT;
  }
  return timing;
}

export interface KeystrokeDraft {
  step: number;
  keys: string;
  timing: KeystrokeChordPlan[];
  at: number;
  hold: number;
  enter: number;
  lastRelease: number;
}

/** The steps placed so each one's last chord fires at its `at`, in order. */
export function keystrokePlan(
  options: KeystrokeTimingProps & { fps?: number } = {},
) {
  const scale = 30 / fpsOf(options.fps);
  const lingerFrames = within(options.linger, 30, 0, MAX_FRAMES);
  const linger = lingerFrames * scale;
  const steps = options.steps ?? KEYSTROKE_STEPS;
  const drafts: KeystrokeDraft[] = [];
  for (const [step, entry] of steps.entries()) {
    if (typeof entry.at !== "number" || !Number.isFinite(entry.at)) continue;
    const sizes = chordSizesOf(entry.keys, options.platform);
    if (sizes.length === 0) continue;
    const at = entry.at * scale;
    const hold = within(entry.hold, HOLD, 0, MAX_FRAMES) * scale;
    const planned = planChords(sizes, hold);
    const offset = at - planned[planned.length - 1].fire;
    const timing = planned.map((chord) => ({
      enter: round(chord.enter + offset),
      fire: round(chord.fire + offset),
      keys: chord.keys.map((key) => ({
        press: round(key.press + offset),
        release: round(key.release + offset),
      })),
    }));
    const releases = timing.flatMap((chord) =>
      chord.keys.map((key) => key.release),
    );
    drafts.push({
      step,
      keys: entry.keys,
      timing,
      at: round(at),
      hold: round(hold),
      enter: timing[0].enter,
      lastRelease: Math.max(...releases),
    });
  }
  drafts.sort((a, b) => a.enter - b.enter || a.at - b.at || a.step - b.step);
  return { linger, drafts };
}

// A step runs from its first cap rising in to its last key coming up; how
// long it lingers after that depends on the steps that follow it.
export const keystrokeTimeline = defineTimeline<
  KeystrokeElementId,
  KeystrokeTimingProps
>((props) =>
  keystrokePlan(props).drafts.map((draft) => ({
    id: `step:${draft.step}`,
    lane: "Keys",
    label: draft.keys,
    start: draft.enter,
    length: draft.lastRelease - draft.enter,
  })),
);
