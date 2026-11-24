import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The name's tiles flying in and peeling off to decode its letters, the
// satellite chips around it, the URL's tiles doing the same, and the last
// URL tile stretching into an underline. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type GlyphBlockDecodeElementId = "name" | "satellites" | "url" | "rule";

const NAME_IN = -8;
const SAT_IN = -6;
const SAT_OUT = 18;
const NAME_OUT = 18;
const NAME_DONE = 60;
const URL_IN = 36;
const URL_OUT = 54;
const URL_DONE = 78;
const RULE = 84;
const RULE_LEN = 18;
/** Letters under the underline tile decode this long after it starts. */
const RULE_REVEAL = 3;

// `name` and `url` run from the first tile flying in (`start`) through the
// first tile peeling off (`out`) to the last (`done`, the length).
// `satellites` peel off from `out`. `rule` follows `url`; it exists even
// with `underline` off, when nothing reads it.
export const glyphBlockDecodeTimeline = defineTimeline<
  GlyphBlockDecodeElementId,
  object
>((): TimelineElement<GlyphBlockDecodeElementId>[] => [
  {
    id: "name",
    lane: "Name",
    label: "Name decodes",
    start: NAME_IN,
    length: NAME_DONE - NAME_IN,
    beats: { out: NAME_OUT - NAME_IN, done: NAME_DONE - NAME_IN },
  },
  {
    id: "satellites",
    lane: "Satellites",
    label: "Satellite chips",
    start: SAT_IN,
    length: SAT_OUT - SAT_IN,
    beats: { out: SAT_OUT - SAT_IN },
  },
  {
    id: "url",
    lane: "URL",
    label: "URL decodes",
    start: URL_IN,
    length: URL_DONE - URL_IN,
    beats: { out: URL_OUT - URL_IN, done: URL_DONE - URL_IN },
  },
  {
    id: "rule",
    lane: "URL",
    label: "Underline",
    start: RULE,
    length: RULE_LEN,
    follows: "url",
    beats: { reveal: RULE_REVEAL },
  },
]);
