import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lead words rising in one after another, the trailing punctuation, the
// video chip opening inside the line, the chip growing into the hero video
// while the word swaps in, the player chrome fading in and the playhead
// running to the end of the clip. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The scene's beats are written for a 150-frame clip and
// scale with its length (`k`), counted here. The ids are public: a saved
// `timing` prop refers to them.

export type LooksLikeThisElementId =
  | `word:${number}`
  | "punct"
  | "chip"
  | "grow"
  | "chrome"
  | "play";

export interface LooksLikeThisTimingProps {
  lead?: string;
  stagger?: number;
}

export const DEFAULT_LEAD = "Your next launch looks like";

/** The lead line split into words. */
export function leadWords(lead: string) {
  return lead.split(/\s+/).filter(Boolean);
}

// `length` here is the clip length without `speed`, as the scene scales its
// beats by it. `grow` carries the chip's own spring (`chipDelay`, `chip`) and
// the moment the swapped word starts fading in (`word`, `wordEnd` past its
// end). `play` runs from the end of `grow` to the end of the clip.
export const looksLikeThisTimeline = defineTimeline<
  LooksLikeThisElementId,
  LooksLikeThisTimingProps
>(({ lead = DEFAULT_LEAD, stagger = 2.5 }, { length }) => {
  const D = length;
  const k = Math.min(1.6, Math.max(0.6, D / 150));
  const CHIP_AT = 12 * k;
  const GROW_AT = 48 * k;
  const GROW_LEN = 30 * k;
  const grown = GROW_AT + GROW_LEN;
  const elements: TimelineElement<LooksLikeThisElementId>[] = [
    ...leadWords(lead).map(
      (wd, i): TimelineElement<LooksLikeThisElementId> => ({
        id: `word:${i}`,
        lane: "Words",
        label: wd,
        start: i * stagger * k,
        length: 12 * k,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    ),
    {
      id: "punct",
      lane: "Words",
      label: "punctuation",
      start: 10 * k,
      length: 8 * k,
    },
    {
      id: "chip",
      lane: "Video",
      label: "chip opens",
      start: CHIP_AT,
      length: GROW_AT - CHIP_AT,
    },
    {
      id: "grow",
      lane: "Video",
      label: "grow to hero",
      start: GROW_AT,
      length: GROW_LEN,
      follows: "chip",
      beats: {
        chipDelay: 4 * k,
        chip: GROW_LEN + 2 * k,
        word: GROW_LEN * 0.4,
        wordEnd: 4 * k,
      },
    },
    {
      id: "chrome",
      lane: "Player",
      label: "player chrome",
      start: grown,
      length: 12 * k,
      follows: "grow",
    },
    {
      id: "play",
      lane: "Playhead",
      label: "playhead runs",
      start: grown,
      length: D - grown,
      follows: "grow",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
