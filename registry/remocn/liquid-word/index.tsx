"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
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

export interface LiquidWordProps {
  /** The word that melts. */
  from?: string;
  /** The word that re-forms out of the pool, crisp and kerned. */
  to?: string;
  /** Kept for the shared draft API; the molten liquid takes the "swirl" palette. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/**
 * Beat sheet (30fps, speed 1):
 *   0–14   "draft" holds, crisp ink.
 *  12–54   it melts: the swirl gradient floods the letters, edges go soft
 *          and wobble (goo + turbulence), the letters sag and drip.
 *  50–72   the letters slump into one pool along the baseline.
 *  66–98   "shipped" rises out of the pool letter by letter, centre first.
 *  86–112  the liquid sets: wobble and blur run out, the gradient cools
 *          to solid ink.
 * 112–     "shipped" holds, crisp and kerned.
 */
const MELT_AT = 12;
const POOL_AT = 50;
const POOL_END = 72;
const RISE_AT = 66;
const SET_AT = 86;
const CRISP_AT = 112;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);
const GRAVITY = Easing.bezier(0.55, 0, 0.85, 0.6);
const RISE = Easing.bezier(0.2, 1.08, 0.35, 1);
const SETTLE = Easing.bezier(0.33, 0, 0.2, 1);

/** Sora 500 advance widths (per mille) for ASCII 32–126. */
const ADV = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];
/** Sora 500 pair kerning (harfbuzz), per mille: "Ta-35" = T then a. */
const KERN = new Map(
  [
    ",C-35 ,G-35 ,O-35 ,Q-35 ,S-13 ,T-77 ,U-25 ,V-54 ,W-43 ,Y-80 ,c-13",
    ",d-13 ,e-13 ,g-13 ,o-13 ,q-13 ,u-17 ,v-37 ,w-37 ,y-37 -A-10 -C-4",
    "-G-4 -J10 -O-4 -Q-4 -S-9 -T-59 -V-32 -W-23 -X-26 -Y-37 -Z-23 -j-7",
    "-u-1 -v-11 -w-11 -x-27 -y-11 .C-35 .G-35 .O-35 .Q-35 .S-13 .T-77",
    ".U-25 .V-54 .W-43 .Y-80 .c-13 .d-13 .e-13 .g-13 .o-13 .q-13 .u-17",
    ".v-37 .w-37 .y-37 ?,-15 ?--2 ?.-15 A--10 A?-33 AA11 AC-25 AG-25",
    "AJ-2 AO-25 AQ-25 AS-5 AT-59 AU-25 AV-44 AW-32 AX-2 AY-63 Ac-7 Ad-7",
    "Ae-7 Af-5 Ag-7 Al-6 Ao-7 Aq-7 As-2 At-7 Au-7 Av-13 Aw-13 Ay-13 Az-9",
    "B,-12 B--4 B.-12 B?-7 BA-11 BC-4 BG-4 BO-4 BQ-4 BS-7 BT-14 BU-2",
    "BV-12 BW-10 BX-22 BY-28 BZ-16 Bc-4 Bd-4 Be-4 Bg-4 Bo-4 Bq-4 C,-6",
    "C-8 C.-6 CA-6 CT-5 CV-4 CW-3 CX-8 CY-5 CZ-6 Ct16 Cv14 Cw14 Cy14",
    "D,-35 D--4 D.-35 D?-7 DA-25 DS-2 DT-21 DV-9 DW-12 DX-24 DY-25 DZ-18",
    "Dz-4 E--16 E?-6 EC-6 EG-6 EJ-7 EO-6 EQ-6 ES-7 Ec-12 Ed-12 Ee-12",
    "Eg-12 Eo-12 Eq-12 Es-10 Ev-4 Ew-4 Ey-4 F,-73 F--6 F.-73 F?7 FA-45",
    "FC-3 FG-3 FJ-14 FO-3 FQ-3 FS-8 FT10 FV8 FW7 FY6 Fa-19 Fc-11 Fd-11",
    "Fe-11 Fg-11 Fi-7 Fl6 Fm-7 Fn-7 Fo-11 Fq-11 Fr-7 Fs-6 Fu-8 Fx-10",
    "Fz-8 G,-9 G-7 G.-9 G?-7 GA-9 GC-3 GG-3 GO-3 GQ-3 GT-23 GV-10 GW-11",
    "GX-18 GY-23 GZ-16 J,-44 J--19 J.-44 JA-31 JX-11 K,7 K--35 K.7 K?-28",
    "KA-5 KC-43 KG-43 KJ-11 KO-43 KQ-43 KS-29 KT-12 KU-15 KV-9 KW-12 KX1",
    "KY-19 KZ-4 Ka-1 Kc-14 Kd-14 Ke-14 Kg-14 Kj1 Ko-14 Kq-14 Ks-12 Kt-8",
    "Ku-14 Kv-18 Kw-18 Ky-18 L--8 L?-24 LA10 LC-13 LG-13 LJ-3 LO-13",
    "LQ-13 LS-8 LT-71 LU-20 LV-65 LW-53 LY-88 Lc-5 Ld-5 Le-5 Lg-5 Lo-5",
    "Lq-5 Lt-11 Lu-11 Lv-20 Lw-20 Ly-20 O,-35 O--4 O.-35 O?-7 OA-25 OS-2",
    "OT-21 OV-9 OW-12 OX-24 OY-25 OZ-18 Oz-4 P,-115 P--12 P.-115 P?8",
    "PA-52 PJ-12 PS-3 PT-2 PX-26 PY-6 PZ-24 Pa-6 Pc-9 Pd-9 Pe-9 Pf14",
    "Pg-9 Pi3 Pj3 Pm3 Pn3 Po-9 Pq-9 Pr3 Ps-4 Pt18 Pv13 Pw13 Py13 Q,-35",
    "Q--4 Q.-35 Q?-7 QA-25 QS-2 QT-21 QV-9 QW-12 QX-24 QY-25 QZ-18 Qz-4",
    "R--15 R?-4 RC-11 RG-11 RJ-6 RO-11 RQ-11 RS-7 RT-17 RU-5 RV-11 RW-7",
    "RY-27 Rc-10 Rd-10 Re-10 Rg-10 Ro-10 Rq-10 Rs-2 Ru-3 Rv-7 Rw-7 Ry-7",
    "S,-12 S--3 S.-12 S?-7 SA-5 ST-19 SV-15 SW-16 SX-17 SY-26 SZ-14 Sx-7",
    "Sz-4 T,-77 T--59 T.-77 T?4 TA-59 TC-21 TG-21 TJ-42 TO-21 TQ-21",
    "TS-20 TT8 TU-2 TV7 TW14 TX4 TY8 TZ-7 Ta-35 Tc-65 Td-65 Te-65 Tf-7",
    "Tg-65 Ti-31 Tj-3 Tl7 Tm-31 Tn-31 To-65 Tp-30 Tq-65 Tr-31 Ts-50 Tt-4",
    "Tu-45 Tv-44 Tw-44 Tx-31 Ty-44 Tz-52 U,-25 U.-25 UA-25 UT-2 UX-7",
    "UZ-11 V,-54 V--32 V.-54 V?-4 VA-44 VC-9 VG-9 VJ-17 VO-9 VQ-9 VS-11",
    "VT7 VX4 VY11 Va-23 Vc-41 Vd-41 Ve-41 Vg-41 Vi-15 Vl7 Vm-15 Vn-15",
    "Vo-41 Vp-17 Vq-41 Vr-15 Vs-30 Vt6 Vu-13 Vv-4 Vw-4 Vx-17 Vy-4 Vz-16",
    "W,-43 W--23 W.-43 WA-32 WC-12 WG-12 WJ-7 WO-12 WQ-12 WS-9 WT14 WW5",
    "WX2 WY8 WZ-7 Wa-12 Wc-24 Wd-24 We-24 Wg-24 Wi-12 Wl8 Wm-12 Wn-12",
    "Wo-24 Wp-9 Wq-24 Wr-12 Ws-14 Wu-8 Wz-6 X--26 X?-15 XA-2 XC-26 XG-26",
    "XJ-12 XO-26 XQ-26 XS-26 XT4 XU-7 XV4 XW2 XY4 XZ-8 Xa-7 Xc-19 Xd-19",
    "Xe-19 Xg-19 Xi-3 Xm-3 Xn-3 Xo-19 Xp-4 Xq-19 Xr-3 Xs-9 Xt-3 Xu-10",
    "Xv-17 Xw-17 Xy-17 Y,-80 Y--37 Y.-80 YA-63 YC-25 YG-25 YJ-27 YO-25",
    "YQ-25 YS-25 YT8 YV11 YW8 YX4 YZ-13 Ya-36 Yc-56 Yd-56 Ye-56 Yf-6",
    "Yg-56 Yi-18 Yj-6 Yl9 Ym-18 Yn-18 Yo-56 Yp-27 Yq-56 Yr-18 Ys-57 Yt-2",
    "Yu-32 Yv-16 Yw-16 Yx-30 Yy-16 Yz-42 Z--34 ZC-19 ZG-19 ZJ-5 ZO-19",
    "ZQ-19 ZS-17 ZT-2 ZW2 Zc-8 Zd-8 Ze-8 Zg-8 Zi-2 Zm-2 Zn-2 Zo-8 Zp-2",
    "Zq-8 Zr-2 Zs-5 Zu-6 a?-15 av-4 aw-4 ay-4 b,-13 b.-13 b?-18 bv-11",
    "bw-11 bx-12 by-11 bz-5 c,-4 c--2 c.-4 c?-9 cx-2 e,-8 e.-8 e?-14",
    "ev-4 ew-4 ex-2 ey-4 ez-3 f,-43 f--7 f.-43 f?18 fa-2 fc-3 fd-3 fe-3",
    "ff-38 fg-3 fi-2 fj-8 fl12 fm-2 fn-2 fo-3 fq-3 fr-2 ft9 fv17 fw17",
    "fx5 fy17 fz4 h?-25 hv-4 hw-4 hx-1 hy-4 k--21 k?-21 ka-6 kc-15 kd-15",
    "ke-15 kf-7 kg-15 kl-3 ko-15 kq-15 ks-10 ku-6 kv-7 kw-7 ky-7 m?-25",
    "mv-4 mw-4 mx-1 my-4 n?-25 nv-4 nw-4 nx-1 ny-4 o,-13 o.-13 o?-18",
    "ov-11 ow-11 ox-12 oy-11 oz-5 p,-13 p.-13 p?-18 pv-11 pw-11 px-12",
    "py-11 pz-5 q?-9 qj15 r,-61 r--9 r.-61 r?11 ra-2 rc-5 rd-5 re-5 rf3",
    "rg-5 rj7 ro-5 rq-5 rt11 rv18 rw18 rx6 ry18 s,-9 s.-9 s?-23 sv-4",
    "sw-4 sx-5 sy-4 t--19 t?-4 ta-2 tc-3 td-3 te-3 tg-3 tj4 to-3 tq-3",
    "ts-4 tx1 u?-15 v,-37 v--11 v.-37 v?-6 va-5 vc-11 vd-11 ve-11 vg-11",
    "vj6 vo-11 vq-11 vs-4 vt10 vz-5 w,-37 w--11 w.-37 w?-6 wa-5 wc-11",
    "wd-11 we-11 wg-11 wj6 wo-11 wq-11 ws-4 wt10 wz-5 x--27 x?-23 xa-10",
    "xc-12 xd-12 xe-12 xg-12 xj2 xo-12 xq-12 xs-7 xt-4 xu-12 xz-8 y,-37",
    "y--11 y.-37 y?-6 ya-5 yc-11 yd-11 ye-11 yg-11 yj6 yo-11 yq-11 ys-4",
    "yt10 yz-5 z?-10 zc-5 zd-5 ze-5 zg-5 zo-5 zq-5",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const TRACK = -0.02;
const ASC = 0.75;

function code(ch: string) {
  const c = ch.charCodeAt(0);
  return c >= 32 && c < 127 ? c - 32 : 65;
}

interface Letter {
  ch: string;
  x: number;
  adv: number;
}

function layout(word: string) {
  const chars = Array.from(word);
  const letters: Letter[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    if (i > 0) x += (KERN.get(chars[i - 1] + ch) ?? 0) + TRACK;
    const adv = ADV[code(ch)] / 1000;
    letters.push({ ch, x, adv });
    x += adv;
  });
  return { letters, total: x };
}

/** Where a glyph meets the baseline (em from its pen position): drips hang there. */
const FEET: Record<string, number[]> = {
  a: [0.24, 0.5],
  b: [0.14, 0.42],
  c: [0.34],
  d: [0.3, 0.58],
  e: [0.34],
  f: [0.17],
  h: [0.13, 0.53],
  i: [0.16],
  k: [0.13, 0.5],
  l: [0.15],
  m: [0.13, 0.49, 0.85],
  n: [0.13, 0.53],
  o: [0.34],
  p: [0.13, 0.42],
  r: [0.13],
  s: [0.27],
  t: [0.22],
  u: [0.13, 0.52],
  x: [0.1, 0.48],
  z: [0.24],
};

function hash(i: number, salt: number) {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// gradients.sh "swirl" (bg #07060a). Hot at the top, cooling toward the drip
// tips. The light stage drops the palest stop so the liquid keeps its edge.
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    hot: "#ffe2c4",
    liquid: ["#ffe2c4", "#ff9a4d", "#d2456b", "#8a3070"],
    grain: 0.06,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    hot: "#ffb877",
    liquid: ["#ff9a4d", "#e8644e", "#d2456b", "#3a1f6b"],
    grain: 0.04,
  },
} as const;

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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LiquidWord({
  from = "draft",
  to = "shipped",
  theme = "dark",
  speed = 1,
}: LiquidWordProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const A = layout(from);
  const B = layout(to);
  // Each word fits on its own; the pool sits on one shared baseline.
  const fit = (total: number) =>
    Math.min((W * 0.82) / Math.max(total, 1), (H * 0.36) / ASC);
  const fsA = fit(A.total);
  const fsB = fit(B.total);
  const fs = (fsA + fsB) / 2;
  const baseline = H / 2 + 0.36 * fs;
  const leftA = (W - A.total * fsA) / 2;
  const leftB = (W - B.total * fsB) / 2;

  // Liquid state, 0 = crisp ink, 1 = fully molten.
  const melt = interpolate(t, [MELT_AT, MELT_AT + 26], [0, 1], {
    ...CLAMP,
    easing: IN_OUT,
  });
  const set = interpolate(t, [SET_AT, CRISP_AT], [0, 1], {
    ...CLAMP,
    easing: SETTLE,
  });
  const molten = melt * (1 - set);
  const heat =
    interpolate(t, [MELT_AT, MELT_AT + 16], [0, 1], CLAMP) *
    (1 - interpolate(t, [SET_AT + 6, CRISP_AT], [0, 1], CLAMP));
  const pool = interpolate(t, [POOL_AT, POOL_END], [0, 1], {
    ...CLAMP,
    easing: IN_OUT,
  });
  const liquid = t >= MELT_AT && t < CRISP_AT;

  const blur = molten * 0.055 * fs;
  const disp = molten * 0.13 * fs;
  const freqX = (1.3 / fs) * (1 + 0.12 * Math.sin(t * 0.07));
  const freqY = (2.4 / fs) * (1 + 0.12 * Math.cos(t * 0.055));

  // Old word: sags, leans and drips, then slumps into the pool.
  const shapesA = A.letters.map((l, i) => {
    const mid = leftA + (l.x + l.adv / 2) * fsA;
    const toCentre = (W / 2 - mid) * 0.38 * pool;
    const sag = melt * (0.9 + 0.08 * hash(i, 1));
    const sy = (1 - 0.1 * sag) * (1 - 0.9 * pool);
    const sx = 1 + 0.06 * sag + 0.35 * pool;
    const lean = (hash(i, 2) - 0.5) * 10 * melt * (1 - pool);
    return {
      key: `a${i}`,
      ch: l.ch,
      fs: fsA,
      transform: `translate(${mid + toCentre} ${baseline}) skewX(${lean}) scale(${sx} ${sy}) translate(${(-l.adv * fsA) / 2} 0)`,
      visible: pool < 0.97,
    };
  });

  const drips = A.letters.flatMap((l, i) =>
    (FEET[l.ch] ?? [l.adv / 2]).map((foot, j) => {
      const n = i * 4 + j;
      const start = MELT_AT + 8 + i * 3 + hash(n, 3) * 8;
      const grow = GRAVITY(interpolate(t, [start, POOL_AT + 6], [0, 1], CLAMP));
      const len = (0.22 + 0.5 * hash(n, 4)) * fsA * grow * (1 - pool);
      const w = (0.075 + 0.035 * hash(n, 5)) * fsA;
      const mid = leftA + (l.x + l.adv / 2) * fsA;
      const x = leftA + (l.x + foot) * fsA + (W / 2 - mid) * 0.38 * pool;
      return { key: `d${n}`, x, w, len };
    }),
  );

  // New word: rises out of the pool, centre letters first.
  const nB = B.letters.length;
  const shapesB = B.letters.map((l, i) => {
    const mid = leftB + (l.x + l.adv / 2) * fsB;
    const order = Math.abs(i - (nB - 1) / 2);
    const at = RISE_AT + order * 3;
    const k = interpolate(t, [at, at + 20], [0, 1], CLAMP);
    const e = RISE(k);
    const fromCentre = (W / 2 - mid) * 0.38 * (1 - e);
    const sy = 0.1 + 0.9 * e;
    const sx = 1.35 - 0.35 * e;
    return {
      key: `b${i}`,
      ch: l.ch,
      fs: fsB,
      transform: `translate(${mid + fromCentre} ${baseline}) scale(${sx} ${sy}) translate(${(-l.adv * fsB) / 2} 0)`,
      visible: t >= at,
    };
  });

  // The pool: a flat puddle along the baseline between the two words.
  const poolOpen =
    pool * (1 - interpolate(t, [RISE_AT + 8, SET_AT + 6], [0, 1], CLAMP));
  const poolW = Math.max(A.total, B.total) * fs * 0.42 * poolOpen;
  const poolH = 0.1 * fs * poolOpen;

  const fieldTop = baseline - ASC * fs;
  const fieldBottom = baseline + 0.75 * fs;
  const hotX =
    W * (0.32 + 0.36 * interpolate(t, [MELT_AT, CRISP_AT], [0, 1], CLAMP));

  const textProps = {
    fontFamily: display,
    fontWeight: 500,
    style: { fontKerning: "none" as const },
  };

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={t < POOL_END ? from : to}
      >
        {liquid ? (
          <>
            <defs>
              <filter
                id={`${uid}-goo`}
                x={0}
                y={0}
                width={W}
                height={H}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={`${freqX} ${freqY}`}
                  numOctaves={2}
                  seed={7}
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={disp}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="wobble"
                />
                <feGaussianBlur in="wobble" stdDeviation={blur} result="soft" />
                <feColorMatrix
                  in="soft"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                />
              </filter>
              <mask
                id={`${uid}-m`}
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={W}
                height={H}
              >
                <g filter={`url(#${uid}-goo)`}>
                  {shapesA.map((s) =>
                    s.visible ? (
                      <text
                        key={s.key}
                        transform={s.transform}
                        fill="#fff"
                        fontSize={s.fs}
                        {...textProps}
                      >
                        {s.ch}
                      </text>
                    ) : null,
                  )}
                  {drips.map((d) =>
                    d.len > 0.5 ? (
                      <g key={d.key}>
                        <rect
                          x={d.x - d.w / 2}
                          y={baseline - 0.12 * fs}
                          width={d.w}
                          height={0.12 * fs + d.len}
                          rx={d.w / 2}
                          fill="#fff"
                        />
                        <circle
                          cx={d.x}
                          cy={baseline + d.len - d.w * 0.2}
                          r={d.w * 0.78}
                          fill="#fff"
                        />
                      </g>
                    ) : null,
                  )}
                  {poolOpen > 0.01 ? (
                    <ellipse
                      cx={W / 2}
                      cy={baseline - poolH * 0.4}
                      rx={poolW}
                      ry={poolH}
                      fill="#fff"
                    />
                  ) : null}
                  {shapesB.map((s) =>
                    s.visible ? (
                      <text
                        key={s.key}
                        transform={s.transform}
                        fill="#fff"
                        fontSize={s.fs}
                        {...textProps}
                      >
                        {s.ch}
                      </text>
                    ) : null,
                  )}
                </g>
              </mask>
              <linearGradient
                id={`${uid}-liquid`}
                gradientUnits="userSpaceOnUse"
                x1={0}
                y1={fieldTop}
                x2={0}
                y2={fieldBottom}
              >
                {c.liquid.map((col, i) => (
                  <stop
                    key={col}
                    offset={[0, 0.4, 0.68, 1][i]}
                    stopColor={col}
                  />
                ))}
              </linearGradient>
              <radialGradient
                id={`${uid}-hot`}
                gradientUnits="userSpaceOnUse"
                cx={hotX}
                cy={baseline - 0.5 * fs}
                r={0.9 * fs}
              >
                <stop offset="0" stopColor={c.hot} stopOpacity={0.85} />
                <stop offset="1" stopColor={c.hot} stopOpacity={0} />
              </radialGradient>
            </defs>
            <g mask={`url(#${uid}-m)`}>
              <rect width={W} height={H} fill={c.ink} />
              <g opacity={heat}>
                <rect width={W} height={H} fill={`url(#${uid}-liquid)`} />
                <rect width={W} height={H} fill={`url(#${uid}-hot)`} />
              </g>
            </g>
          </>
        ) : (
          (t < MELT_AT ? A : B).letters.map((l, i) => (
            <text
              key={`${i}-${l.ch}`}
              x={
                (t < MELT_AT ? leftA : leftB) + l.x * (t < MELT_AT ? fsA : fsB)
              }
              y={baseline}
              fill={c.ink}
              fontSize={t < MELT_AT ? fsA : fsB}
              {...textProps}
            >
              {l.ch}
            </text>
          ))
        )}
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
