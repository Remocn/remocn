import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The kill feed: a line per kill, the gaps tightening, then the band slamming
// across and the caption rising under it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type KillFeedElementId = `kill:${number}` | "band" | "caption";

export interface KillFeedTimingProps {
  kills?: string[];
}

export const DEFAULT_KILLS = [
  "Manual keyframes",
  "Render queue",
  "Agency invoice",
  "Stock templates",
  "Export presets",
];
/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 3;
const FIRST_KILL = 2;
const KILL_GAPS = [14, 12, 10, 8];
/** The band slams in `BANNER_DELAY` after the last kill, over `BAND_IN`. */
const BANNER_DELAY = 4;
const BAND_IN = 7;
/** Its text follows a frame behind and settles over `TEXT`. */
const TEXT_AT = 1;
const TEXT = 14;
/** The caption rises `CAPTION_AT` after the band lands, over `CAPTION`. */
const CAPTION_AT = 4;
const CAPTION = 11;

// A kill runs until the next one; the callout under it rolls with it.
export const killFeedTimeline = defineTimeline<
  KillFeedElementId,
  KillFeedTimingProps
>(({ kills = DEFAULT_KILLS }) => {
  const killAt: number[] = [];
  kills.forEach((_, i) => {
    killAt.push(
      i === 0
        ? FIRST_KILL
        : killAt[i - 1] + (KILL_GAPS[i - 1] ?? KILL_GAPS[KILL_GAPS.length - 1]),
    );
  });
  const lastKill = killAt[killAt.length - 1] ?? FIRST_KILL;
  const bandAt = lastKill + BANNER_DELAY;
  const landAt = bandAt + BAND_IN;
  const elements: TimelineElement<KillFeedElementId>[] = kills.map(
    (victim, i) => ({
      id: `kill:${i}`,
      lane: "Feed",
      label: victim,
      start: killAt[i] - PREROLL,
      length: (killAt[i + 1] ?? bandAt) - killAt[i],
      follows: i > 0 ? `kill:${i - 1}` : undefined,
    }),
  );
  elements.push(
    {
      id: "band",
      lane: "Band",
      label: "band",
      start: bandAt - PREROLL,
      length: BAND_IN,
      follows: kills.length > 0 ? `kill:${kills.length - 1}` : undefined,
      beats: { textAt: TEXT_AT, text: TEXT },
    },
    {
      id: "caption",
      lane: "Caption",
      label: "caption",
      start: landAt + CAPTION_AT - PREROLL,
      length: CAPTION,
      follows: "band",
    },
  );
  return elements;
});
