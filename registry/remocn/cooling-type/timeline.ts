import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line typing itself letter by letter, each letter landing hot and
// cooling to the ink, the accent word typed after a breath; then the caret
// cooling and its trail fading; under it all a slow camera push over the
// clip. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type CoolingTypeElementId = "push" | `char:${number}` | "caret";

export interface CoolingTypeTimingProps {
  text?: string;
  accentWord?: string;
  startAt?: number;
  charFrames?: number;
  coolFrames?: number;
  seed?: number;
}

export const DEFAULT_TEXT = "What if your launch video could write itself?";
export const DEFAULT_ACCENT_WORD = "itself?";

export const BEAT = {
  start: -3,
  breath: 8,
  accentRate: 1.25,
};
/** A letter fades in over `FADE`, drops into place over `LAND`. */
const FADE = 1.5;
const LAND = 4;
/** The caret slides to a new letter over `SLIDE`. */
const SLIDE = 2;
/** The accent word cools this much slower. */
const SERIF_COOL = 1.8;
/** After the last letter the caret keeps typing for `TRAIL`, its trail fading by `TRAIL_END`. */
const TRAIL = 2;
const TRAIL_END = 10;
/** The caret blinks every `BLINK` frames once typing ends. */
const BLINK = 15;

// Remotion's `random()` for a string seed, so the jitter in the typing
// rhythm stays exactly as it was.
function mulberry32(a: number) {
  let t = a + 1831565813;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seeded(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return mulberry32(hash);
}

export function wordsOf(text: string) {
  return text.split(" ").filter((w) => w.length > 0);
}

/** Index of the accent word, set in the serif; -1 when none. */
export function accentIndex(words: string[], accentWord: string) {
  return accentWord ? words.lastIndexOf(accentWord) : -1;
}

// `push` is the camera's slow push over the whole clip. `char:<i>` is letter
// `i` (spaces not counted): it appears at its start and cools over its
// length; its `fade`, `land` and `slide` beats time its arrival. The letters
// form a chain, each following the one before. `caret` starts at the last
// letter: typing continues to its `trail` beat, the trail fades by
// `trailEnd`, the caret cools over its length and blinks every `blink`.
// `length` here is the clip without `speed`, as the push counts it.
export const coolingTypeTimeline = defineTimeline<
  CoolingTypeElementId,
  CoolingTypeTimingProps
>(
  (
    {
      text = DEFAULT_TEXT,
      accentWord = DEFAULT_ACCENT_WORD,
      startAt = BEAT.start,
      charFrames = 1.6,
      coolFrames = 20,
      seed = 5,
    },
    { length },
  ) => {
    const words = wordsOf(text);
    const accIdx = accentIndex(words, accentWord);
    const letters: { ch: string; t: number; serif: boolean }[] = [];
    let t = startAt;
    let total = 0;
    total += words.reduce((a, w) => a + w.length + 1, 0);
    let n = 0;
    words.forEach((word, wi) => {
      const sf = wi === accIdx;
      if (sf) t += BEAT.breath;
      Array.from(word).forEach((ch) => {
        letters.push({ ch, t, serif: sf });
        const accel = 1.2 - 0.45 * (n / Math.max(1, total));
        const jitter = (seeded(`ct-${seed}-${n}`) - 0.5) * 0.9;
        let step = sf ? BEAT.accentRate : charFrames * accel + jitter;
        if (/[,.;:!?]/.test(ch)) step += 4;
        t += Math.max(0.6, step);
        n++;
      });
      t += sf ? 0 : charFrames * 0.9;
      n++;
    });
    const typedEnd =
      letters.length > 0 ? letters[letters.length - 1].t : startAt;

    const elements: TimelineElement<CoolingTypeElementId>[] = [
      { id: "push", lane: "Camera", label: "push", start: 0, length },
      ...letters.map(
        (l, i): TimelineElement<CoolingTypeElementId> => ({
          id: `char:${i}`,
          lane: "Text",
          label: l.ch,
          start: l.t,
          length: l.serif ? coolFrames * SERIF_COOL : coolFrames,
          follows: i > 0 ? `char:${i - 1}` : undefined,
          beats: { fade: FADE, land: LAND, slide: SLIDE },
        }),
      ),
      {
        id: "caret",
        lane: "Caret",
        label: "caret",
        start: typedEnd,
        length: coolFrames,
        follows: letters.length > 0 ? `char:${letters.length - 1}` : undefined,
        beats: { trail: TRAIL, trailEnd: TRAIL_END, blink: BLINK },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
