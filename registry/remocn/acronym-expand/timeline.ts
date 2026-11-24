import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The acronym's letters rising in, each letter travelling to its place in the
// full name while its word opens around it, the words no letter stands for
// rising in, then the eyebrow and the subhead. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type AcronymExpandElementId =
  | `letter:${number}`
  | `travel:${number}`
  | `fade:${number}`
  | "words"
  | "eyebrow"
  | "subhead";

export interface AcronymExpandTimingProps {
  short?: string;
  full?: string;
  /** Frame the acronym starts expanding into the full name. */
  expandAt?: number;
  /** Frames each letter takes to travel to its place in the full name. */
  expandLength?: number;
}

export const DEFAULT_SHORT = "MCP";
export const DEFAULT_FULL = "Model Context Protocol";
const EXPAND_AT = 38;
const EXPAND_LENGTH = 26;

/**
 * For each character of `short`, the index in `full` of the letter it
 * stands for: a word's first letter when one matches, -1 for none.
 */
export function matchInitials(short: string, full: string) {
  const lower = full.toLowerCase();
  const starts = new Set<number>();
  for (let i = 0; i < full.length; i++) {
    if (full[i] !== " " && (i === 0 || full[i - 1] === " ")) starts.add(i);
  }
  const out: number[] = [];
  let from = 0;
  for (const ch of short.toLowerCase()) {
    if (ch === " ") {
      out.push(-1);
      continue;
    }
    let hit = -1;
    for (let i = from; i < lower.length; i++) {
      if (lower[i] === ch && starts.has(i)) {
        hit = i;
        break;
      }
    }
    if (hit < 0) hit = lower.indexOf(ch, from);
    out.push(hit);
    if (hit >= 0) from = hit + 1;
  }
  return out;
}

// `letter:<i>` is character `i` of the acronym rising in; the letters form a
// chain. `travel:<i>` is a letter travelling (and resizing) to its place in
// the full name, the rest of its word opening `tail` frames in, over `open`;
// the travels chain. `fade:<i>` is a letter the full name has no place for,
// fading out. `words` is the words no letter stands for rising in.
export const acronymExpandTimeline = defineTimeline<
  AcronymExpandElementId,
  AcronymExpandTimingProps
>(
  ({
    short = DEFAULT_SHORT,
    full = DEFAULT_FULL,
    expandAt = EXPAND_AT,
    expandLength = EXPAND_LENGTH,
  }) => {
    const EXPAND = expandAt;
    const joined = full.split(/\s+/).filter(Boolean).join(" ");
    const anchors = matchInitials(short, joined);
    const out: TimelineElement<AcronymExpandElementId>[] = [];
    let prevLetter: AcronymExpandElementId | undefined;
    let prevTravel: AcronymExpandElementId | undefined;
    Array.from(short).forEach((ch, si) => {
      if (ch === " ") return;
      const letter: AcronymExpandElementId = `letter:${si}`;
      out.push({
        id: letter,
        lane: "Acronym",
        label: ch,
        start: si * 3,
        length: 18,
        follows: prevLetter,
      });
      prevLetter = letter;
    });
    Array.from(short).forEach((ch, si) => {
      if (ch === " ") return;
      if (anchors[si] < 0) {
        out.push({
          id: `fade:${si}`,
          lane: "Travel",
          label: ch,
          start: EXPAND,
          length: 12,
        });
        return;
      }
      const travel: AcronymExpandElementId = `travel:${si}`;
      out.push({
        id: travel,
        lane: "Travel",
        label: ch,
        start: EXPAND + si * 2,
        length: expandLength,
        follows: prevTravel,
        beats: { tail: 8, open: 22 },
      });
      prevTravel = travel;
    });
    out.push(
      {
        id: "words",
        lane: "Copy",
        label: "words",
        start: EXPAND + 18,
        length: 16,
      },
      {
        id: "eyebrow",
        lane: "Copy",
        label: "eyebrow",
        start: EXPAND + 22,
        length: 18,
      },
      {
        id: "subhead",
        lane: "Copy",
        label: "subhead",
        start: EXPAND + 28,
        length: 20,
      },
    );
    return out.sort((a, b) => a.start - b.start);
  },
);
