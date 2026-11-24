import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lead rising in word by word, the brand line under it, the braces
// opening around the brand, the brand dropping out as the slot shuts, the
// slot opening on the placeholder, and the note. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. On a longer or shorter clip the braces
// and the swap come later or sooner (`pace`, 0.85–1.5). The ids are public: a
// saved `timing` prop refers to them.

export type YourNameHereElementId =
  | `word:${number}`
  | "brand"
  | "brace"
  | "swap"
  | "open"
  | "note";

export interface YourNameHereTimingProps {
  lead?: string;
  stagger?: number;
}

export const DEFAULT_LEAD = "A launch film for";
export const WORD_STAGGER = 3;

const WORDS_AT = 3;
const WORD_RISE = 18;
const BRAND_GAP = 2;
const BRAND_RISE = 20;
const BRACE_AT = 44;
const BRACE_LEN = 16;
const SWAP_GAP = 26;
const OUT_LEN = 12;
const SHUT_AT = 4;
const SWAP_LEN = 18;
const OPEN_GAP = 28;
const OPEN_LEN = 20;
const RISE_AT = 4;
const RISE_END = 22;
const NOTE_GAP = 30;
const NOTE_LEN = 18;

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

// `word:<i>` is word `i` of the lead, a chain; the brand line follows the
// last word. The braces open on a clock of their own; the swap follows them:
// the brand drops out over `out` while the slot shuts from `shut` to the
// swap's end. `open` follows the swap: the slot widens over `open` and the
// placeholder rises from `rise` to its end. The note follows the opening.
// `length` is the clip after `delay`, with `speed`.
export const yourNameHereTimeline = defineTimeline<
  YourNameHereElementId,
  YourNameHereTimingProps
>(({ lead = DEFAULT_LEAD, stagger = WORD_STAGGER }, { length }) => {
  const words = splitWords(lead);
  const n = words.length;
  const pace = Math.min(1.5, Math.max(0.85, length / 180));
  const braceAt = BRACE_AT * pace;
  const swapAt = braceAt + SWAP_GAP * pace;
  const openAt = swapAt + OPEN_GAP;
  const noteAt = openAt + NOTE_GAP;
  const elements: TimelineElement<YourNameHereElementId>[] = words.map(
    (word, i): TimelineElement<YourNameHereElementId> => ({
      id: `word:${i}`,
      lane: "Lead",
      label: word,
      start: WORDS_AT + i * stagger,
      length: WORD_RISE,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    }),
  );
  elements.push(
    {
      id: "brand",
      lane: "Slot",
      label: "brand",
      start: WORDS_AT + n * stagger + BRAND_GAP,
      length: BRAND_RISE,
      follows: n > 0 ? `word:${n - 1}` : undefined,
    },
    {
      id: "brace",
      lane: "Slot",
      label: "braces",
      start: braceAt,
      length: BRACE_LEN,
    },
    {
      id: "swap",
      lane: "Slot",
      label: "swap",
      start: swapAt,
      length: SWAP_LEN,
      follows: "brace",
      beats: { out: OUT_LEN, shut: SHUT_AT },
    },
    {
      id: "open",
      lane: "Slot",
      label: "open",
      start: openAt,
      length: RISE_END,
      follows: "swap",
      beats: { open: OPEN_LEN, rise: RISE_AT },
    },
    {
      id: "note",
      lane: "Note",
      label: "note",
      start: noteAt,
      length: NOTE_LEN,
      follows: "open",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
