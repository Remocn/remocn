import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The shelf rule draws in; each title rises in as a hero, holds, then turns
// onto its spine before the next one rises. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SpineTurnElementId = "rule" | `title:${number}` | `turn:${number}`;

export interface SpineTurnTimingProps {
  titles?: string[];
  hold?: number;
  turn?: number;
}

export const DEFAULT_TITLES = ["Kickoff", "Deep dive", "Wrap-up"];
const HOLD = 26;
const ENTER = 16;
const TURN = 26;
const NEXT_LAG = 14;
/** The rule draws a little longer than a title rises. */
const RULE = ENTER + 6;

/** The titles drawn: blanks dropped, and one placeholder if none is left. */
export function titlesOf(titles: string[]) {
  const l = titles.filter((s) => s.trim().length > 0);
  return l.length > 0 ? l : ["remocn"];
}

// `title:<k>` is title k rising in; `turn:<k>` is it turning onto its spine
// (the last title stays a hero). Each follows the one before it.
export const spineTurnTimeline = defineTimeline<
  SpineTurnElementId,
  SpineTurnTimingProps
>(({ titles = DEFAULT_TITLES, hold = HOLD, turn: turnLen = TURN }) => {
  const list = titlesOf(titles);
  const n = list.length;
  const turnAt = (k: number) => ENTER + hold + k * (turnLen + NEXT_LAG + hold);
  const elements: TimelineElement<SpineTurnElementId>[] = [
    { id: "rule", lane: "Rule", label: "rule", start: 0, length: RULE },
  ];
  list.forEach((title, k) => {
    elements.push({
      id: `title:${k}`,
      lane: "Titles",
      label: title,
      start: k === 0 ? 0 : turnAt(k - 1) + NEXT_LAG,
      length: ENTER,
      follows: k > 0 ? `turn:${k - 1}` : undefined,
    });
    if (k < n - 1) {
      elements.push({
        id: `turn:${k}`,
        lane: "Turns",
        label: title,
        start: turnAt(k),
        length: turnLen,
        follows: `title:${k}`,
      });
    }
  });
  return elements;
});
