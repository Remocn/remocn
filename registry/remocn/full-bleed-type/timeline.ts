import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One word per beat slamming in from alternating sides and settling, the
// stack locking as the open leading closes, and the sunrise climbing under
// the hero word from its slam to past the lock. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FullBleedTypeElementId = `word:${number}` | "climb" | "lock";

export interface FullBleedTypeTimingProps {
  words?: string[];
  /** Frames between two slams. */
  beat?: number;
  /** Frames a word takes to slam in, before it settles. */
  slam?: number;
}

export const DEFAULT_WORDS = ["NO", "DAYS", "OFF", "SHIP"];
const BEAT = 11;
const FIRST_AT = -2;
const SLAM_LEN = 8;
const SETTLE_LEN = 6;
const LOCK_LEN = 12;
/** Frames the sunrise keeps climbing after the lock. */
const CLIMB_TAIL = 30;

/** The words as they are set: trimmed, in caps, empty ones dropped. */
export const wordList = (words: string[]) =>
  words.map((w) => w.trim().toUpperCase()).filter(Boolean);

// Word `i` slams in over its length and settles over its `settle` beat; each
// follows the one before. The lock follows the last word; the climb starts
// with the last word and runs to 30 frames past the lock.
export const fullBleedTypeTimeline = defineTimeline<
  FullBleedTypeElementId,
  FullBleedTypeTimingProps
>(({ words = DEFAULT_WORDS, beat = BEAT, slam: slamLen = SLAM_LEN }) => {
  const list = wordList(words);
  const lastAt = FIRST_AT + (list.length - 1) * beat;
  const lockAt = lastAt + slamLen + SETTLE_LEN;
  const last = list.length - 1;
  const elements: TimelineElement<FullBleedTypeElementId>[] = list.map(
    (word, id) => ({
      id: `word:${id}`,
      lane: "Words",
      label: word,
      start: FIRST_AT + id * beat,
      length: slamLen,
      follows: id > 0 ? `word:${id - 1}` : undefined,
      beats: { settle: SETTLE_LEN },
    }),
  );
  elements.push(
    {
      id: "climb",
      lane: "Sunrise",
      label: "sunrise",
      start: lastAt,
      length: lockAt + LOCK_LEN + CLIMB_TAIL - lastAt,
      follows: last > 0 ? `word:${last - 1}` : undefined,
    },
    {
      id: "lock",
      lane: "Lock",
      label: "lock",
      start: lockAt,
      length: LOCK_LEN,
      follows: last >= 0 ? `word:${last}` : undefined,
    },
  );
  return elements;
});
