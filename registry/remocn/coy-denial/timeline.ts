import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One round per denial: the denial rises in word by word, the aside answers
// it in the corner, and the round drops out before the next one; the last
// round stays. When the scene is too short, the whole schedule is squeezed
// by `k` (down to 0.6) so the last aside still lands before the final hold.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type CoyDenialElementId = `round:${number}`;

export interface CoyDenialTimingProps {
  rounds?: { say: string; aside: string }[];
  /** Frames between words as a denial rises in. */
  stagger?: number;
  /** Frames the aside stays readable before the round leaves. */
  hold?: number;
}

export const DEFAULT_ROUNDS: { say: string; aside: string }[] = [
  { say: "Nothing is launching on Thursday.", aside: "(Something is.)" },
  { say: "Don’t check the site at nine.", aside: "(Do.)" },
];

export const SAY_STAGGER = 3;
const SAY_LEN = 15;
const ASIDE_AT = 48;
const ASIDE_GAP = 7;
const ASIDE_LEN = 10;
const OUT_MIN = 84;
const READ_HOLD = 28;
const ROUND_GAP = 12;
const OUT_LEN = 10;
/** Frames the last aside holds before the end. */
const MIN_HOLD = 36;

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Each round's aside pacing and exit, the round starts and the motion's end. */
function coyDenialPlan({
  rounds = DEFAULT_ROUNDS,
  hold = READ_HOLD,
}: CoyDenialTimingProps) {
  const n = rounds.length;
  const plan = rounds.map((round) => {
    const words = wordCount(round.aside);
    const gap = Math.max(3, Math.min(ASIDE_GAP, 36 / Math.max(1, words)));
    const end = ASIDE_AT + (words - 1) * gap + ASIDE_LEN;
    return { gap, end, out: Math.max(OUT_MIN, end + hold) };
  });
  const starts: number[] = [];
  plan.reduce((acc, p) => {
    starts.push(acc);
    return acc + p.out + ROUND_GAP;
  }, 0);
  const motionEnd = n > 0 ? starts[n - 1] + plan[n - 1].end : 0;
  return { plan, starts, motionEnd };
}

// Round `i` runs until the next one starts, each following the one before.
// Its beats are offsets from its start: the round shows from `lead`, the
// denial's words rise `stagger` apart over `say`, the aside's words come in
// from `aside`, `asideGap` apart over `asideLen`, and the round leaves at
// `out` over `outLen` and is gone `linger` later, the aside fading from
// `fadeFrom` to `fadeTo` around the exit. The plan is counted unsqueezed and
// every number is multiplied by `k` into scene frames.
export const coyDenialTimeline = defineTimeline<
  CoyDenialElementId,
  CoyDenialTimingProps
>((props, { length }) => {
  const { rounds = DEFAULT_ROUNDS, stagger = SAY_STAGGER } = props;
  const { plan, starts, motionEnd } = coyDenialPlan(props);
  const room = length - MIN_HOLD;
  const k = Math.max(0.6, Math.min(1, room / motionEnd));
  const n = rounds.length;
  return rounds.map(
    (round, i): TimelineElement<CoyDenialElementId> => ({
      id: `round:${i}`,
      lane: "Rounds",
      label: round.say,
      start: starts[i] * k,
      length: (i < n - 1 ? plan[i].out + ROUND_GAP : plan[i].end) * k,
      follows: i > 0 ? `round:${i - 1}` : undefined,
      beats: {
        lead: -2 * k,
        stagger: stagger * k,
        say: SAY_LEN * k,
        aside: ASIDE_AT * k,
        asideGap: plan[i].gap * k,
        asideLen: ASIDE_LEN * k,
        out: plan[i].out * k,
        outLen: OUT_LEN * k,
        linger: 4 * k,
        fadeFrom: -6 * k,
        fadeTo: 2 * k,
      },
    }),
  );
});
