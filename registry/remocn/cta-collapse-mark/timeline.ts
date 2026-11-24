import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The call to action comes in word by word with the URL under it, then the
// letters shed into squares from the edges inward, the squares fly into a
// pixel R, merge and snap into the remocn mark, the mark shrinks and the
// wordmark's letters rise in beside it, under a slow push. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type CtaCollapseMarkElementId =
  | "push"
  | `word:${number}`
  | "url"
  | "shed"
  | "merge"
  | "snap"
  | "reveal"
  | `letter:${number}`;

export interface CtaCollapseMarkTimingProps {
  cta?: string;
  stagger?: number;
}

const B = {
  cta: 0,
  wordStep: 2,
  url: 12,
  shed: 36,
  shedSpread: 12,
  drift: 7,
  travel: 18,
  merge: 74,
  snap: 78,
  word: 84,
  letterStep: 4,
  end: 138,
};

/** Frames the demo runs. */
export const CTA_COLLAPSE_LENGTH = B.end;
export const DEFAULT_CTA = "Ship your first launch film";
/** The wordmark's letters after the R. */
export const CTA_MARK_WORD = "emocn";

// `push` is the slow camera push across the scene. `word:<i>` brings word
// `i` of the call to action in over its length (a chain, `stagger` apart);
// `url` brings the URL in. `shed` breaks the letters into squares: each
// glyph sheds up to `spread` frames after the start, the nearer the center
// the later, fading over `fade`; each square drifts over `drift`, sets off
// at `travelAt` and flies into the R over `travel`, showing over `show`.
// `merge` grows the squares together; `snap` swaps them for the mark and
// punches the camera in to `peak` and back by `punch`. `reveal` shrinks the
// mark aside over its length; the gaps settle from `settleAt` over
// `settle`. `letter:<i>` rises letter `i` of the wordmark in (a chain).
export const ctaCollapseMarkTimeline = defineTimeline<
  CtaCollapseMarkElementId,
  CtaCollapseMarkTimingProps
>(({ cta = DEFAULT_CTA, stagger = B.wordStep }) => {
  const elements: TimelineElement<CtaCollapseMarkElementId>[] = [
    { id: "push", lane: "Camera", label: "Push", start: 0, length: B.end },
  ];
  cta.split(" ").forEach((w, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Call to action",
      label: w,
      start: B.cta + i * stagger,
      length: 12,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    });
  });
  elements.push(
    { id: "url", lane: "URL", label: "URL", start: B.url, length: 12 },
    {
      id: "shed",
      lane: "Squares",
      label: "Shed and fly",
      start: B.shed,
      length: B.merge - B.shed,
      follows: "url",
      beats: {
        spread: B.shedSpread,
        fade: 10,
        drift: B.drift,
        travelAt: 5,
        travel: B.travel,
        show: 3,
      },
    },
    {
      id: "merge",
      lane: "Squares",
      label: "Merge",
      start: B.merge,
      length: 4,
      follows: "shed",
    },
    {
      id: "snap",
      lane: "Mark",
      label: "Snap",
      start: B.snap,
      length: 5,
      follows: "merge",
      beats: { peak: 2, punch: 9 },
    },
    {
      id: "reveal",
      lane: "Mark",
      label: "Reveal",
      start: B.word,
      length: 26,
      follows: "snap",
      beats: { settleAt: 6, settle: 30 },
    },
  );
  Array.from(CTA_MARK_WORD).forEach((ch, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Wordmark",
      label: ch,
      start: B.word + 6 + i * B.letterStep,
      length: 6,
      follows: i > 0 ? `letter:${i - 1}` : "reveal",
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
