import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first quote rising in word by word with the name under it, then each
// rewrite into the next quote: kept words glide to their new places, the
// dropped ones sink away, the new ones rise in, and the "when" line under
// the name changes. The rewrites are spread over the clip. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type ChangedMindElementId = `quote:${number}` | "name";

export interface ChangedMindTimingProps {
  steps?: { quote: string }[];
  transition?: number;
}

export const DEFAULT_STEPS = [
  { quote: "Another tool I won’t use.", when: "on day one" },
  { quote: "Another tool I might use.", when: "in week two" },
  { quote: "The only tool I use now.", when: "two months in" },
];
const TRANSITION = 18;

const ENTER_AT = 2;
const ENTER_STEP = 2;
const ENTER_RISE = 16;
const NAME_AT = 12;
const NAME_IN = 18;
const INTRO = 18;
const SETTLE = 14;

const wordCount = (quote: string) =>
  quote
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "")
    .split(/\s+/)
    .filter(Boolean).length;

// `quote:0` raises the opening mark and the first quote's words, `stagger`
// apart, each over `rise`; `name` raises the name under it. `quote:<k>`
// rewrites quote k - 1 into quote k: kept words glide from `glideFrom` to
// `glideTo` (changed spellings swap from `swapFrom` to `swapTo`), dropped
// words sink `outStep` apart over `out`, new words rise from `inAt`,
// `inStep` apart, over `in`, and the "when" line changes from `whenFrom` to
// `whenTo`; the rewrite holds the stage until its end. The rewrites are
// spread across the clip and form a chain.
export const changedMindTimeline = defineTimeline<
  ChangedMindElementId,
  ChangedMindTimingProps
>(({ steps = DEFAULT_STEPS, transition = TRANSITION }, { length }) => {
  const list = steps.length > 0 ? steps : DEFAULT_STEPS;
  const n = list.length;
  const T = length;
  const intro = INTRO;
  const tail = Math.max(30, T * 0.22);
  const span = Math.max(1, T - tail - intro);
  const gap = n > 1 ? span / (n - 1) : span;
  const TR = Math.min(transition, gap * 0.45);
  const startOf = (k: number) => intro + gap * k - TR;

  const elements: TimelineElement<ChangedMindElementId>[] = [
    {
      id: "quote:0",
      lane: "Quote",
      label: list[0].quote,
      start: ENTER_AT,
      length: wordCount(list[0].quote) * ENTER_STEP + ENTER_RISE,
      beats: { stagger: ENTER_STEP, rise: ENTER_RISE },
    },
    {
      id: "name",
      lane: "Name",
      label: "name",
      start: NAME_AT,
      length: NAME_IN,
    },
  ];
  for (let k = 1; k < n; k++) {
    elements.push({
      id: `quote:${k}`,
      lane: "Quote",
      label: list[k].quote,
      start: startOf(k),
      length: TR + SETTLE,
      follows: `quote:${k - 1}`,
      beats: {
        glideFrom: TR * 0.18,
        glideTo: TR * 0.82,
        swapFrom: TR * 0.1,
        swapTo: TR * 0.4,
        outStep: 1,
        out: TR * 0.34,
        inAt: TR * 0.5,
        inStep: 1.5,
        in: TR * 0.5,
        whenFrom: TR * 0.3,
        whenTo: TR * 0.85,
      },
    });
  }
  return elements.sort((a, b) => a.start - b.start);
});
