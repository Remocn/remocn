"use client";

import { useMemo } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export type KeystrokePlatform = "mac" | "windows";
export type KeystrokeTheme = "light" | "dark";
export type KeystrokeIcon =
  | "command"
  | "option"
  | "shift"
  | "control"
  | "return"
  | "delete"
  | "escape"
  | "tab"
  | "space"
  | "capsLock"
  | "up"
  | "down"
  | "left"
  | "right";

export interface KeystrokeStep {
  at: number;
  keys: string;
  hold?: number;
}

export interface KeystrokeProps {
  steps?: readonly KeystrokeStep[];
  platform?: KeystrokePlatform;
  theme?: KeystrokeTheme;
  accent?: string;
  x?: number;
  y?: number;
  size?: number;
  linger?: number;
  speed?: number;
  className?: string;
}

export interface KeystrokeOptions extends Omit<KeystrokeProps, "className"> {
  width?: number;
  height?: number;
  fps?: number;
}

export type KeystrokeLegend =
  | { kind: "icon"; icon: KeystrokeIcon }
  | { kind: "char"; text: string }
  | { kind: "word"; text: string };

export interface KeystrokeKey {
  name: string;
  label: string;
  legend: KeystrokeLegend;
  units: number;
  modifier: boolean;
}

export type KeystrokeChord = KeystrokeKey[];

export interface KeystrokeKeyTiming {
  press: number;
  release: number;
}

export interface KeystrokeChordTiming {
  enter: number;
  fire: number;
  keys: KeystrokeKeyTiming[];
}

export interface KeystrokeLayout {
  caps: { chord: number; index: number; x: number; width: number }[];
  separators: { chord: number; x: number; width: number }[];
  widths: number[];
}

export interface KeystrokeGroup {
  index: number;
  step: number;
  keys: string;
  label: string;
  chords: KeystrokeChord[];
  timing: KeystrokeChordTiming[];
  layout: KeystrokeLayout;
  at: number;
  hold: number;
  enter: number;
  lastRelease: number;
  pushes: number[];
  exit: number;
  end: number;
}

export interface KeystrokePalette {
  cap: string;
  edge: string;
  wall: string;
  ink: string;
  separator: string;
  shadow: string;
}

type Unset = "steps" | "className";
type Modifier = "fn" | "ctrl" | "alt" | "shift" | "meta";
type Named =
  | "enter"
  | "escape"
  | "tab"
  | "space"
  | "backspace"
  | "delete"
  | "capsLock"
  | "up"
  | "down"
  | "left"
  | "right"
  | "home"
  | "end"
  | "pageUp"
  | "pageDown";
type IconShape = { box: string; paths: readonly string[] };
type IconSpec = { label: string; icon: KeystrokeIcon; units: number };
type NamedSpec = IconSpec | { label: string; word: string; units: number };
type Draft = Omit<
  KeystrokeGroup,
  "index" | "label" | "layout" | "pushes" | "exit" | "end"
>;

export const keystrokeDefaults: Required<Omit<KeystrokeProps, Unset>> = {
  platform: "mac",
  theme: "light",
  accent: "#0a84ff",
  x: 0.5,
  y: 0.86,
  size: 64,
  linger: 30,
  speed: 1,
};

export const keystrokeDefaultSteps: readonly KeystrokeStep[] = [
  { at: 20, keys: "mod+k" },
  { at: 78, keys: "g i" },
  { at: 114, keys: "shift+mod+p" },
];

export const keystrokePalettes: Record<KeystrokeTheme, KeystrokePalette> = {
  light: {
    cap: "#fcfcfb",
    edge: "#dfdfda",
    wall: "#cfcfca",
    ink: "#1d1d1f",
    separator: "#8e8e89",
    shadow: "rgba(20, 20, 16, 0.18)",
  },
  dark: {
    cap: "#38393e",
    edge: "#48494f",
    wall: "#1f2023",
    ink: "#f5f5f7",
    separator: "#9d9da4",
    shadow: "rgba(0, 0, 0, 0.5)",
  },
};

const PRESS = 3;
const PRESS_GAP = 3;
const RELEASE_GAP = 3;
const LEAD = 7;
const STAGGER = 1;
const BEAT = 2;
const HOLD = 8;
const RELEASE = 10;
const RELEASE_RISE = 3;
const RELEASE_TAPER = 6;
const RELEASE_DAMPING = 0.46;
const ENTER = 10;
const ENTER_RISE = 4;
const ENTER_TAPER = 7;
const ENTER_DAMPING = 0.65;
const FADE_IN = 4;
const SLIDE = 10;
const DIM = 6;
const DIM_OPACITY = 0.45;
const PUSH = 10;
const BRIEF = 18;
const EXIT = 8;
const TAIL = 14;
const MAX_FRAMES = 600;
const MIN_SIZE = 8;
const MAX_SIZE = 400;
const WALL = 0.16;
const TRAVEL = 0.12;
const RADIUS = 0.16;
const RISE = 0.42;
const KEY_GAP = 0.14;
const SEPARATOR = 0.95;
const CHAR_FONT = 0.4;
const WORD_FONT = 0.26;
const ICON_SIZE = 0.36;
const SEPARATOR_FONT = 0.25;
const WORD_CHAR = 0.6 * WORD_FONT;
const WORD_PAD = 0.24;
const WINDOWS_WORD = 1.25;
const SLOT_RISE = 1.09;
const SLOT_SCALE = 0.86;
const SLOT_OPACITY = 0.55;
const EXIT_DRIFT = 0.22;
const EXIT_SCALE = 0.04;
const SHADOW_Y = 0.07;
const SHADOW_Y_PRESSED = 0.02;
const SHADOW_BLUR = 0.11;
const SHADOW_BLUR_PRESSED = 0.03;
const GLIDE = Easing.bezier(0.33, 1, 0.68, 1);
const FONT_FAMILY =
  'var(--font-geist-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif)';

const ICONS: Record<KeystrokeIcon, IconShape> = {
  command: {
    box: "0 0 24 24",
    paths: [
      "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",
    ],
  },
  option: { box: "0 0 24 24", paths: ["M3 3h6l6 18h6", "M14 3h7"] },
  shift: {
    box: "0 0 24 24",
    paths: [
      "M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z",
    ],
  },
  control: { box: "0 0 24 24", paths: ["m18 15-6-6-6 6"] },
  return: {
    box: "0 0 24 24",
    paths: ["M20 4v7a4 4 0 0 1-4 4H4", "m9 10-5 5 5 5"],
  },
  delete: {
    box: "0 0 24 24",
    paths: [
      "M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z",
      "m12 9 6 6",
      "m18 9-6 6",
    ],
  },
  escape: {
    box: "0 0 24 24",
    paths: ["M2 8V2h6", "m2 2 10 10", "M12 2A10 10 0 1 1 2 12"],
  },
  tab: {
    box: "0 0 24 24",
    paths: ["M17 12H3", "m11 18 6-6-6-6", "M21 5v14"],
  },
  space: {
    box: "0 6 24 24",
    paths: ["M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1"],
  },
  capsLock: {
    box: "0 0 24 24",
    paths: [
      "M14 16a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-6.939-6.939a1.207 1.207 0 0 0-1.708 0l-6.94 6.94a.707.707 0 0 0 .5 1.206H8a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1z",
      "M9 20h6",
    ],
  },
  up: { box: "0 0 24 24", paths: ["m5 12 7-7 7 7", "M12 19V5"] },
  down: { box: "0 0 24 24", paths: ["M12 5v14", "m19 12-7 7-7-7"] },
  left: { box: "0 0 24 24", paths: ["m12 19-7-7 7-7", "M19 12H5"] },
  right: { box: "0 0 24 24", paths: ["M5 12h14", "m12 5 7 7-7 7"] },
};

const MODIFIERS = new Map<string, Modifier>([
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

const MODIFIER_ORDER: Record<KeystrokePlatform, readonly Modifier[]> = {
  mac: ["fn", "ctrl", "alt", "shift", "meta"],
  windows: ["fn", "meta", "ctrl", "alt", "shift"],
};

const MAC_MODIFIERS: Record<Exclude<Modifier, "fn">, IconSpec> = {
  ctrl: { label: "Control", icon: "control", units: 1 },
  alt: { label: "Option", icon: "option", units: 1 },
  shift: { label: "Shift", icon: "shift", units: 1.5 },
  meta: { label: "Command", icon: "command", units: 1 },
};

const WINDOWS_MODIFIERS: Record<Modifier, string> = {
  fn: "Fn",
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Win",
};

const NAMED = new Map<string, Named>([
  ["enter", "enter"],
  ["return", "enter"],
  ["esc", "escape"],
  ["escape", "escape"],
  ["tab", "tab"],
  ["space", "space"],
  ["backspace", "backspace"],
  ["delete", "delete"],
  ["del", "delete"],
  ["capslock", "capsLock"],
  ["up", "up"],
  ["arrowup", "up"],
  ["down", "down"],
  ["arrowdown", "down"],
  ["left", "left"],
  ["arrowleft", "left"],
  ["right", "right"],
  ["arrowright", "right"],
  ["home", "home"],
  ["end", "end"],
  ["pageup", "pageUp"],
  ["pgup", "pageUp"],
  ["pagedown", "pageDown"],
  ["pgdn", "pageDown"],
]);

const CHARACTERS = new Map<string, string>([
  ["plus", "+"],
  ["minus", "-"],
  ["comma", ","],
  ["period", "."],
  ["slash", "/"],
  ["backslash", "\\"],
  ["semicolon", ";"],
  ["quote", "'"],
  ["backquote", "`"],
  ["bracketleft", "["],
  ["bracketright", "]"],
  ["equal", "="],
]);

const ARROWS: Record<"up" | "down" | "left" | "right", IconSpec> = {
  up: { label: "Up Arrow", icon: "up", units: 1 },
  down: { label: "Down Arrow", icon: "down", units: 1 },
  left: { label: "Left Arrow", icon: "left", units: 1 },
  right: { label: "Right Arrow", icon: "right", units: 1 },
};

const NAMED_KEYS: Record<KeystrokePlatform, Record<Named, NamedSpec>> = {
  mac: {
    enter: { label: "Return", icon: "return", units: 1.5 },
    escape: { label: "Escape", icon: "escape", units: 1 },
    tab: { label: "Tab", icon: "tab", units: 1.25 },
    space: { label: "Space", icon: "space", units: 2.5 },
    backspace: { label: "Delete", icon: "delete", units: 1.25 },
    delete: { label: "Delete", icon: "delete", units: 1.25 },
    capsLock: { label: "Caps Lock", icon: "capsLock", units: 1.5 },
    ...ARROWS,
    home: { label: "Home", word: "home", units: 1 },
    end: { label: "End", word: "end", units: 1 },
    pageUp: { label: "Page Up", word: "page up", units: 1 },
    pageDown: { label: "Page Down", word: "page down", units: 1 },
  },
  windows: {
    enter: { label: "Enter", word: "Enter", units: WINDOWS_WORD },
    escape: { label: "Esc", word: "Esc", units: WINDOWS_WORD },
    tab: { label: "Tab", word: "Tab", units: WINDOWS_WORD },
    space: { label: "Space", word: "Space", units: 2.5 },
    backspace: { label: "Backspace", word: "Backspace", units: WINDOWS_WORD },
    delete: { label: "Delete", word: "Delete", units: WINDOWS_WORD },
    capsLock: { label: "Caps Lock", word: "Caps Lock", units: WINDOWS_WORD },
    ...ARROWS,
    home: { label: "Home", word: "Home", units: WINDOWS_WORD },
    end: { label: "End", word: "End", units: WINDOWS_WORD },
    pageUp: { label: "Page Up", word: "PgUp", units: WINDOWS_WORD },
    pageDown: { label: "Page Down", word: "PgDn", units: WINDOWS_WORD },
  },
};

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
const smoothstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const fpsOf = (fps: number | undefined) => Math.max(1, finite(fps, 30));
const rateOf = (speed: number | undefined) =>
  Math.max(0, finite(speed, keystrokeDefaults.speed));
const platformOf = (value: string | undefined): KeystrokePlatform =>
  value === "windows" ? value : "mac";
const themeOf = (value: string | undefined): KeystrokeTheme =>
  value === "dark" ? value : "light";
const accentOf = (value: string | undefined) =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : keystrokeDefaults.accent;
const modOf = (platform: KeystrokePlatform): Modifier =>
  platform === "mac" ? "meta" : "ctrl";

function eased(
  frames: number,
  duration: number,
  curve: (t: number) => number,
) {
  if (Number.isNaN(frames) || frames <= 0) return 0;
  if (frames >= duration) return 1;
  return curve(frames / duration);
}

function settle(rise: number, damping: number, taper: number, end: number) {
  const frequency = (Math.PI - Math.acos(damping)) / rise;
  const ratio = damping / Math.sqrt(1 - damping ** 2);
  return (frames: number) => {
    if (Number.isNaN(frames) || frames <= 0) return 0;
    if (frames >= end) return 1;
    const phase = frequency * frames;
    const decay = Math.exp(-ratio * phase);
    const ring = decay * (Math.cos(phase) + ratio * Math.sin(phase));
    return 1 - ring * (1 - smoothstep((frames - taper) / (end - taper)));
  };
}

const riseCurve = settle(ENTER_RISE, ENTER_DAMPING, ENTER_TAPER, ENTER);
const releaseCurve = settle(
  RELEASE_RISE,
  RELEASE_DAMPING,
  RELEASE_TAPER,
  RELEASE,
);

export function getKeystrokePress(frames: number) {
  return eased(frames, PRESS, smoothstep);
}

export function getKeystrokeRelease(frames: number) {
  return releaseCurve(frames);
}

export function getKeystrokeRise(frames: number) {
  return riseCurve(frames);
}

export function getKeystrokeDepth(time: number, timing: KeystrokeKeyTiming) {
  if (Number.isNaN(time) || time <= timing.press) return 0;
  if (time < timing.release) return getKeystrokePress(time - timing.press);
  const bottom = getKeystrokePress(timing.release - timing.press);
  return bottom * (1 - getKeystrokeRelease(time - timing.release));
}

export function getKeystrokeWordUnits(text: string, min = 1) {
  const raw = Array.from(text).length * WORD_CHAR + 2 * WORD_PAD;
  return Math.max(min, Math.ceil(raw * 4 - 1e-9) / 4);
}

function wordKey(
  name: string,
  label: string,
  text: string,
  platform: KeystrokePlatform,
  modifier: boolean,
  min = 1,
): KeystrokeKey {
  const floor = platform === "windows" ? Math.max(min, WINDOWS_WORD) : min;
  const units = getKeystrokeWordUnits(text, floor);
  return { name, label, legend: { kind: "word", text }, units, modifier };
}

function modifierKey(
  modifier: Modifier,
  platform: KeystrokePlatform,
): KeystrokeKey {
  if (platform === "windows") {
    const word = WINDOWS_MODIFIERS[modifier];
    return wordKey(modifier, word, word, platform, true);
  }
  if (modifier === "fn") return wordKey("fn", "Fn", "fn", platform, true);
  const { label, icon, units } = MAC_MODIFIERS[modifier];
  return {
    name: modifier,
    label,
    legend: { kind: "icon", icon },
    units,
    modifier: true,
  };
}

function namedKey(named: Named, platform: KeystrokePlatform): KeystrokeKey {
  const spec = NAMED_KEYS[platform][named];
  if ("word" in spec) {
    return wordKey(named, spec.label, spec.word, platform, false, spec.units);
  }
  return {
    name: named,
    label: spec.label,
    legend: { kind: "icon", icon: spec.icon },
    units: spec.units,
    modifier: false,
  };
}

function keyOf(part: string, platform: KeystrokePlatform): KeystrokeKey {
  const name = part.toLowerCase();
  const named = NAMED.get(name);
  if (named) return namedKey(named, platform);
  const character =
    CHARACTERS.get(name) ?? (Array.from(part).length === 1 ? part : undefined);
  if (character !== undefined) {
    const text = character.toUpperCase();
    return {
      name: character.toLowerCase(),
      label: text,
      legend: { kind: "char", text },
      units: 1,
      modifier: false,
    };
  }
  const fkey = /^f([1-9]|1\d|2[0-4])$/.exec(name);
  if (fkey) {
    const text = `F${fkey[1]}`;
    return wordKey(name, text, text, platform, false);
  }
  const text = `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
  return wordKey(name, text, text, platform, false);
}

function splitChord(token: string) {
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

function parseChord(token: string, platform: KeystrokePlatform) {
  const held = new Set<Modifier>();
  const keys: KeystrokeKey[] = [];
  for (const part of splitChord(token)) {
    const name = part.toLowerCase();
    const modifier = name === "mod" ? modOf(platform) : MODIFIERS.get(name);
    if (modifier) held.add(modifier);
    else keys.push(keyOf(part, platform));
  }
  const modifiers = MODIFIER_ORDER[platform]
    .filter((modifier) => held.has(modifier))
    .map((modifier) => modifierKey(modifier, platform));
  return [...modifiers, ...keys];
}

export function parseKeystrokeKeys(
  keys: string,
  platform?: KeystrokePlatform,
): KeystrokeChord[] {
  if (typeof keys !== "string") return [];
  const target = platformOf(platform);
  return keys
    .trim()
    .split(/\s+/)
    .filter((token) => token !== "")
    .map((token) => parseChord(token, target))
    .filter((chord) => chord.length > 0);
}

export function getKeystrokeLayout(
  chords: readonly KeystrokeChord[],
): KeystrokeLayout {
  const layout: KeystrokeLayout = { caps: [], separators: [], widths: [] };
  let cursor = 0;
  for (const [chord, keys] of chords.entries()) {
    if (chord > 0) {
      layout.separators.push({ chord, x: round(cursor), width: SEPARATOR });
      cursor += SEPARATOR;
    }
    for (const [index, key] of keys.entries()) {
      if (index > 0) cursor += KEY_GAP;
      layout.caps.push({ chord, index, x: round(cursor), width: key.units });
      cursor += key.units;
    }
    layout.widths.push(round(cursor));
  }
  return layout;
}

function schedule(chords: readonly KeystrokeChord[], hold: number) {
  const timing: KeystrokeChordTiming[] = [];
  let enter = 0;
  for (const chord of chords) {
    const last = chord.length - 1;
    const fire = enter + LEAD + PRESS_GAP * last + PRESS;
    const keys = chord.map((_, index) => ({
      press: fire - PRESS - PRESS_GAP * (last - index),
      release: fire + hold + RELEASE_GAP * (last - index),
    }));
    timing.push({ enter, fire, keys });
    enter = fire + hold + RELEASE_GAP * last + BEAT;
  }
  return timing;
}

export function getKeystrokeLeadIn(keys: string, hold = HOLD) {
  const chords = parseKeystrokeKeys(keys);
  if (chords.length === 0) return 0;
  const timing = schedule(chords, within(hold, HOLD, 0, MAX_FRAMES));
  return timing[timing.length - 1].fire - timing[0].enter;
}

export function getKeystrokeTimeline(
  options: Pick<KeystrokeOptions, "steps" | "platform" | "linger" | "fps"> = {},
) {
  const platform = platformOf(options.platform);
  const scale = 30 / fpsOf(options.fps);
  const lingerFrames = within(
    options.linger,
    keystrokeDefaults.linger,
    0,
    MAX_FRAMES,
  );
  const linger = lingerFrames * scale;
  const steps = options.steps ?? keystrokeDefaultSteps;
  const drafts: Draft[] = [];
  for (const [step, entry] of steps.entries()) {
    if (typeof entry.at !== "number" || !Number.isFinite(entry.at)) continue;
    const chords = parseKeystrokeKeys(entry.keys, platform);
    if (chords.length === 0) continue;
    const at = entry.at * scale;
    const hold = within(entry.hold, HOLD, 0, MAX_FRAMES) * scale;
    const planned = schedule(chords, hold);
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
      chords,
      timing,
      at: round(at),
      hold: round(hold),
      enter: timing[0].enter,
      lastRelease: Math.max(...releases),
    });
  }
  drafts.sort((a, b) => a.enter - b.enter || a.at - b.at || a.step - b.step);
  const groups = drafts.map((draft, index): KeystrokeGroup => {
    const pushes: number[] = [];
    let exit = Math.max(draft.enter, draft.lastRelease + linger);
    for (const newer of drafts.slice(index + 1)) {
      if (newer.enter >= exit + EXIT) break;
      const at = Math.max(newer.enter, draft.enter);
      const brief = Math.max(at, draft.lastRelease) + BRIEF;
      pushes.push(at);
      exit = Math.min(exit, pushes.length === 1 ? brief : at);
      if (pushes.length === 2) break;
    }
    exit = round(Math.max(exit, draft.enter));
    const label = draft.chords
      .map((chord) => chord.map((key) => key.label).join(" "))
      .join(" then ");
    return {
      ...draft,
      index,
      label,
      layout: getKeystrokeLayout(draft.chords),
      pushes,
      exit,
      end: round(exit + EXIT),
    };
  });
  const end = groups.reduce((latest, group) => Math.max(latest, group.end), 0);
  return { platform, linger: round(linger), groups, end };
}

export type KeystrokeTimeline = ReturnType<typeof getKeystrokeTimeline>;

export const keystrokeLength = getKeystrokeTimeline().end;

export function getKeystrokeDuration(
  options: Pick<KeystrokeOptions, "steps" | "linger" | "speed" | "fps"> = {},
) {
  const fps = fpsOf(options.fps);
  const rate = rateOf(options.speed);
  const { end } = getKeystrokeTimeline(options);
  const motion = rate === 0 ? 0 : (end * fps) / 30 / rate;
  return Math.ceil(round(motion)) + Math.round((TAIL * fps) / 30);
}

export function getKeystrokeTime(
  frame: number,
  options: Pick<KeystrokeOptions, "fps" | "speed"> = {},
) {
  const elapsed = Math.max(0, finite(frame, 0));
  return (elapsed * rateOf(options.speed) * 30) / fpsOf(options.fps);
}

export function getKeystrokeMetrics(size: number, unit = 1) {
  return {
    size: round(size),
    height: round(size),
    wall: round(size * WALL),
    travel: round(size * TRAVEL),
    keytop: round(size * (1 - WALL)),
    radius: round(size * RADIUS),
    rise: round(size * RISE),
    border: round(Math.max(1, unit)),
    charFont: round(size * CHAR_FONT),
    wordFont: round(size * WORD_FONT),
    icon: round(size * ICON_SIZE),
    separatorFont: round(size * SEPARATOR_FONT),
  };
}

export type KeystrokeMetrics = ReturnType<typeof getKeystrokeMetrics>;

function legendColor(ink: string, accent: string, amount: number) {
  const share = Math.floor(clamp(amount, 0, 1) * 100);
  if (share <= 0) return ink;
  if (share >= 100) return accent;
  return `color-mix(in srgb, ${accent} ${share}%, ${ink})`;
}

function fadeIn(frames: number) {
  return eased(frames, FADE_IN, (t) => 1 - (1 - t) ** 2);
}

function groupState(
  group: KeystrokeGroup,
  time: number,
  metrics: KeystrokeMetrics,
  palette: KeystrokePalette,
  accent: string,
) {
  const { size } = metrics;
  const slot = group.pushes.reduce(
    (sum, at) => sum + eased(time - at, PUSH, GLIDE),
    0,
  );
  const leaving = clamp((time - group.exit) / EXIT, 0, 1);
  const pushedAway = group.pushes.some((at) => at <= group.exit);
  const drift = (pushedAway ? -1 : 1) * EXIT_DRIFT * size * leaving ** 3;
  const dimmed = 1 - (1 - SLOT_OPACITY) * Math.min(1, slot);
  const last = group.chords.length - 1;
  let visible = group.layout.widths[0];
  for (let chord = 1; chord <= last; chord++) {
    const added = group.layout.widths[chord] - group.layout.widths[chord - 1];
    visible += added * eased(time - group.timing[chord].enter, SLIDE, GLIDE);
  }
  const left = -visible / 2;
  const caps = group.layout.caps.flatMap((cap) => {
    const timing = group.timing[cap.chord];
    const enter = timing.enter + cap.index * STAGGER;
    if (time <= enter) return [];
    const key = group.chords[cap.chord][cap.index];
    const depth = getKeystrokeDepth(time, timing.keys[cap.index]);
    const landing =
      group.timing.at(cap.chord + 1)?.fire ?? Number.POSITIVE_INFINITY;
    const dim = smoothstep((time - (landing - DIM)) / DIM);
    const lean = clamp(depth, -1, 1);
    const shadowY = SHADOW_Y - (SHADOW_Y - SHADOW_Y_PRESSED) * lean;
    const shadowBlur = SHADOW_BLUR - (SHADOW_BLUR - SHADOW_BLUR_PRESSED) * lean;
    return [
      {
        id: `${cap.chord}-${cap.index}`,
        chord: cap.chord,
        index: cap.index,
        key,
        x: round((left + cap.x) * size),
        y: round((1 - getKeystrokeRise(time - enter)) * metrics.rise),
        width: round(cap.width * size),
        opacity: round(fadeIn(time - enter) * (1 - (1 - DIM_OPACITY) * dim)),
        depth: round(depth),
        lift: round(depth * metrics.travel),
        wall: round(metrics.wall - depth * metrics.travel),
        shadowY: round(shadowY * size),
        shadowBlur: round(shadowBlur * size),
        color: legendColor(palette.ink, accent, clamp(depth, 0, 1)),
      },
    ];
  });
  const separators = group.layout.separators.flatMap((separator) => {
    const enter = group.timing[separator.chord].enter;
    if (time <= enter) return [];
    return [
      {
        id: `then-${separator.chord}`,
        chord: separator.chord,
        x: round((left + separator.x) * size),
        y: round((1 - getKeystrokeRise(time - enter)) * metrics.rise),
        width: round(separator.width * size),
        opacity: round(fadeIn(time - enter)),
      },
    ];
  });
  return {
    id: `${group.step}`,
    index: group.index,
    step: group.step,
    keys: group.keys,
    label: group.label,
    slot: round(slot),
    width: round(visible * size),
    y: round(-slot * SLOT_RISE * size + drift),
    scale: round((1 - (1 - SLOT_SCALE) * slot) * (1 - EXIT_SCALE * leaving)),
    opacity: round(dimmed * (1 - leaving ** 2)),
    caps,
    separators,
  };
}

export function getKeystrokeState(
  frame: number,
  options: KeystrokeOptions = {},
  timeline: KeystrokeTimeline = getKeystrokeTimeline(options),
) {
  const width = Math.max(1, finite(options.width, 1280));
  const height = Math.max(1, finite(options.height, 720));
  const unit = height / 720;
  const reference = within(
    options.size,
    keystrokeDefaults.size,
    MIN_SIZE,
    MAX_SIZE,
  );
  const metrics = getKeystrokeMetrics(reference * unit, unit);
  const time = getKeystrokeTime(frame, options);
  const x = finite(options.x, keystrokeDefaults.x);
  const y = finite(options.y, keystrokeDefaults.y);
  const theme = themeOf(options.theme);
  const palette = keystrokePalettes[theme];
  const accent = accentOf(options.accent);
  const groups = timeline.groups
    .filter((group) => time > group.enter && time < group.end)
    .map((group) => groupState(group, time, metrics, palette, accent));
  return {
    width,
    height,
    unit,
    time: round(time),
    x,
    y,
    originX: round(x * width),
    originY: round(y * height),
    theme,
    palette,
    accent,
    metrics,
    groups,
  };
}

export type KeystrokeState = ReturnType<typeof getKeystrokeState>;

function Legend({
  legend,
  metrics,
}: {
  legend: KeystrokeLegend;
  metrics: KeystrokeMetrics;
}) {
  if (legend.kind === "icon") {
    const icon = ICONS[legend.icon];
    return (
      <svg
        width={metrics.icon}
        height={metrics.icon}
        viewBox={icon.box}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {icon.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  const fontSize = legend.kind === "word" ? metrics.wordFont : metrics.charFont;
  return (
    <span
      style={{ fontSize, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap" }}
    >
      {legend.text}
    </span>
  );
}

export function Keystroke({
  steps = keystrokeDefaultSteps,
  platform = keystrokeDefaults.platform,
  theme = keystrokeDefaults.theme,
  accent = keystrokeDefaults.accent,
  x = keystrokeDefaults.x,
  y = keystrokeDefaults.y,
  size = keystrokeDefaults.size,
  linger = keystrokeDefaults.linger,
  speed = keystrokeDefaults.speed,
  className,
}: KeystrokeProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const timeline = useMemo(
    () => getKeystrokeTimeline({ steps, platform, linger, fps }),
    [steps, platform, linger, fps],
  );
  const state = getKeystrokeState(
    frame,
    { width, height, fps, theme, accent, x, y, size, speed },
    timeline,
  );
  const { metrics, palette } = state;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        fontFamily: FONT_FAMILY,
      }}
    >
      {state.groups.map((group) => (
        <div
          key={group.id}
          style={{
            position: "absolute",
            left: `${state.x * 100}%`,
            top: `${state.y * 100}%`,
            width: 0,
            height: 0,
            opacity: group.opacity,
            transform: `translateY(${group.y}px) scale(${group.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {group.separators.map((separator) => (
            <div
              key={separator.id}
              style={{
                position: "absolute",
                left: separator.x,
                top: separator.y - metrics.height / 2,
                width: separator.width,
                height: metrics.keytop,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: separator.opacity,
                color: palette.separator,
                fontSize: metrics.separatorFont,
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              then
            </div>
          ))}
          {group.caps.map((cap) => (
            <div
              key={cap.id}
              style={{
                position: "absolute",
                left: cap.x,
                top: cap.y - metrics.height / 2,
                width: cap.width,
                height: metrics.height,
                opacity: cap.opacity,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: metrics.travel,
                  bottom: 0,
                  borderRadius: metrics.radius,
                  background: palette.wall,
                  boxShadow: `0 ${cap.shadowY}px ${cap.shadowBlur}px ${palette.shadow}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: metrics.keytop,
                  boxSizing: "border-box",
                  borderRadius: metrics.radius,
                  border: `${metrics.border}px solid ${palette.edge}`,
                  background: palette.cap,
                  color: cap.color,
                  transform: `translateY(${cap.lift}px)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Legend legend={cap.key.legend} metrics={metrics} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
