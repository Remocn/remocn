import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The tower wiping in with the giant numeral, seven laps with the hero
// passing a car on each, the hero taking P1, then the tower peeling off and
// the poster wiping in. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type TimingTowerElementId =
  | "tower"
  | "drift"
  | "giant"
  | `lap:${number}`
  | "p1"
  | "exit"
  | "poster";

/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 4;
/** Frames the laps tick at, on the choreography's clock. */
const LAP_AT = [14, 28, 41, 53, 64, 74, 84];
export const LAP_COUNT = LAP_AT.length;
const SWAP = 9;
const EXIT_AT = 110;

// On the choreography's clock, which runs `PREROLL` ahead of the scene.
const at = (f: number) => f - PREROLL;

// `tower` wipes the header in over `enter`, then each row from `rowsAt`,
// `rowStagger` apart. `drift` moves the aurora ground slowly over the whole
// scene. `giant` raises the numeral. `lap:<k>` ticks lap `k`, lasting until
// the next (a chain): the hero swaps up a row over `swap`, the lap counter
// flashes over `flash`, the hero flashes green from `passAt` over `pass`, and
// the numeral rolls from `rollAt` over `roll`. `p1` turns the hero purple.
// `exit` peels the rows off bottom first, `stagger` apart, each over `peel`.
// `poster` (following the exit) slides the numeral over; its blocks wipe in
// from `blocksAt` over `block`, and the interval counts up from `countAt`
// over `count`.
export const timingTowerTimeline = defineTimeline<TimingTowerElementId, object>(
  () => {
    const elements: TimelineElement<TimingTowerElementId>[] = [
      {
        id: "tower",
        lane: "Tower",
        label: "Tower in",
        start: at(0),
        length: 3 + 9 * 1.2 + 9,
        beats: { enter: 9, rowsAt: 3, rowStagger: 1.2 },
      },
      {
        id: "drift",
        lane: "Ground",
        label: "Aurora drift",
        start: at(0),
        length: 165,
      },
      { id: "giant", lane: "Numeral", label: "P8", start: at(6), length: 12 },
    ];
    LAP_AT.forEach((f, k) => {
      const next = LAP_AT[k + 1] ?? LAP_AT[LAP_AT.length - 1] + SWAP - 1;
      elements.push({
        id: `lap:${k}`,
        lane: "Laps",
        label: `P${7 - k}`,
        start: at(f),
        length: next - f,
        follows: k > 0 ? `lap:${k - 1}` : undefined,
        beats: {
          swap: SWAP,
          flash: 8,
          passAt: 3,
          pass: 12,
          rollAt: 2,
          roll: 8,
        },
      });
    });
    elements.push(
      {
        id: "p1",
        lane: "Laps",
        label: "P1",
        start: at(LAP_AT[LAP_AT.length - 1] + SWAP - 1),
        length: 6,
        follows: `lap:${LAP_AT.length - 1}`,
      },
      {
        id: "exit",
        lane: "Tower",
        label: "Tower out",
        start: at(EXIT_AT),
        length: 10 * 0.8 + 9,
        beats: { stagger: 0.8, peel: 9 },
      },
      {
        id: "poster",
        lane: "Poster",
        label: "Poster",
        start: at(EXIT_AT + 7),
        length: 18,
        follows: "exit",
        beats: { blocksAt: 8, block: 12, countAt: 12, count: 18 },
      },
    );
    return elements;
  },
);
