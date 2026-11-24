import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each headline word rising in, each row of the invite (its label, then its
// words), and the focus that dims the other rows onto the RSVP. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The rows spread over the
// first half of the clip, so their pace follows the clip length. The ids are
// public: a saved `timing` prop refers to them.

export type RsvpElementId = `word:${number}` | `row:${number}` | "focus";

/** One row of the invite (`RsvpField`). */
export interface InviteField {
  label: string;
  value: string;
}

export interface RsvpTimingProps {
  headline?: string;
  fields?: InviteField[];
  rsvpLabel?: string;
  rsvp?: string;
  stagger?: number;
}

export const DEFAULT_HEADLINE = "You’re invited.";
export const DEFAULT_RSVP_LABEL = "RSVP";
export const DEFAULT_RSVP = "npx shadcn add @remocn/whip-pan";

export const DEFAULT_FIELDS: InviteField[] = [
  { label: "What", value: "Your launch film" },
  { label: "When", value: "Whenever you’re ready" },
  { label: "Where", value: "Your own repo" },
  { label: "Bring", value: "The story. We brought the parts." },
];

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

/** The rows shown: the filled fields, then the RSVP row when there is one. */
export function rowsOf(fields: InviteField[], rsvpLabel: string, rsvp: string) {
  return [
    ...fields.filter((f) => f.label || f.value),
    ...(rsvp ? [{ label: rsvpLabel, value: rsvp }] : []),
  ];
}

const WORD_AT = 3;
const WORD_LEN = 20;
const ROW_START = 26;
const LABEL = 14;
const ROW_WORDS = 5;
const ROW_WORD_STEP = 2;
const ROW_WORD = 16;

// `word:<i>` is headline word `i`; they form a chain. `row:<k>` is row `k`:
// its label rises over `label`, its words from `words` on, one every
// `wordStep`, each over `word`. The rows form a chain; the RSVP row comes 10
// frames late. `focus` dims the other rows and follows the RSVP row.
export const rsvpTimeline = defineTimeline<RsvpElementId, RsvpTimingProps>(
  (
    {
      headline = DEFAULT_HEADLINE,
      fields = DEFAULT_FIELDS,
      rsvpLabel = DEFAULT_RSVP_LABEL,
      rsvp = DEFAULT_RSVP,
      stagger = 4,
    },
    { length },
  ) => {
    const headWords = splitWords(headline);
    const rows = rowsOf(fields, rsvpLabel, rsvp);
    const n = rows.length;
    const span = Math.max(
      n * 10,
      Math.min(length * 0.5, length - 70) - ROW_START,
    );
    const rowStep = Math.min(16, span / Math.max(1, n));
    const rowAt = (k: number) =>
      ROW_START + k * rowStep + (rsvp && k === n - 1 ? 10 : 0);
    const lastAt = rowAt(n - 1);
    const elements: TimelineElement<RsvpElementId>[] = [
      ...headWords.map(
        (word, i): TimelineElement<RsvpElementId> => ({
          id: `word:${i}`,
          lane: "Headline",
          label: word,
          start: WORD_AT + i * stagger,
          length: WORD_LEN,
          follows: i > 0 ? `word:${i - 1}` : undefined,
        }),
      ),
      ...rows.map((row, k): TimelineElement<RsvpElementId> => {
        const m = splitWords(row.value).length;
        return {
          id: `row:${k}`,
          lane: "Rows",
          label: row.label || row.value,
          start: rowAt(k),
          length: Math.max(
            LABEL,
            m > 0 ? ROW_WORDS + (m - 1) * ROW_WORD_STEP + ROW_WORD : 0,
          ),
          follows: k > 0 ? `row:${k - 1}` : undefined,
          beats: {
            label: LABEL,
            words: ROW_WORDS,
            wordStep: ROW_WORD_STEP,
            word: ROW_WORD,
          },
        };
      }),
    ];
    if (rsvp && n > 0) {
      elements.push({
        id: "focus",
        lane: "Focus",
        label: "Focus on RSVP",
        start: lastAt + 12,
        length: 18,
        follows: `row:${n - 1}`,
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
