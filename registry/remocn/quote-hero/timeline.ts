import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Quote after quote: the big mark fades in, the lines rise one by one, the
// author settles under them, the highlighter sweeps the phrase, and the
// quote leaves before the next one. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type QuoteHeroElementId = `quote:${number}` | `exit:${number}`;

export interface QuoteSpec {
  quote: string;
  highlight?: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface QuoteHeroTimingProps {
  quotes?: QuoteSpec[];
  quoteDuration?: number;
  stagger?: number;
  sweep?: number;
}

export const DEFAULT_QUOTES: QuoteSpec[] = [
  {
    quote:
      "remocn turned our launch video from a two-week agency project into an afternoon. We shipped it the same day.",
    highlight: "into an afternoon",
    name: "Maya Chen",
    role: "Head of Design",
    company: "Kitebase",
  },
  {
    quote:
      "The components feel art-directed, not generated. Our changelog videos finally look like the product.",
    highlight: "finally look like the product",
    name: "Leo Park",
    role: "Founder",
    company: "Fernway",
  },
];

const LEAD = 6;
const QUOTE_DURATION = 120;
const STAGGER = 5;
const SWEEP = 18;
const EXIT_LEAD = 8;
const EXIT = 12;

// `quote:<i>` brings quote `i` in: the big mark from `markLead` to `markIn`
// (its sheen drifts over `drift`), line `l` rising from `l * stagger` over
// `lineIn`. How many lines there are depends on the frame's width, so the
// rest hangs off the last line: it lands `reveal` frames after it starts,
// the author settles from `authorLead` after that (`settleStep` apart, each
// over `settle`), and the highlighter sweeps from `sweepAfter`, over `sweep`
// in all, pieces `hlGap` apart and at least `minSweep` long. `exit:<i>`
// takes the quote away before the next one; the quotes and exits form a
// chain. The camera push runs until `tail` frames after the last quote.
export const quoteHeroTimeline = defineTimeline<
  QuoteHeroElementId,
  QuoteHeroTimingProps
>(
  ({
    quotes = DEFAULT_QUOTES,
    quoteDuration = QUOTE_DURATION,
    stagger = STAGGER,
    sweep = SWEEP,
  }) => {
    const n = quotes.length;
    const elements: TimelineElement<QuoteHeroElementId>[] = [];
    quotes.forEach((q, i) => {
      const start = LEAD + i * quoteDuration;
      elements.push({
        id: `quote:${i}`,
        lane: "Quotes",
        label: q.name,
        start,
        length: quoteDuration - EXIT_LEAD,
        follows: i > 0 ? `exit:${i - 1}` : undefined,
        beats: {
          markLead: -2,
          markIn: 20,
          drift: 200,
          stagger,
          lineIn: 18,
          reveal: 16,
          authorLead: -6,
          settleStep: 3,
          settle: 18,
          sweepAfter: 4,
          sweep,
          hlGap: 1,
          minSweep: 6,
          tail: EXIT_LEAD,
        },
      });
      if (i < n - 1) {
        elements.push({
          id: `exit:${i}`,
          lane: "Quotes",
          label: `${q.name} leaves`,
          start: start + quoteDuration - EXIT_LEAD,
          length: EXIT,
          follows: `quote:${i}`,
        });
      }
    });
    return elements;
  },
);
