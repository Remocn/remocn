import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The slice opening, each draft wiping into the next one and the final word,
// then the slice collapsing into print. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type TypeFossilElementId = "open" | `revision:${number}` | "collapse";

export interface TypeFossilTimingProps {
  text?: string;
  drafts?: string;
}

export const DEFAULT_TEXT = "Form";
export const DEFAULT_DRAFTS = "Idea | Maybe | Try | Almost | Again | Closer";
/** The slice opens over `OPEN`. */
const OPEN = 16;
/** The first wipe starts at `FIRST_REVISION`, the next ones `REVISION_GAP` apart, each over `WIPE`. */
const FIRST_REVISION = 20;
const REVISION_GAP = 18;
const WIPE = 8;
/** The collapse starts `COLLAPSE_GAP` after the last wipe and takes `COLLAPSE`. */
const COLLAPSE_GAP = 8;
const COLLAPSE = 48;
/** The ghost contours fade over the last `GHOST_FADE` frames of the collapse. */
const GHOST_FADE = 18;

const finite = (n: number, fallback: number) =>
  Number.isFinite(n) ? n : fallback;

/** The drafts, split on | or newlines, up to twelve. */
export function parseDrafts(drafts: string) {
  return drafts
    .split(/[|\n\r]+/)
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 12);
}

/** How many wipes run, when the collapse starts and when it settles. */
export function fossilSchedule(draftCount: number) {
  const count = Math.round(Math.max(0, Math.min(12, finite(draftCount, 6))));
  const collapseStart =
    count === 0
      ? OPEN
      : FIRST_REVISION + (count - 1) * REVISION_GAP + (WIPE + COLLAPSE_GAP);
  return { draftCount: count, collapseStart, settle: collapseStart + COLLAPSE };
}

/**
 * The elements for `draftCount` drafts. `revision:<k>` wipes from version
 * `k - 1` to version `k`, labelled from `versions` when given.
 */
export function fossilElements(
  draftCount: number,
  versions: string[] = [],
): TimelineElement<TypeFossilElementId>[] {
  const { draftCount: count, collapseStart } = fossilSchedule(draftCount);
  const elements: TimelineElement<TypeFossilElementId>[] = [
    { id: "open", lane: "Slice", label: "open", start: 0, length: OPEN },
  ];
  for (let revision = 0; revision < count; revision++) {
    elements.push({
      id: `revision:${revision + 1}`,
      lane: "Revisions",
      label: versions[revision + 1] ?? `revision ${revision + 1}`,
      start: FIRST_REVISION + revision * REVISION_GAP,
      length: WIPE,
      follows: revision > 0 ? `revision:${revision}` : "open",
    });
  }
  elements.push({
    id: "collapse",
    lane: "Slice",
    label: "collapse",
    start: collapseStart,
    length: COLLAPSE,
    follows: count > 0 ? `revision:${count}` : "open",
    beats: { fade: -GHOST_FADE },
  });
  return elements;
}

// Each wipe follows the one before it and the collapse follows the last;
// the ghost contours fade out over the collapse's last frames (`fade`,
// counted back from its end).
export const typeFossilTimeline = defineTimeline<
  TypeFossilElementId,
  TypeFossilTimingProps
>(({ text = DEFAULT_TEXT, drafts = DEFAULT_DRAFTS }) => {
  const versions = [...parseDrafts(drafts), text.trim().replace(/\s+/g, " ")];
  return fossilElements(versions.length - 1, versions);
});
