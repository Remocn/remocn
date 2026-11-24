import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The arcade high-score table: the title and rows sliding in, the player band
// wiping in under them, the score racing up past each row, the landing at #1,
// the initials typed in, then the flash and the logo. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type HighScoreElementId =
  | "title"
  | `row:${number}`
  | "band"
  | "race"
  | `pass:${number}`
  | "land"
  | `letter:${number}`
  | "flash"
  | "logo";

export interface HighScoreTimingProps {
  rows?: readonly { name: string }[];
  player?: string;
  stagger?: number;
}

export const HIGH_SCORE_ROWS = [
  { name: "ACE", score: 870450 },
  { name: "JFK", score: 812300 },
  { name: "MAX", score: 640120 },
  { name: "ZOE", score: 455900 },
  { name: "BOB", score: 310050 },
];
const ROW_STAGGER = 3;
const ROW_IN = 6;
const BAND_IN = 22;
const RACE_AT = 28;
const PASS = [44, 53, 61, 68, 74];
const MOVE = 6;
const LAND = 86;
const LETTERS_AT = 89;
const LETTER_GAP = 4;
const FLASH_AT = 102;
const LOGO_AT = 118;

// `title` rises in, the column labels from `columnsAt` over `columns`.
// `row:<i>` slides row i (0 = best) in; the rows form a chain. `band` wipes
// the player band in, its content fading in from `contentAt` over `content`.
// `race` starts the count; `pass:<k>` is the k-th overtake (the bottom row is
// passed first): the band climbs a slot over `move`, the passed row is kicked
// over `kick`, and the row shoved off the table drops from `dropAt` over
// `drop`. The race and the overtakes run until the next, the last one until
// `land`, where the frame shakes over `shake`, the band flashes over `impact`
// and bleeds out from `bleedAt` over `bleed`. `letter:<k>` types initial k
// (the cursor shows from `cursorAt` before the first); `flash` slams the
// flash in, fading over `fade`: the title leaves from `titleOutAt` over
// `titleOut`, the rows dim from `dimAt` over `dim`, the flash blinks off at
// `blinkAt` and `blink2At` for `blink`, and the frame pushes in over `push`.
export const highScoreTimeline = defineTimeline<
  HighScoreElementId,
  HighScoreTimingProps
>(({ rows = HIGH_SCORE_ROWS, player = "RMC", stagger = ROW_STAGGER }) => {
  const table = rows.slice(0, 5);
  const n = table.length;
  const passes = PASS.slice(PASS.length - n);
  const elements: TimelineElement<HighScoreElementId>[] = [
    {
      id: "title",
      lane: "Title",
      label: "title",
      start: 0,
      length: 10,
      beats: { columnsAt: 4, columns: 8 },
    },
  ];
  table.forEach((r, i) => {
    elements.push({
      id: `row:${i}`,
      lane: "Rows",
      label: r.name,
      start: ROW_IN + i * stagger,
      length: 8,
      follows: i > 0 ? `row:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "band",
      lane: "Player",
      label: "player band",
      start: BAND_IN,
      length: 7,
      beats: { contentAt: 3, content: 3 },
    },
    {
      id: "race",
      lane: "Race",
      label: "race",
      start: RACE_AT,
      length: (passes[0] ?? LAND) - RACE_AT,
      follows: "band",
    },
  );
  passes.forEach((at, k) => {
    elements.push({
      id: `pass:${k}`,
      lane: "Race",
      label: `passes ${table[n - 1 - k].name}`,
      start: at,
      length: (passes[k + 1] ?? LAND) - at,
      follows: k > 0 ? `pass:${k - 1}` : "race",
      beats: { move: MOVE, kick: 8, dropAt: MOVE, drop: 8 },
    });
  });
  elements.push({
    id: "land",
    lane: "Race",
    label: "land at #1",
    start: LAND,
    length: 11,
    follows: n > 0 ? `pass:${n - 1}` : "race",
    beats: { shake: 8, impact: 7, bleedAt: 1, bleed: 10 },
  });
  player.split("").forEach((ch, k) => {
    elements.push({
      id: `letter:${k}`,
      lane: "Initials",
      label: ch,
      start: LETTERS_AT + k * LETTER_GAP,
      length: 3,
      follows: k > 0 ? `letter:${k - 1}` : "land",
      beats: k === 0 ? { cursorAt: -6 } : undefined,
    });
  });
  elements.push(
    {
      id: "flash",
      lane: "Title",
      label: "flash",
      start: FLASH_AT,
      length: 6,
      follows: player.length > 0 ? `letter:${player.length - 1}` : "land",
      beats: {
        fade: 2,
        titleOutAt: -3,
        titleOut: 3,
        dimAt: 2,
        dim: 12,
        blinkAt: 9,
        blink2At: 15,
        blink: 3,
        push: 60,
      },
    },
    {
      id: "logo",
      lane: "Logo",
      label: "logo",
      start: LOGO_AT,
      length: 10,
      follows: "flash",
    },
  );
  return elements;
});
