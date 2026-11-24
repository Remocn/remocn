import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A slow push over the whole clip, the first line focusing in, each next
// line's focus front sweeping across and swapping it for the one before, and
// the logo popping in under the last line. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FocusFrontSwapElementId = "push" | `line:${number}` | "logo";

export interface FocusFrontSwapTimingProps {
  lines?: string[];
  swap?: number;
}

export const DEFAULT_LINES = [
  "Remocn knows the beat",
  "You describe it once",
  "Ship it {tonight}.",
];

const BEAT = {
  enter: 18,
  swap: 30,
  minSwap: 18,
  decay: 0.8,
  logo: -3,
};

export interface Word {
  text: string;
  mask: boolean[];
}

/** A line's words, with `{…}` marking the letters set in the accent. */
export function parse(text: string): Word[] {
  const out: Word[] = [];
  let on = false;
  for (const raw of text.split(" ").filter(Boolean)) {
    let t = "";
    const mask: boolean[] = [];
    for (const ch of Array.from(raw)) {
      if (ch === "{") on = true;
      else if (ch === "}") on = false;
      else {
        t += ch;
        mask.push(on);
      }
    }
    if (t) out.push({ text: t, mask });
  }
  return out;
}

// The push runs over the whole clip: `length` here is the clip length
// without `speed`, as the push always was. `line:<k>` is the front that
// brings line `k` in (and sweeps line `k - 1` out), a chain; each swap is
// shorter than the one before, and a line waits longer the more words the
// one before it has. The logo follows the last line, popping in just before
// its front has crossed.
export const focusFrontSwapTimeline = defineTimeline<
  FocusFrontSwapElementId,
  FocusFrontSwapTimingProps
>(({ lines = DEFAULT_LINES, swap = BEAT.swap }, { length }) => {
  const parsed = lines.map(parse);
  const starts: number[] = [];
  const lens: number[] = [];
  let t = -9;
  let len = swap;
  parsed.forEach((ws, k) => {
    if (k === 0) {
      starts.push(t);
      lens.push(BEAT.enter);
      t += BEAT.enter;
      return;
    }
    const prev = parsed[k - 1].length;
    t += Math.max(24, Math.min(48, 8 + 4 * prev));
    starts.push(t);
    lens.push(len);
    t += len;
    len = Math.max(BEAT.minSwap, Math.round(len * BEAT.decay));
    if (ws.length === 0) len = BEAT.minSwap;
  });
  const last = parsed.length - 1;
  const lastEnd = starts[last] + lens[last];
  const elements: TimelineElement<FocusFrontSwapElementId>[] = [
    ...parsed.map(
      (ws, k): TimelineElement<FocusFrontSwapElementId> => ({
        id: `line:${k}`,
        lane: "Lines",
        label: ws.map((w) => w.text).join(" "),
        start: starts[k],
        length: lens[k],
        follows: k > 0 ? `line:${k - 1}` : undefined,
      }),
    ),
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: 0,
      length,
    },
    {
      id: "logo",
      lane: "Logo",
      label: "logo",
      start: lastEnd + BEAT.logo,
      length: 20,
      follows: `line:${last}`,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
