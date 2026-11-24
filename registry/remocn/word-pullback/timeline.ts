import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The accent word typing in up close, the camera pulling back as the rest
// of its line rises, the next lines rising, the second pull back to the
// full frame with the ground flooding in and the logo popping up. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type WordPullbackElementId =
  | "type"
  | "pull"
  | "words"
  | "lines"
  | "pull2"
  | "flood"
  | "logo";

export interface WordPullbackTimingProps {
  accentWord?: string;
  after?: string;
  stagger?: number;
}

export const DEFAULT_ACCENT_WORD = "cinematic";
export const DEFAULT_AFTER = "toolkit for every launch";

const TYPE_FROM = -9;
const TYPE_END = 27;
const TYPE_PER_LETTER = 3;
const PULL1 = 30;
const PULL1_LEN = 18;
const DOLLY = 6;
const WORDS_LEAD = 3;
const LINE2 = 45;
const LINE_GAP = 6;
const WORD_STEP = 3;
const RISE = 12;
const PULL2 = 72;
const PULL2_LEN = 15;
const FLOOD = 72;
const FLOOD_LEN = 24;
const LOGO = 78;
/** About how long the logo's chip spring takes to settle. */
const LOGO_SETTLE = 20;

// `type` types the accent word in and ends where the caret stops. `pull`
// pulls the camera back from the word, its dolly easing out over `dolly`.
// `words` raises the words after the accent on its own line, `stagger`
// apart, each over `rise`; `lines` raises the lines below it, `lineGap`
// apart, their words `stagger` apart. Which words land on which line is
// measured, so the two only anchor them; their lengths count every word
// after the accent. `pull2` pulls back to the full frame, `flood` floods
// the ground in with it and `logo` pops the logo up.
export const wordPullbackTimeline = defineTimeline<
  WordPullbackElementId,
  WordPullbackTimingProps
>(
  ({
    accentWord = DEFAULT_ACCENT_WORD,
    after = DEFAULT_AFTER,
    stagger = WORD_STEP,
  }) => {
    const typeEnd = Math.max(
      TYPE_END - 6,
      Math.min(TYPE_END + 6, accentWord.length * TYPE_PER_LETTER),
    );
    const rest = after.split(" ").filter(Boolean).length;
    const restLength = Math.max(0, rest - 1) * stagger + RISE;
    const elements: TimelineElement<WordPullbackElementId>[] = [
      {
        id: "type",
        lane: "Accent",
        label: accentWord,
        start: TYPE_FROM,
        length: typeEnd - TYPE_FROM,
      },
      {
        id: "words",
        lane: "Line",
        label: "rest of the line",
        start: typeEnd - WORDS_LEAD,
        length: restLength,
        follows: "type",
        beats: { stagger, rise: RISE },
      },
      {
        id: "pull",
        lane: "Camera",
        label: "pull back",
        start: PULL1,
        length: PULL1_LEN,
        follows: "type",
        beats: { dolly: DOLLY },
      },
      {
        id: "lines",
        lane: "Line",
        label: "next lines",
        start: LINE2,
        length: restLength,
        follows: "words",
        beats: { lineGap: LINE_GAP, stagger, rise: RISE },
      },
      {
        id: "pull2",
        lane: "Camera",
        label: "full frame",
        start: PULL2,
        length: PULL2_LEN,
        follows: "pull",
      },
      {
        id: "flood",
        lane: "Ground",
        label: "flood",
        start: FLOOD,
        length: FLOOD_LEN,
        follows: "pull",
      },
      {
        id: "logo",
        lane: "Logo",
        label: "logo",
        start: LOGO,
        length: LOGO_SETTLE,
        follows: "pull2",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
