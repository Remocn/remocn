import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in part by part, the squiggle drawing under the typo, the
// letters hopping into their right places, the squiggle retracting and the
// accent rule drawing in as the word lands. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TypoFixElementId =
  | "before"
  | "word"
  | "after"
  | "squiggle"
  | "fix"
  | "retract"
  | "rule";

export interface TypoFixTimingProps {
  wrong?: string;
  correct?: string;
  before?: string;
  after?: string;
  fixAt?: number;
}

export const DEFAULT_WRONG = "Lanuch";
export const DEFAULT_CORRECT = "Launch";
export const DEFAULT_AFTER = "day";

const ENTER_STAGGER = 3;
const ENTER_LEN = 18;
const SQUIGGLE_AT = 20;
const SQUIGGLE_LEN = 14;
export const SWAP_AT = 44;
export const SWAP_STAGGER = 1;
export const TRAVEL = 20;
const RETRACT_LEN = 10;
export const RULE_DELAY = 1;
export const RULE_LEN = 10;
export const HOLD = 36;

// Onest 500 advance widths (1/1000 em) for ASCII 32–126, plus its kern pairs.
const ONEST_500 = [
  274, 283, 377, 662, 658, 831, 690, 230, 323, 323, 430, 564, 274, 460, 263,
  489, 663, 372, 564, 604, 634, 616, 623, 507, 623, 620, 263, 274, 564, 564,
  564, 519, 987, 684, 662, 707, 723, 614, 601, 724, 732, 272, 567, 641, 581,
  870, 749, 765, 638, 765, 668, 655, 578, 730, 694, 990, 618, 637, 604, 332,
  489, 332, 564, 457, 576, 559, 611, 556, 611, 574, 372, 611, 596, 230, 259,
  533, 230, 830, 596, 596, 611, 611, 380, 510, 369, 579, 543, 851, 530, 603,
  515, 394, 268, 394, 564,
];
const KERN_PAIRS = [
  "AA-15 AC18 AG18 AJ-20 AO18 AQ18 AS18 AT50 AU10 AV50 AW30 AY60 Av30",
  "Aw20 BV10 BW10 BX10 BY10 CA19 CJ-10 CV25 CX24 CY20 DA19 DC-15 DG-15",
  "DJ-10 DO-15 DQ-15 DS-15 DT10 DV25 DX30 DY20 Dd-10 FA50 FJ30 FT-20",
  "Fa30 Fc25 Fd25 Fe25 Fg25 Fo25 Fq25 Fs25 GA19 GJ-10 GT10 GV25 GX24",
  "GY20 JA10 KT-10 Ka10 Kv30 LA-20 LJ-30 LT40 LV50 LW40 LX-10 LY80 La-10",
  "Lc-10 Ld-10 Le-10 Lg-10 Lj-20 Lo-10 Lq-10 Ls-10 Lz-20 OA19 OJ-10 OV26",
  "OX24 OY26 PA52 PC-10 PG-10 PJ50 PQ-10 PS-10 PX25 PY15 Pa20 Pc10 Pd10",
  "Pe10 Pg10 Pj10 Po10 Pq10 Ps10 QA19 QJ-10 QT10 QV25 QX24 QY20 RY20",
  "Ra10 Rc10 Rd10 Re10 Rg10 Ro10 Rq10 Rs10 SA19 SJ-10 ST10 SV25 SX30",
  "SY20 TA54 TG10 TJ80 TQ10 TS10 TT-40 Ta60 Tc50 Td50 Te50 Tg50 Tm20",
  "Tn20 To50 Tp20 Tq50 Tr20 Ts50 Tu20 UA10 Ua20 Uc10 Ud10 Ue10 Ug10 Uo10",
  "Uq10 Us10 VA50 VC25 VG25 VJ80 VO26 VQ25 VS25 Va50 Vc50 Vd50 Ve50 Vg50",
  "Vm20 Vn20 Vo50 Vp20 Vq50 Vr20 Vs50 Vu20 Vz20 WA30 WJ30 Wa35 Wd25 XC24",
  "XG24 XO24 XQ24 XS30 YA60 YC20 YG20 YJ90 YO26 YQ20 YS20 Ya70 Yc70 Yd70",
  "Ye70 Yf20 Yg70 Ym30 Yn30 Yo70 Yp30 Yq70 Yr30 Ys70 Yu30 Yv30 Yw20 Yx20",
  "Yz30 bT50 bV50 bY70 bc-10 bd-10 bf10 bx10 cT50 cV50 cY70 cc-10 cf10",
  "cx10 eT50 eV50 eY70 ec-10 ef10 ex10 fc10 fd10 fe10 fg10 fo10 fq10",
  "fs10 jj-20 oT50 oV50 oY70 of10 ox10 pT50 pV50 pY70 pc-10 pf20 pt20",
  "px10 qj-20 rc10 rd10 re10 rg10 ro10 rq10 rs10 rt-30 sT50 sV50 sY70",
  "sc-10 sf10 st10 sx15 vA30 xc10 xd10 xe10 xg10 xo10 xq10 xs10",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);

export const TRACK = -0.03;

export function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? ONEST_500[code - 32] : 620) / 1000;
}

export function textEm(s: string) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    if (i > 0) w += KERN.get(s[i - 1] + s[i]) ?? 0;
    w += advance(s[i]) + TRACK;
  }
  return w;
}

export function layoutWord(chars: string[]) {
  const xs: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
    xs.push(x);
    x += advance(ch) + TRACK;
  });
  return { xs, total: x };
}

export function mapLetters(a: string[], b: string[]) {
  const used = new Array<boolean>(a.length).fill(false);
  const src = new Array<number>(b.length).fill(-1);
  b.forEach((ch, j) => {
    if (a[j] === ch) {
      src[j] = j;
      used[j] = true;
    }
  });
  const pick = (j: number, same: (x: string, y: string) => boolean) => {
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    a.forEach((ch, i) => {
      if (used[i] || !same(ch, b[j])) return;
      const d = Math.abs(i - j);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) used[best] = true;
    return best;
  };
  b.forEach((_, j) => {
    if (src[j] < 0) src[j] = pick(j, (x, y) => x === y);
  });
  b.forEach((_, j) => {
    if (src[j] < 0)
      src[j] = pick(j, (x, y) => x.toLowerCase() === y.toLowerCase());
  });
  const orphans = a.map((_, i) => i).filter((i) => !used[i]);
  return { src, orphans };
}

/** Letters of the typo that travel to a new place, hopping one by one. */
export function moversOf(wrong: string, correct: string) {
  const a = Array.from(wrong);
  const b = Array.from(correct);
  const la = layoutWord(a);
  const lb = layoutWord(b);
  const { src } = mapLetters(a, b);
  return b.filter((_, j) => {
    const i = src[j];
    return i >= 0 && Math.abs(lb.xs[j] - la.xs[i]) > 0.02;
  }).length;
}

// `before`, `word` and `after` rise in, a chain of the parts the line has.
// `squiggle` draws under the typo. `fix` hops the moving letters into
// place from `fixAt`, `stagger` apart, each over `travel`; the letters that
// stay put or fade go with the first. `retract` pulls the squiggle away
// before the last letter lands and `rule` draws in after it; both follow
// the fix, whose end also kicks the word.
export const typoFixTimeline = defineTimeline<
  TypoFixElementId,
  TypoFixTimingProps
>(
  ({
    wrong = DEFAULT_WRONG,
    correct = DEFAULT_CORRECT,
    before = "",
    after = DEFAULT_AFTER,
    fixAt = SWAP_AT,
  }) => {
    const elements: TimelineElement<TypoFixElementId>[] = [];
    const parts: [TypoFixElementId, string][] = [];
    if (before) parts.push(["before", before]);
    parts.push(["word", wrong]);
    if (after) parts.push(["after", after]);
    parts.forEach(([id, label], k) => {
      elements.push({
        id,
        lane: "Line",
        label,
        start: k * ENTER_STAGGER,
        length: ENTER_LEN,
        follows: k > 0 ? parts[k - 1][0] : undefined,
      });
    });
    const movers = moversOf(wrong, correct);
    const fixLen = Math.max(0, movers - 1) * SWAP_STAGGER + TRAVEL;
    const swapEnd = fixAt + fixLen;
    elements.push(
      {
        id: "squiggle",
        lane: "Squiggle",
        label: "squiggle",
        start: SQUIGGLE_AT,
        length: SQUIGGLE_LEN,
        follows: "word",
      },
      {
        id: "fix",
        lane: "Fix",
        label: correct,
        start: fixAt,
        length: fixLen,
        beats: { stagger: SWAP_STAGGER, travel: TRAVEL },
      },
      {
        id: "retract",
        lane: "Squiggle",
        label: "retract",
        start: swapEnd - RETRACT_LEN + 2,
        length: RETRACT_LEN,
        follows: "fix",
      },
      {
        id: "rule",
        lane: "Fix",
        label: "rule",
        start: swapEnd + RULE_DELAY,
        length: RULE_LEN,
        follows: "fix",
      },
    );
    return elements.sort((x, y) => x.start - y.start);
  },
);
