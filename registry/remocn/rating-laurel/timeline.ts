import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The page rising in, the laurels growing around the rating, the rating
// rolling up digit by digit, the phone's headline, the title and subtitle,
// the camera pulling back to the whole page, the category chips, the review
// cards, the install bar and the card strip gliding. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type RatingLaurelElementId =
  | "page"
  | "laurel"
  | "number"
  | "headline"
  | "title"
  | "subtitle"
  | "camera"
  | "categories"
  | "cards"
  | "cta"
  | "glide";

export interface RatingLaurelTimingProps {
  rating?: number;
}

const BEAT = {
  laurel: 4,
  number: 10,
  headline: 18,
  title: 36,
  sub: 42,
  camFrom: 60,
  camTo: 108,
  categories: 72,
  cards: 84,
  glideFrom: 108,
  glideTo: 250,
  cta: 96,
};
/** A copy line fades up over `FADE`. */
const FADE = 14;

/** Frames the rating takes to roll into place, digit by digit. */
function rollLength(text: string) {
  let end = 0;
  let di = -1;
  for (const ch of text) {
    if (!/\d/.test(ch)) continue;
    di += 1;
    const steps = 3 + di * 2;
    let t = di * 4;
    for (let j = 1; j <= steps; j++) {
      const gap = 1 + j * 1.1;
      const t0 = Math.round(t);
      end = Math.max(end, t0 + Math.min(4, Math.round(gap) + 1));
      t += gap;
    }
  }
  return end;
}

// `laurel` draws the stems over its length, the leaves popping from `leaves`
// one `leafGap` apart. `number` rolls the rating. `headline` brings in the
// phone page's two lines, the second `second` later. `camera` pulls back
// from the hero to the page, the header fading from `fadeAt`, then pushes in
// slowly for `push`. `categories` fades its row in from `fadeAt` and pops
// its chips `gap` apart; `cards` pops the review cards `gap` apart. `cta`
// slides the install bar up, the review link fading up from `linkAt`.
export const ratingLaurelTimeline = defineTimeline<
  RatingLaurelElementId,
  RatingLaurelTimingProps
>(({ rating = 4.96 }): TimelineElement<RatingLaurelElementId>[] => [
  { id: "page", lane: "Page", label: "page", start: 0, length: BEAT.laurel },
  {
    id: "laurel",
    lane: "Hero",
    label: "laurels",
    start: BEAT.laurel,
    length: 22,
    beats: { leaves: 3, leafGap: 2.4 },
  },
  {
    id: "number",
    lane: "Hero",
    label: "rating",
    start: BEAT.number,
    length: rollLength(rating.toFixed(2)),
  },
  {
    id: "headline",
    lane: "Hero",
    label: "phone headline",
    start: BEAT.headline,
    length: 16,
    beats: { second: 4 },
  },
  {
    id: "title",
    lane: "Hero",
    label: "title",
    start: BEAT.title,
    length: FADE,
  },
  {
    id: "subtitle",
    lane: "Hero",
    label: "subtitle",
    start: BEAT.sub,
    length: FADE,
    follows: "title",
  },
  {
    id: "camera",
    lane: "Camera",
    label: "pull back",
    start: BEAT.camFrom,
    length: BEAT.camTo - BEAT.camFrom,
    beats: { fadeAt: 10, push: 162 },
  },
  {
    id: "categories",
    lane: "Page",
    label: "categories",
    start: BEAT.categories,
    length: 12,
    beats: { fadeAt: -4, fade: FADE, gap: 3 },
  },
  {
    id: "cards",
    lane: "Page",
    label: "review cards",
    start: BEAT.cards,
    length: 12,
    follows: "categories",
    beats: { gap: 3 },
  },
  {
    id: "cta",
    lane: "Page",
    label: "install bar",
    start: BEAT.cta,
    length: 12,
    follows: "cards",
    beats: { linkAt: 6, link: FADE },
  },
  {
    id: "glide",
    lane: "Cards",
    label: "card strip glide",
    start: BEAT.glideFrom,
    length: BEAT.glideTo - BEAT.glideFrom,
  },
]);
