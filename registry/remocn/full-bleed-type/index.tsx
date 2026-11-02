"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface FullBleedTypeProps {
  /** Words in reading order, one slam each. Set in caps; the last one is lit by the sunrise gradient. */
  words?: string[];
  /** Frames between two slams. */
  beat?: number;
  /** Kept for the shared draft API; the hero word takes the "rise" gradient instead. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Barlow Condensed 500, per 1000 em, chars 32–126 (harfbuzz): advance, left and right side bearing.
const ADV = [
  200, 261, 274, 599, 426, 776, 564, 137, 254, 254, 361, 440, 189, 320, 202,
  363, 447, 266, 415, 418, 440, 420, 420, 381, 429, 414, 234, 207, 440, 440,
  440, 394, 759, 436, 456, 452, 469, 432, 410, 457, 475, 220, 435, 466, 407,
  530, 501, 462, 451, 450, 453, 426, 439, 477, 457, 646, 449, 442, 401, 318,
  363, 318, 406, 392, 194, 425, 431, 413, 431, 417, 285, 423, 432, 212, 206,
  421, 191, 657, 432, 424, 435, 435, 304, 387, 275, 432, 399, 575, 398, 387,
  365, 298, 159, 298, 471,
];
const LSB = [
  0, 67, 20, 48, 36, 62, 36, 20, -1, 61, 19, 29, 34, 29, 37, 21, 44, 10, 33, 32,
  19, 45, 45, 19, 44, 26, 54, 38, 29, 29, 29, 24, 43, 12, 62, 48, 62, 62, 62,
  48, 62, 62, 19, 62, 62, 60, 62, 48, 61, 48, 62, 36, 30, 57, 31, 26, 32, 32,
  29, 27, 50, 96, 30, 19, 25, 34, 52, 43, 43, 43, 25, 43, 52, 41, -39, 52, 48,
  52, 52, 43, 57, 43, 52, 35, 21, 48, 21, 21, 18, 16, 28, 27, 31, 27, 29,
];
const RSB = [
  200, 66, 21, 48, 35, 62, 42, 21, 62, -1, 19, 29, 38, 29, 37, 50, 44, 51, 24,
  45, 19, 32, 31, 15, 45, 45, 52, 38, 29, 29, 29, 26, 43, 13, 30, 43, 52, 35,
  14, 48, 62, 62, 62, 18, 11, 59, 62, 48, 29, 48, 26, 35, 30, 57, 29, 24, 32,
  30, 33, 96, 21, 27, 32, 19, 23, 43, 44, 33, 53, 38, 29, 45, 47, 43, 41, 25,
  47, 48, 47, 42, 43, 57, 9, 25, 24, 53, 20, 19, 18, 15, 27, 26, 32, 26, 29,
];
const KERN = new Map(
  [
    "+2-9 +7-22 ,--6 ,0-38 ,7-29 ,K-11 ,L-11 ,T-49 ,V-28 ,W-28 ,X10 ,Y-62",
    ",c-6 ,d-6 ,e-6 ,g-6 ,o-6 ,q-6 ,v-13 ,w-13 ,y-13 -,-6 -.-6 -v-15 -w-15",
    "-x-12 -y-15 .--6 .0-38 .7-29 .K-11 .L-11 .T-49 .V-28 .W-28 .X10 .Y-62",
    ".c-6 .d-6 .e-6 .g-6 .o-6 .q-6 .v-13 .w-13 .y-13 /--49 /A-68 /B-12 /C-29",
    "/D-12 /E-12 /F-12 /G-29 /K-17 /L-22 /N-12 /O-29 /P-12 /Q-29 /R-11 /S-11",
    "/a-52 /c-49 /d-49 /e-49 /g-14 /m-9 /n-9 /o-49 /p-9 /q-14 /r-9 /s-22",
    "/u-13 /v-18 /w-18 /y-18 /z-13 11-17 21-27 31-32 41-48 47-50 51-17 61-22",
    "7,-51 7.-51 7/-72 71-6 81-28 91-28 A/7 AA28 AC-13 AG-13 AO-13 AQ-13",
    "AS-21 AT-60 AV-63 AW-63 AX6 AY-42 Au-9 Av-26 Aw-26 Ax17 Ay-26 B,-11",
    "B.-11 B/-6 BA-21 BB-6 BD-6 BE-6 BF-6 BK-6 BN-6 BP-6 BV-19 BW-19 BX-17",
    "BY-21 Bs-12 C,-6 C--9 C.-6 CA-6 CX-8 CY-8 Cc-9 Cd-9 Ce-9 Co-9 D,-11",
    "D.-11 D/-6 DA-21 DB-6 DD-6 DE-6 DF-6 DK-6 DN-6 DP-6 DV-19 DW-19 DX-17",
    "DY-21 Ds-12 E--6 EA21 EJ17 Ec-6 Ed-6 Ee-6 Eo-6 Es-6 F--29 F/-40 FA-33",
    "FJ-11 Fa-18 Fc-29 Fd-29 Fe-29 Fg-28 Fm-29 Fn-29 Fo-29 Fp-29 Fq-28 Fr-29",
    "Fs-24 Fu-14 Fv-13 Fw-13 Fx-13 Fy-13 Fz-13 G,-6 G--9 G.-6 GA-6 GX-8 GY-8",
    "Gc-9 Gd-9 Ge-9 Go-9 HB-6 HD-6 HE-6 HF-6 HN-6 HP-6 J,-11 J.-11 J/-16",
    "JA-9 JB-11 JC-6 JD-11 JE-11 JF-11 JG-6 JN-11 JO-6 JP-11 JQ-6 K,11 K.11",
    "K/11 KA17 KC-13 KG-13 KO-13 KQ-13 KS-13 L,11 L.11 L/11 L?-9 LA34 LT-70",
    "LY-29 Lf-11 Lt-11 O,-6 O--9 O.-6 OA-6 OX-8 OY-8 Oc-9 Od-9 Oe-9 Oo-9",
    "P,-33 P.-33 P/-52 PA-29 PJ-35 PV-9 PW-9 PX-13 PY-13 Q,-6 Q--9 Q.-6 Q?9",
    "QA-6 QX-8 QY-9 Qc-9 Qd-9 Qe-9 Qo-9 R/11 RA10 RS6 RY-17 S,-6 S.-6 SB-6",
    "SD-6 SE-6 SF-6 SN-6 SP-6 ST-11 SV-10 SW-10 SX-25 SY-21 T,-46 T--58",
    "T.-46 T/-17 T?18 TA-42 TC-27 TG-27 TL-6 TO-27 TQ-27 Ta-31 Tc-58 Td-58",
    "Te-58 Tf-9 Tg-52 Tm-25 Tn-25 To-58 Tp-25 Tq-52 Tr-25 Ts-39 Tt-9 Tu-14",
    "Tv-30 Tw-30 Tx-17 Ty-30 Tz-18 U,-11 U.-11 U/-16 UA-9 UB-11 UC-6 UD-11",
    "UE-11 UF-11 UG-6 UN-11 UO-6 UP-11 UQ-6 V,-29 V--42 V.-29 V/-36 VA-59",
    "VC-12 VG-12 VJ-22 VO-12 VQ-12 VR-6 VS-11 Va-19 Vc-42 Vd-42 Ve-42 Vf-10",
    "Vg-32 Vm-13 Vn-13 Vo-42 Vp-13 Vq-32 Vr-13 Vs-34 Vt-10 Vv-8 Vw-8 Vx-13",
    "Vy-8 Vz-9 W,-29 W--42 W.-29 W/-36 WA-59 WC-12 WG-12 WJ-22 WO-12 WQ-12",
    "WR-6 WS-11 Wa-19 Wc-42 Wd-42 We-42 Wf-10 Wg-32 Wm-13 Wn-13 Wo-42 Wp-13",
    "Wq-32 Wr-13 Ws-34 Wt-10 Wv-8 Ww-8 Wx-13 Wy-8 Wz-9 X,6 X--9 X.6 XA6",
    "XC-10 XG-10 XO-10 XQ-10 XS-25 Xc-9 Xd-9 Xe-9 Xf-9 Xg-9 Xo-9 Xq-9 Xs-9",
    "Xt-9 Xu-9 Xv-32 Xw-32 Xy-32 Y,-62 Y--48 Y.-62 Y/-36 YA-58 YB-17 YC-15",
    "YD-17 YE-17 YF-17 YG-15 YJ-36 YL-6 YN-17 YO-15 YP-17 YQ-15 YS-17 Yc-48",
    "Yd-48 Ye-48 Yf-18 Yg-49 Ym-29 Yn-29 Yo-48 Yp-29 Yq-49 Yr-29 Ys-6 Yt-18",
    "Yu-22 Yv-27 Yw-27 Yx-13 Yy-27 Yz-13 a,-6 a.-6 av-9 aw-9 ay-9 b,-11",
    "b.-11 bx-9 c,-6 c.-6 cv-13 cw-13 cx-9 cy-13 e,-6 e.-6 ev-9 ew-9 ey-9",
    "fg-11 fq-11 gv-11 gw-11 gy-11 h,-11 h.-11 hx-9 k--14 kc-14 kd-14 ke-14",
    "kf-8 kg-13 ko-14 kq-13 ks-13 kt-8 m,-11 m.-11 mx-9 n,-11 n.-11 nx-9",
    "o,-6 o.-6 ov-15 ow-15 ox-12 oy-15 p,-11 p.-11 px-9 qv-11 qw-11 qy-11",
    "rg-8 rq-8 rv11 rw11 ry11 ss-19 sv-13 sw-13 sx-9 sy-13 v,-13 v--10 v.-13",
    "v/-18 va-9 vc-10 vd-10 ve-10 vg-18 vo-10 vq-18 vs-10 vv11 vw11 vy11",
    "w,-13 w--10 w.-13 w/-18 wa-9 wc-10 wd-10 we-10 wg-18 wo-10 wq-18 ws-10",
    "wv11 ww11 wy11 x--13 xc-13 xd-13 xe-13 xo-13 y,-13 y--10 y.-13 y/-18",
    "ya-9 yc-10 yd-10 ye-10 yg-18 yo-10 yq-18 ys-10 yv11 yw11 yy11 z/9",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.7;
const TRACK = -0.01;

// Beat sheet (30fps, speed 1, beat 11):
//  -2–45   one word per beat slams in from alternating sides, already at its
//          final size, overshoots by ~1% of the frame and settles; rows are
//          justified edge to edge, so each word lands in a fixed grid slot
//  46–58   the stack locks: the open leading between rows closes up
//  58–     poster hold
const FIRST_AT = -2;
const SLAM_LEN = 8;
const SETTLE_LEN = 6;
const LOCK_LEN = 12;

const SLAM = Easing.bezier(0.2, 0.9, 0.35, 1);
const SETTLE = Easing.bezier(0.45, 0, 0.55, 1);
const LOCK = Easing.bezier(0.65, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "rise" (bg #030306): a sunrise lighting the hero word from below.
// The light stage drops the palest stop so the word keeps its edge on off-white.
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    rise: ["#fff1e2", "#ff8a3d", "#a3301a"],
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    rise: ["#ff8a3d", "#a3301a", "#2a0d0a"],
  },
} as const;

function code(ch: string) {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c - 32;
  if (ch === "’" || ch === "‘") return 7;
  return 46;
}

function advance(text: string) {
  let adv = 0;
  for (let i = 0; i < text.length; i++) {
    adv += ADV[code(text[i])] / 1000;
    if (i > 0) adv += (KERN.get(text[i - 1] + text[i]) ?? 0) + TRACK;
  }
  return adv;
}

// A tight word space: the rows read as blocks, not sentences.
const SPACE = 0.15;

interface Row {
  words: number[];
  /** Pen offset of each word from the row's pen start, in em. */
  offsets: number[];
  lsb: number;
  ink: number;
}

function buildRow(words: string[], ids: number[]): Row {
  const offsets: number[] = [];
  let pen = 0;
  for (const id of ids) {
    offsets.push(pen);
    pen += advance(words[id]) + SPACE;
  }
  pen -= SPACE;
  const first = words[ids[0]];
  const last = words[ids[ids.length - 1]];
  const lsb = LSB[code(first[0] ?? " ")] / 1000;
  const rsb = RSB[code(last[last.length - 1] ?? " ")] / 1000;
  return { words: ids, offsets, lsb, ink: Math.max(0.2, pen - lsb - rsb) };
}

/**
 * Groups consecutive words into rows so that, with every row scaled to the
 * full measure, the stack fills the frame height as closely as possible.
 */
function layoutRows(
  words: string[],
  measure: number,
  room: number,
  gap: number,
) {
  const n = words.length;
  let best: Row[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 1 << Math.max(0, n - 1); mask++) {
    const rows: Row[] = [];
    let ids: number[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(i);
      if (i === n - 1 || mask & (1 << i)) {
        rows.push(buildRow(words, ids));
        ids = [];
      }
    }
    const height =
      rows.reduce((h, r) => h + (CAP * measure) / r.ink, 0) +
      gap * (rows.length - 1);
    const score = height > room ? (height - room) * 2.5 : room - height;
    if (score < bestScore) {
      bestScore = score;
      best = rows;
    }
  }
  return best;
}

export function FullBleedType({
  words = ["NO", "DAYS", "OFF", "SHIP"],
  beat = 11,
  theme = "dark",
  speed = 1,
}: FullBleedTypeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const gradId = `fb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const list = words.map((w) => w.trim().toUpperCase()).filter(Boolean);
  const margin = 0.036 * W;
  const lockGap = 0.026 * H;
  const openGap = 0.075 * H;
  const room = H - 2 * 0.07 * H;
  const rows = layoutRows(list, W - 2 * margin, room, lockGap);

  const sizes0 = rows.map((r) => (W - 2 * margin) / r.ink);
  const height0 =
    sizes0.reduce((h, s) => h + CAP * s, 0) + lockGap * (rows.length - 1);
  // Too tall even at the best grouping: shrink the whole stack, keep it centered.
  const fit = Math.min(1, room / height0);
  const sizes = sizes0.map((s) => s * fit);
  const measure = (W - 2 * margin) * fit;
  const left = (W - measure) / 2;

  const lastAt = FIRST_AT + (list.length - 1) * beat;
  const lockAt = lastAt + SLAM_LEN + SETTLE_LEN;
  const lock = LOCK(interpolate(t, [lockAt, lockAt + LOCK_LEN], [0, 1], CLAMP));
  const gap = openGap + (lockGap * fit - openGap) * lock;
  const stackH =
    sizes.reduce((h, s) => h + CAP * s, 0) + gap * (rows.length - 1);

  let y = (H - stackH) / 2;
  const glyphs = rows.flatMap((row, r) => {
    const fs = sizes[r];
    const baseline = y + CAP * fs;
    y = baseline + gap;
    const penX = left - row.lsb * fs;
    return row.words.map((id, j) => {
      const word = list[id];
      const x = penX + row.offsets[j] * fs;
      const w = advance(word) * fs;
      const fromLeft = id % 2 === 0;
      const at = FIRST_AT + id * beat;
      const enter = fromLeft ? -(x + w) - 0.04 * W : W - x + 0.04 * W;
      const over = (fromLeft ? 1 : -1) * 0.011 * W;
      const slam = SLAM(interpolate(t, [at, at + SLAM_LEN], [0, 1], CLAMP));
      const settle = SETTLE(
        interpolate(
          t,
          [at + SLAM_LEN, at + SLAM_LEN + SETTLE_LEN],
          [0, 1],
          CLAMP,
        ),
      );
      const dx = enter + (over - enter) * slam - over * settle;
      return {
        key: `${id}-${word}`,
        word,
        x: x + dx,
        baseline,
        fs,
        hero: id === list.length - 1,
        visible: t >= at,
      };
    });
  });

  // The sunrise sits on the hero word's baseline and climbs a little over the
  // shot, so the word warms up while it holds.
  const hero = glyphs[glyphs.length - 1];
  const heroCap = hero ? CAP * hero.fs : 0;
  const climb = interpolate(t, [lastAt, lockAt + LOCK_LEN + 30], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.3, 1),
  });
  const sunY = hero ? hero.baseline + heroCap * (0.14 - 0.12 * climb) : 0;

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-label={list.join(" ")}
        role="img"
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={sunY}
            x2={0}
            y2={sunY - heroCap * 1.12}
          >
            <stop offset="0" stopColor={c.rise[0]} />
            <stop offset="0.42" stopColor={c.rise[1]} />
            <stop offset="1" stopColor={c.rise[2]} />
          </linearGradient>
        </defs>
        {glyphs.map((g) =>
          g.visible ? (
            <text
              key={g.key}
              x={g.x}
              y={g.baseline}
              fill={g.hero ? `url(#${gradId})` : c.ink}
              fontFamily={display}
              fontWeight={500}
              fontSize={g.fs}
              style={{ letterSpacing: `${TRACK}em`, fontKerning: "normal" }}
            >
              {g.word}
            </text>
          ) : null,
        )}
      </svg>
    </AbsoluteFill>
  );
}
