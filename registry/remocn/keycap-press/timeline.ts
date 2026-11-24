import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The keys rise in while the camera settles and the underglow warms up; the
// keys are pressed one after another, the last press is the chord that
// kicks, flashes and lifts the camera, the label writes in word by word and
// the keys come back up in reverse. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type KeycapPressElementId =
  | `key:${number}`
  | "camera"
  | "glow"
  | `press:${number}`
  | "chord"
  | "lift"
  | `word:${number}`;

export interface KeycapKey {
  label: string;
  sub?: string;
  width?: number;
}

export interface KeycapPressTimingProps {
  keys?: (string | KeycapKey)[];
  label?: string;
  stagger?: number;
}

export const DEFAULT_KEYS: KeycapKey[] = [
  { label: "⌘", sub: "command", width: 1.25 },
  { label: "K" },
];
export const DEFAULT_LABEL = "Everything, one shortcut away";
const STAGGER = 3;

/** The keys, each as a `KeycapKey`. */
export function keyDefs(keys: (string | KeycapKey)[]): KeycapKey[] {
  return keys.map((k) => (typeof k === "string" ? { label: k } : k));
}

// Each key rises in as a chain, the first before the first frame. The camera
// settles over its length and drifts its roll until `drift`. `press:<i>`
// holds key i down until its end, the release, with a ripple over `ripple`;
// presses are a chain. The chord, on the last press, kicks the keys between
// `kick` and `kickEnd`, flashes the pool to `flash` and back by `flashEnd`,
// lifts the glow to `glow` and holds it to `glowEnd`, and sends two rings out
// over `ring`, the second `echo` frames late. Words are a chain after it.
export const keycapPressTimeline = defineTimeline<
  KeycapPressElementId,
  KeycapPressTimingProps
>(({ keys = DEFAULT_KEYS, label = DEFAULT_LABEL, stagger = STAGGER }) => {
  const defs = keyDefs(keys);
  const n = defs.length;
  const pressGap = n > 2 ? 10 : 12;
  const pressAt = defs.map((_, i) => 36 + i * pressGap);
  const chord = pressAt[n - 1];
  const releaseAt = defs.map((_, i) => chord + 22 + (n - 1 - i) * 4);

  const elements: TimelineElement<KeycapPressElementId>[] = defs.map(
    (key, i) => ({
      id: `key:${i}` as const,
      lane: "Keys",
      label: key.label,
      start: -8 + i * 5,
      length: 5,
      follows: i > 0 ? (`key:${i - 1}` as const) : undefined,
    }),
  );
  elements.push(
    {
      id: "camera",
      lane: "Camera",
      label: "Camera settles",
      start: 0,
      length: 54,
      beats: { drift: 135 },
    },
    {
      id: "glow",
      lane: "Glow",
      label: "Underglow warms",
      start: 6,
      length: 34,
    },
  );
  defs.forEach((key, i) => {
    elements.push({
      id: `press:${i}`,
      lane: "Presses",
      label: `Press ${key.label}`,
      start: pressAt[i],
      length: releaseAt[i] - pressAt[i],
      follows: i > 0 ? `press:${i - 1}` : undefined,
      beats: { ripple: 34 },
    });
  });
  elements.push(
    {
      id: "chord",
      lane: "Glow",
      label: "Chord",
      start: chord,
      length: 50,
      follows: `press:${n - 1}`,
      beats: {
        kick: 3,
        kickEnd: 14,
        flash: 3,
        flashEnd: 30,
        glow: 4,
        glowEnd: 40,
        echo: 7,
        ring: 44,
      },
    },
    {
      id: "lift",
      lane: "Camera",
      label: "Camera lifts",
      start: chord + 2,
      length: 32,
      follows: "chord",
    },
  );
  label.split(" ").forEach((word, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Label",
      label: word,
      start: chord + 6 + i * stagger,
      length: 20,
      follows: i > 0 ? `word:${i - 1}` : "chord",
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
