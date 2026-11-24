import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The fighting-game combo: each feature landing as a hit (a star flash, a
// slash and the word slamming in, the meter counting up and the rating
// swapping as it passes), then the meter gliding into the poster with its
// slashes, the number filling with the gradient and the logo rising in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type ComboCounterElementId = `hit:${number}` | "glide" | "fill" | "logo";

export interface ComboCounterTimingProps {
  hits?: string[];
}

export const DEFAULT_HITS = [
  "Captions",
  "Transitions",
  "Logo reveal",
  "Backgrounds",
  "Charts",
  "Text effects",
  "Lower thirds",
  "Mockups",
  "Countdowns",
  "Kinetic type",
  "Particles",
  "Templates",
];

const HIT_GAPS = [8, 7, 7, 6, 6, 5, 5, 4, 4, 4, 4];
const FIRST_HIT = 6;
const WORD_LIFE = 11;
const GLIDE_DELAY = 6;
const GLIDE_LEN = 14;
const FILL_DELAY = 10;
const FILL_LEN = 10;
const LOGO_DELAY = 26;

// `hit:<i>` lands feature `i`, lasting until the next hit (the last one until
// its word is gone); the hits form a chain. Inside a hit, counted from its
// start: the word slams in over `in` and fades in over `fade`, the star
// flashes over `star`, the slash draws over `streak` and fades over
// `streakOut` after it, the word floats off from `outAt` over `out`, and the
// spark is gone at `gone`. `glide`, `fill` and `logo` follow the last hit;
// the glide's poster slashes draw from `slashAt` over `slash`.
export const comboCounterTimeline = defineTimeline<
  ComboCounterElementId,
  ComboCounterTimingProps
>(({ hits = DEFAULT_HITS }) => {
  const elements: TimelineElement<ComboCounterElementId>[] = [];
  const times: number[] = [];
  hits.forEach((_, i) => {
    times.push(
      i === 0
        ? FIRST_HIT
        : times[i - 1] + (HIT_GAPS[i - 1] ?? HIT_GAPS[HIT_GAPS.length - 1]),
    );
  });
  hits.forEach((word, i) => {
    elements.push({
      id: `hit:${i}`,
      lane: "Hits",
      label: word,
      start: times[i],
      length: i < hits.length - 1 ? times[i + 1] - times[i] : WORD_LIFE + 4,
      follows: i > 0 ? `hit:${i - 1}` : undefined,
      beats: {
        in: 4,
        fade: 2,
        star: 7,
        streak: 3,
        streakOut: 6,
        outAt: WORD_LIFE - 3,
        out: 5,
        gone: WORD_LIFE + 4,
      },
    });
  });
  const lastAt = times[times.length - 1] ?? FIRST_HIT;
  const last: ComboCounterElementId | undefined = hits.length
    ? `hit:${hits.length - 1}`
    : undefined;
  elements.push(
    {
      id: "glide",
      lane: "Meter",
      label: "glide to poster",
      start: lastAt + GLIDE_DELAY,
      length: GLIDE_LEN,
      follows: last,
      beats: { slashAt: 6, slash: 8 },
    },
    {
      id: "fill",
      lane: "Meter",
      label: "fill",
      start: lastAt + FILL_DELAY,
      length: FILL_LEN,
      follows: last,
    },
    {
      id: "logo",
      lane: "Logo",
      label: "logo",
      start: lastAt + LOGO_DELAY,
      length: 10,
      follows: last,
    },
  );
  return elements;
});
