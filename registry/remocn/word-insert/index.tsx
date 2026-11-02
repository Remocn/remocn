"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { type CSSProperties, type ReactNode, useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface WordInsertProps {
  states?: string[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Manrope 500 advance widths (1/1000 em) for ASCII 32–126, punctuation, kerning.
const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  403, 626, 406, 579, 563, 596, 581, 621, 513, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 641, 630, 600, 708, 616, 949, 623, 575, 631, 413,
  403, 413, 673, 660, 506, 563, 600, 561, 601, 591, 363, 600, 605, 249, 263,
  510, 249, 865, 605, 601, 600, 601, 374, 531, 412, 605, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const MANROPE_500_EXTRA: Record<string, number> = {
  "‘": 243,
  "’": 243,
  "“": 399,
  "”": 399,
  "…": 658,
  "–": 540,
  "—": 780,
};
const KERN_PAIRS = [
  "AA-35 AC20 AG20 AO20 AQ20 AS20 AT60 AU20 AV70 AW70 AY60 Af25 At20",
  "Av40 Aw40 Ay50 A’80 A“120 A”80 B,30 B.30 BT20 BV30 BW30 BX30 BY30",
  "C,50 C.50 CA20 CS-30 CV20 CW20 CX30 CY30 D,50 D.50 DA20 DT20 DV30",
  "DW30 DX30 DY30 DZ12 EC25 EG30 EO30 EQ30 ES20 F,115 F.115 FA10 FJ25",
  "Fa20 Fc15 Fd15 Fe15 Fo15 Fq20 G,50 G.50 GA20 GT20 GV30 GW30 GX30 GY30",
  "IY40 J,50 J.50 JA20 KC15 KG35 KO35 KQ30 KS30 Kc40 Kd40 Ke40 Kg30 Ko40",
  "Kq35 Ks20 Kt31 Ku35 Ky45 K“20 LG20 LO20 LQ20 LT100 LV80 LW80 LY100",
  "Lf20 Lt25 Lv35 Lw35 Ly50 L’120 L“120 L”120 O,50 O.50 OA20 OT20 OV30",
  "OW30 OX50 OY30 Ox20 P,160 P.160 PA50 PJ25 PX30 Pa20 Pf-40 Q,30 Q.30",
  "QA20 QT20 QV30 QW30 QX30 QY30 Qx20 RC15 RY12 S,25 S.25 SS-15 SV20",
  "SW20 SX30 SY30 Sy10 T,100 T.100 TA20 TJ80 TT-60 TY-30 Ta70 Tc80 Td80",
  "Te80 Tg80 Tm50 Tn50 To80 Tp50 Tq80 Tr50 Ts60 Tu50 Tv60 Tw60 Tx70 Ty70",
  "Tz60 T”-40 U,20 U.20 UA30 US30 V,60 V.60 VA70 VC20 VG20 VJ30 VO20",
  "VQ20 VS20 Va45 Vc60 Vd60 Ve60 Vg45 Vi20 Vl20 Vm30 Vn30 Vo60 Vp30 Vq45",
  "Vs30 Vu30 Vv30 Vw30 Vx30 Vz20 W,60 W.60 WA70 WC20 WG20 WJ30 WO20 WQ20",
  "WS20 Wa45 Wc60 Wd60 We60 Wg45 Wi20 Wl20 Wm30 Wn30 Wo60 Wp30 Wq45 Ws30",
  "Wu30 Wv30 Ww30 Wx30 Wz20 XC30 XG30 XO30 XQ30 XS20 XT-40 Xc20 Xd20",
  "Xe20 Xo20 Y,140 Y.140 YA70 YC40 YG40 YI25 YJ80 YO40 YQ40 YS30 YT-30",
  "YX20 YY-31 Ya80 Yb25 Yc80 Yd80 Ye80 Yg80 Ym50 Yn50 Yo80 Yp50 Yq80",
  "Yr40 Ys80 Yu40 Yv35 Yw35 Yx30 Yy35 Yz35 ZT-40 Zv60 Zw60 aT60 aV30",
  "aW30 aY60 av20 aw20 ay30 a’30 a“30 a”20 b,20 b.20 bT60 bV30 bW30 bX20",
  "bY80 bv20 bw20 bx20 by30 bz20 b’30 b“30 b”20 c,20 c.20 cT60 cV30 cW30",
  "cY60 cc15 cd15 ce15 ci15 cl15 co15 cy20 c’30 c“30 c”20 dY40 e,20 e.20",
  "eT60 eV30 eW30 eY60 ea10 em15 en15 ep15 ev20 ew20 ex20 ey10 e”30 f,50",
  "f.50 fI-31 fT-60 fa15 fb-31 fc20 fd20 fe20 fh-31 fi-15 fk-31 fl-15",
  "fo20 f’-30 f“-40 f”-30 gT50 gY50 g“50 hT60 h’20 h“30 h”20 i’37 kc10",
  "kd10 ke10 ko10 kq30 ks10 l’37 mT60 mY70 my20 m’40 m“20 m”20 nT60 nY70",
  "ny20 n’40 n“20 n”20 o,20 o.20 oT60 oV30 oW30 oX20 oY80 ov20 ow20 ox12",
  "oy20 oz20 o’20 o“30 o”30 p,20 p.20 pT60 pV30 pW30 pX20 pY80 pv20 pw20",
  "px12 py20 pz20 p’20 p“30 p”30 qY40 r,80 r.80 rY20 ra17 rc10 rd10 re10",
  "rg20 ro10 rs20 ry10 sT50 sV30 sW30 sY60 sv20 sw20 sx20 sy20 s’20 s“30",
  "s”30 tY20 tc22 td22 te22 to22 ty15 uY40 v,80 v.80 vA20 vT60 vY35 va30",
  "vc20 vd20 ve20 vg20 vo20 vq20 vs20 w,80 w.80 wA20 wT60 wY35 wa30 wc20",
  "wd20 we20 wg20 wo20 wq20 ws20 xT50 xY30 xa20 xc20 xd20 xe20 xg20 xo20",
  "xq20 xv10 xw10 y,80 y.80 yA15 yT40 yY35 ya20 yc20 yd20 ye20 yf-40",
  "yg15 yo20 yt-40 y”-30 zT50 zY35 za30 zc40 zd40 ze40 zo40 zq30 zy15",
  "’A120 ’S30 ’a30 ’c75 ’d75 ’e75 ’g30 ’i-30 ’l-30 ’o75 ’q30 ’s80 “A120",
  "“J120 “a30 “c30 “d30 “e30 “g30 “o30 “q30 “s30 “t-30 ”A120 ”J100 ”c30",
  "”d30 ”e30 ”f30 ”g40 ”o30 ”q30 ”s30",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);
const TRACK = -0.03;
const ASC = 1.066;
const LINE = 1.366;
const CAP = 0.72;
const SPACE = 0.2 + TRACK;
const LEAD = 1.06;
const MAX_SIZE = 0.2;
const FILL = 0.84;

const ENTER_STAGGER = 3;
const ENTER_LEN = 18;
const FIRST = 36;
const STEP = 50;
const MOVE = 22;
const INSERT_DELAY = 12;
const INSERT_LEN = 18;
const INSERT_STAGGER = 3;
const ACCENT_HOLD = 12;
const SETTLE = 16;
const HOLD = 30;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Inserted words are painted with one stage-wide gradient (clip-text):
// gradients.sh "aurora" on dark, "ribbon" on light. `null` = the accent.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    grain: 0.07,
    stops: ["#a0f0c8", "#3fb5a3", null, "#b25c9c"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    grain: 0.045,
    stops: [null, "#7a5cff", "#ff3d9a", "#ff8a3d"],
  },
} as const;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  if (code >= 32 && code < 127) return MANROPE_500[code - 32] / 1000;
  return (MANROPE_500_EXTRA[ch] ?? 620) / 1000;
}

function textEm(s: string) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    if (i > 0) w += KERN.get(s[i - 1] + s[i]) ?? 0;
    w += advance(s[i]) + TRACK;
  }
  return w;
}

function wordKey(token: string) {
  return token.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function tokenize(state: string) {
  return state.split(/\s+/).filter(Boolean);
}

function matchTokens(a: string[], b: string[]) {
  const ka = a.map(wordKey);
  const kb = b.map(wordKey);
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] =
        ka[i] === kb[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (ka[i] === kb[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

interface Point {
  x: number;
  y: number;
}

interface Layout {
  tokens: string[];
  x: number[];
  y: number[];
  w: number[];
}

interface Track {
  key: string;
  idx: (number | null)[];
  virtualFrom: (Point | null)[];
  virtualTo: (Point | null)[];
  bornAt: number;
  bornOrder: number;
}

interface Plan {
  tracks: Track[];
  owner: number[][];
  pairs: [number, number][][];
}

function planTracks(states: string[][]): Plan {
  const tracks: Track[] = [];
  const blankIdx = () => states.map(() => null as number | null);
  const blankPt = () => states.map(() => null as Point | null);
  const add = (s: number, j: number, order: number) => {
    const idx = blankIdx();
    idx[s] = j;
    tracks.push({
      key: `t${tracks.length}`,
      idx,
      virtualFrom: blankPt(),
      virtualTo: blankPt(),
      bornAt: s,
      bornOrder: order,
    });
    return tracks.length - 1;
  };
  const owner: number[][] = [states[0].map((_, i) => add(0, i, i))];
  const pairs: [number, number][][] = [[]];
  for (let s = 1; s < states.length; s++) {
    const matched = matchTokens(states[s - 1], states[s]);
    pairs.push(matched);
    const fromB = new Map(matched.map(([i, j]) => [j, i]));
    let order = 0;
    owner.push(
      states[s].map((_, j) => {
        const i = fromB.get(j);
        if (i === undefined) return add(s, j, order++);
        const id = owner[s - 1][i];
        tracks[id].idx[s] = j;
        return id;
      }),
    );
  }
  return { tracks, owner, pairs };
}

function lineOf(plan: Plan, states: string[][], cut: number | null) {
  const last = states.length - 1;
  return states.map((tokens, s) => {
    let line = 0;
    return tokens.map((_, i) => {
      const lastIdx = plan.tracks[plan.owner[s][i]].idx[last];
      if (cut !== null && lastIdx !== null && lastIdx >= cut) line = 1;
      return line;
    });
  });
}

function widestLine(states: string[][], lines: number[][]) {
  let widest = 0;
  states.forEach((tokens, s) => {
    const sums = [0, 0];
    const counts = [0, 0];
    tokens.forEach((tok, i) => {
      const l = lines[s][i];
      sums[l] += textEm(tok) + (counts[l] > 0 ? SPACE : 0);
      counts[l]++;
    });
    widest = Math.max(widest, sums[0], sums[1]);
  });
  return widest;
}

function layoutState(tokens: string[], lines: number[]): Layout {
  const w = tokens.map(textEm);
  const used = [...new Set(lines)];
  const x: number[] = new Array(tokens.length).fill(0);
  const y: number[] = new Array(tokens.length).fill(0);
  used.forEach((line, row) => {
    const members = tokens.map((_, i) => i).filter((i) => lines[i] === line);
    const lineW =
      members.reduce((s, i) => s + w[i], 0) +
      SPACE * Math.max(0, members.length - 1);
    let cursor = -lineW / 2;
    for (const i of members) {
      x[i] = cursor;
      y[i] = (row - (used.length - 1) / 2) * LEAD;
      cursor += w[i] + SPACE;
    }
  });
  return { tokens, x, y, w };
}

function gapPoint(
  src: Layout,
  dst: Layout,
  dstIndex: number,
  map: Map<number, number>,
): Point {
  const n = dst.tokens.length;
  const sameLine = (a: number, b: number) =>
    Math.abs(dst.y[a] - dst.y[b]) < 1e-6;
  let runStart = dstIndex;
  while (
    runStart > 0 &&
    !map.has(runStart - 1) &&
    sameLine(runStart - 1, dstIndex)
  )
    runStart--;
  let runEnd = dstIndex;
  while (
    runEnd < n - 1 &&
    !map.has(runEnd + 1) &&
    sameLine(runEnd + 1, dstIndex)
  )
    runEnd++;
  const runLeft = dst.x[runStart];
  const runW = dst.x[runEnd] + dst.w[runEnd] - runLeft;
  const at = (k: number) =>
    k >= 0 && k < n && sameLine(k, dstIndex) ? map.get(k) : undefined;
  const prev = at(runStart - 1);
  const next = at(runEnd + 1);
  let left = runLeft;
  let y = dst.y[dstIndex];
  if (prev !== undefined && next !== undefined) {
    left = (src.x[prev] + src.w[prev] + src.x[next]) / 2 - runW / 2;
    y = src.y[prev];
  } else if (prev !== undefined) {
    left = src.x[prev] + src.w[prev] + SPACE;
    y = src.y[prev];
  } else if (next !== undefined) {
    left = src.x[next] - SPACE - runW;
    y = src.y[next];
  }
  return { x: left + (dst.x[dstIndex] - runLeft), y };
}

function resolveVirtual(plan: Plan, layouts: Layout[]) {
  for (let s = 1; s < layouts.length; s++) {
    const a = layouts[s - 1];
    const b = layouts[s];
    const fromB = new Map(plan.pairs[s].map(([i, j]) => [j, i]));
    const fromA = new Map(plan.pairs[s].map(([i, j]) => [i, j]));
    b.tokens.forEach((_, j) => {
      if (!fromB.has(j))
        plan.tracks[plan.owner[s][j]].virtualFrom[s] = gapPoint(a, b, j, fromB);
    });
    a.tokens.forEach((_, i) => {
      if (!fromA.has(i))
        plan.tracks[plan.owner[s - 1][i]].virtualTo[s] = gapPoint(
          b,
          a,
          i,
          fromA,
        );
    });
  }
  return plan.tracks;
}

function splitChange(from: string, to: string) {
  let pre = 0;
  while (pre < from.length && pre < to.length && from[pre] === to[pre]) pre++;
  let suf = 0;
  while (
    suf < from.length - pre &&
    suf < to.length - pre &&
    from[from.length - 1 - suf] === to[to.length - 1 - suf]
  )
    suf++;
  return {
    prefix: from.slice(0, pre),
    midFrom: from.slice(pre, from.length - suf),
    midTo: to.slice(pre, to.length - suf),
    suffix: from.slice(from.length - suf),
  };
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const DEFAULT_STATES = [
  "Launch videos.",
  "Launch videos, as code.",
  "Beautiful launch videos, as code.",
];

export function wordInsertDuration(states: number = DEFAULT_STATES.length) {
  const last = FIRST + Math.max(0, states - 2) * STEP;
  return last + INSERT_DELAY + INSERT_LEN + ACCENT_HOLD + SETTLE + HOLD;
}

export function WordInsert({
  states = DEFAULT_STATES,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: WordInsertProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const tokenized = useMemo(
    () => (states.length ? states : [""]).map(tokenize),
    [states],
  );
  const fillW = W * FILL;
  const { F, tracks, layouts } = useMemo(() => {
    const plan = planTracks(tokenized);
    const lastLen = tokenized[tokenized.length - 1].length;
    let best = { size: 0, lines: lineOf(plan, tokenized, null) };
    for (let cut = -1; cut < lastLen; cut++) {
      if (cut === 0) continue;
      const lines = lineOf(plan, tokenized, cut < 0 ? null : cut);
      const size = Math.min(
        H * MAX_SIZE,
        fillW / Math.max(0.1, widestLine(tokenized, lines)),
      );
      if (size > best.size + 0.5) best = { size, lines };
    }
    const laid = tokenized.map((tokens, s) =>
      layoutState(tokens, best.lines[s]),
    );
    return { F: best.size, tracks: resolveVirtual(plan, laid), layouts: laid };
  }, [tokenized, fillW, H]);

  const startOf = (s: number) => FIRST + (s - 1) * STEP;
  let cur = 0;
  for (let s = 1; s < layouts.length; s++) if (t >= startOf(s)) cur = s;
  const p =
    cur === 0
      ? 1
      : EASE_IO(
          interpolate(t, [startOf(cur), startOf(cur) + MOVE], [0, 1], CLAMP),
        );
  const prev = Math.max(0, cur - 1);
  const la = layouts[prev];
  const lb = layouts[cur];
  const baseline = H / 2 + (CAP * F) / 2;

  // One gradient band across the whole measure; each inserted word samples
  // the slice it sits on, drifting a few percent over the shot.
  const final = layouts[layouts.length - 1];
  const bandL = Math.min(0, ...final.x);
  const bandR = Math.max(0, ...final.x.map((v, i) => v + final.w[i]));
  const bandEm = Math.max(0.1, bandR - bandL);
  const drift = 0.04 * bandEm * Math.sin(t * 0.012);
  const stops = c.stops.map((col) => col ?? accent);
  const gradient = `linear-gradient(90deg, ${stops
    .map((col, i) => `${col} ${((i / (stops.length - 1)) * 100).toFixed(1)}%`)
    .join(", ")})`;
  const PAD = 0.1;
  const paint = (text: string, ex: number, extra?: CSSProperties) => (
    <span
      style={{
        ...extra,
        marginLeft: `${-PAD}em`,
        padding: `0 ${PAD}em`,
        color: "transparent",
        backgroundImage: gradient,
        backgroundSize: `${bandEm * 1.1}em 100%`,
        backgroundPosition: `${-(ex - PAD - bandL + bandEm * 0.05) + drift}em 0`,
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }}
    >
      {text}
    </span>
  );

  const words: ReactNode[] = [];
  for (const tr of tracks) {
    const ia = tr.idx[prev];
    const ib = tr.idx[cur];
    if (ia === null && ib === null) continue;

    let x = 0;
    let y = 0;
    let opacity = 1;
    let rise = 0;
    let content: ReactNode = null;
    // Inserted words carry the gradient for the rest of the shot.
    const born = tr.bornAt > 0;

    if (cur === 0 && ib !== null) {
      x = lb.x[ib];
      y = lb.y[ib];
      const start = ib * ENTER_STAGGER;
      const e = EASE_OUT(
        interpolate(t, [start, start + ENTER_LEN], [0, 1], CLAMP),
      );
      opacity = e;
      rise = (1 - e) * 0.24;
      content = lb.tokens[ib];
    } else if (ia !== null && ib !== null) {
      x = la.x[ia] + (lb.x[ib] - la.x[ia]) * p;
      y = la.y[ia] + (lb.y[ib] - la.y[ia]) * p;
      const from = la.tokens[ia];
      const to = lb.tokens[ib];
      if (from === to || p >= 1) {
        content = to;
      } else {
        const sp = splitChange(from, to);
        const mix = interpolate(p, [0.2, 0.8], [0, 1], CLAMP);
        const preW = textEm(sp.prefix);
        const midW =
          textEm(sp.midFrom) + (textEm(sp.midTo) - textEm(sp.midFrom)) * p;
        const part = (key: string, text: string, left: number, o: number) => {
          const style: CSSProperties = {
            position: "absolute",
            left: `${left}em`,
            top: 0,
            opacity: o,
          };
          if (born)
            return (
              <span key={key} style={style}>
                {paint(text, x + left)}
              </span>
            );
          return (
            <span key={key} style={style}>
              {text}
            </span>
          );
        };
        content = [
          part("pre", sp.prefix, 0, 1),
          part("from", sp.midFrom, preW, 1 - mix),
          part("to", sp.midTo, preW, mix),
          part("suf", sp.suffix, preW + midW, 1),
        ];
      }
    } else if (ib !== null) {
      const from = tr.virtualFrom[cur] ?? { x: lb.x[ib], y: lb.y[ib] };
      x = from.x + (lb.x[ib] - from.x) * p;
      y = from.y + (lb.y[ib] - from.y) * p;
      content = lb.tokens[ib];
    } else if (ia !== null) {
      const to = tr.virtualTo[cur] ?? { x: la.x[ia], y: la.y[ia] };
      x = la.x[ia] + (to.x - la.x[ia]) * p;
      y = la.y[ia] + (to.y - la.y[ia]) * p;
      const out = interpolate(
        t,
        [startOf(cur), startOf(cur) + MOVE * 0.45],
        [0, 1],
        { ...CLAMP, easing: EASE_IO },
      );
      opacity = 1 - out;
      rise = -out * 0.14;
      content = la.tokens[ia];
    }

    if (tr.bornAt > 0) {
      const start =
        startOf(tr.bornAt) + INSERT_DELAY + tr.bornOrder * INSERT_STAGGER;
      const e = EASE_OUT(
        interpolate(t, [start, start + INSERT_LEN], [0, 1], CLAMP),
      );
      if (tr.bornAt === cur) {
        opacity *= e;
        rise = (1 - e) * 0.32;
      }
    }
    if (born && typeof content === "string") content = paint(content, x);

    words.push(
      <div
        key={tr.key}
        style={{
          position: "absolute",
          left: `${x}em`,
          top: `${y - ASC + rise}em`,
          opacity,
          color: c.fg,
          whiteSpace: "pre",
        }}
      >
        {content}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: baseline,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: F,
          lineHeight: LINE,
          letterSpacing: `${TRACK}em`,
          fontKerning: "normal",
        }}
      >
        {words}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
