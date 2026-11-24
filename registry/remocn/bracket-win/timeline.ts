import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The playoff bracket: it slides in and draws, the three rounds resolve one
// after another, the final node bursts into the champion plate, and the
// caption rises under it. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type BracketWinElementId =
  | "bracket"
  | `round:${number}`
  | "burst"
  | "caption";

export interface BracketWinTimingProps {
  /** Round labels over the columns: quarterfinal, semifinal, final. */
  rounds?: [string, string, string];
  /** Frames between one round resolving and the next. */
  roundLength?: number;
}

/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 1;
const ROUND_AT = [20, 40, 60] as const;
const ROUND_LENGTH = 20;
const DIM_DELAY = 4;
const LINE_LEN = 9;
const BURST_AT = 68;
const DEFAULT_ROUNDS = ["Quarterfinal", "Semifinal", "Grand final"];

// The bracket's beats are counted from its start: quarterfinal slots slide in
// one frame apart, later-round slots grow in `laterStep` apart per round, the
// base lines and labels follow. A round runs until the next one resolves:
// scores tick in, losers dim after `dim`, winners' lines draw over `line` and
// their names roll into the next slots. The burst grows the plate; title,
// logo, rings and flash are its beats.
export const bracketWinTimeline = defineTimeline<
  BracketWinElementId,
  BracketWinTimingProps
>(
  ({
    rounds = DEFAULT_ROUNDS,
    roundLength = ROUND_LENGTH,
  }): TimelineElement<BracketWinElementId>[] => {
    const extra = roundLength - 20;
    const roundAt = ROUND_AT.map((r, k) => r + k * extra);
    const burstAt = BURST_AT + 2 * extra;
    const elements: TimelineElement<BracketWinElementId>[] = [
      {
        id: "bracket",
        lane: "Bracket",
        label: "bracket",
        start: -1 - PREROLL,
        length: 17,
        beats: {
          slotIn: 9,
          laterAt: 4,
          laterStep: 2,
          laterIn: 10,
          baseAt: 5,
          base: 12,
          labelsAt: 7,
          labels: 10,
        },
      },
    ];
    roundAt.forEach((at, k) => {
      elements.push({
        id: `round:${k}`,
        lane: "Rounds",
        label: rounds[k] ?? `round ${k + 1}`,
        start: at - PREROLL,
        length: (roundAt[k + 1] ?? burstAt) - at,
        follows: k > 0 ? `round:${k - 1}` : undefined,
        beats: {
          dim: DIM_DELAY,
          dimIn: 6,
          line: LINE_LEN,
          name: 6,
          scoreStep: 1,
          score: 5,
          flash: 9,
          kick: 7,
        },
      });
    });
    elements.push(
      {
        id: "burst",
        lane: "Plate",
        label: "burst",
        start: burstAt - PREROLL,
        length: 10,
        follows: "round:2",
        beats: {
          sink: 12,
          titleAt: 2,
          title: 8,
          logoAt: 5,
          logo: 10,
          echo: 4,
          ring: 26,
          kickAt: 4,
          kick: 10,
          flashAt: 1,
          flash: 7,
          push: 20,
        },
      },
      {
        id: "caption",
        lane: "Caption",
        label: "caption",
        start: burstAt + 12 - PREROLL,
        length: 10,
        follows: "burst",
      },
    );
    return elements;
  },
);
