"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface LetterRelayProps {
  word?: string;
  /** Frames per hop; the next letter takes off as the previous one lands. */
  hop?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
  /** Set the leading "r" as the remocn R mark. */
  mark?: boolean;
}

// Manrope 500 advance widths (1/1000 em) for ASCII 32–126.
const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  403, 626, 406, 579, 563, 596, 581, 621, 513, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 641, 630, 600, 708, 616, 949, 623, 575, 631, 413,
  403, 413, 673, 660, 506, 563, 600, 561, 601, 591, 363, 600, 605, 249, 263,
  510, 249, 865, 605, 601, 600, 601, 374, 531, 412, 605, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
// Ink boxes for "!".."~" at weight 500: xMin, yMin, xMax, yMax in 1/1000 em.
const INK_500 = [
  "120,0,209,720 60,540,317,720 60,1,864,720 35,-99,567,820 60,-15,841,735",
  "50,-15,646,734 60,540,149,720 140,-183,393,843 43,-183,295,843 30,381,386,720",
  "60,133,515,588 60,-114,158,113 60,279,360,352 86,0,184,98 60,0,343,720",
  "70,-15,556,735 60,0,286,720 50,1,529,735 40,-14,503,720 50,0,546,720",
  "50,-15,531,720 70,-15,561,735 40,0,463,720 60,-15,531,735 60,-15,551,735",
  "110,75,209,465 110,-114,208,540 140,79,433,552 120,235,630,485 190,79,482,552",
  "50,0,484,735 80,-105,827,645 20,0,626,720 70,0,590,720 30,-15,683,735",
  "70,0,636,720 70,0,525,720 70,0,490,720 30,-15,684,735 70,0,627,720",
  "80,0,169,720 0,-14,396,720 70,0,612,720 80,0,503,720 70,0,776,720",
  "70,0,626,720 30,-15,702,735 70,0,586,720 30,-15,702,735 70,0,601,720",
  "35,-15,595,735 10,0,590,720 70,-15,638,720 5,0,611,720 15,0,934,720",
  "10,0,613,720 0,0,575,720 50,0,581,720 140,-216,338,891 60,0,343,720",
  "75,-216,273,891 106,443,579,736 0,-111,660,-38 169,803,307,968 40,-15,503,555",
  "70,-15,560,720 40,-15,529,555 40,-15,531,720 40,-15,550,555 30,0,353,735",
  "40,-255,530,555 70,0,545,720 80,0,169,728 -10,-240,188,728 70,0,530,720",
  "80,0,169,735 70,0,805,554 70,0,545,554 40,-15,561,555 70,-240,560,555",
  "40,-240,531,555 70,0,349,544 40,-14,490,555 10,-8,372,690 60,-14,535,540",
  "20,0,503,540 20,0,759,541 10,0,526,540 15,-240,526,540 20,0,491,540",
  "140,-216,387,891 90,0,179,720 43,-216,290,891 114,224,566,406",
]
  .join(" ")
  .split(" ")
  .map((box) => box.split(",").map((v) => Number(v) / 1000));
// Kerning pairs (1/1000 em to tighten; negative values loosen).
const KERN_PAIRS = [
  "AA-35 AC20 AG20 AO20 AQ20 AS20 AT60 AU20 AV70 AW70 AY60 Af25 At20",
  "Av40 Aw40 Ay50 BT20 BV30 BW30 BX30 BY30 B.30 B,30 CA20 CS-30 CV20",
  "CW20 CX30 CY30 C.50 C,50 DA20 DT20 DV30 DW30 DX30 DY30 DZ12 D.50 D,50",
  "EC25 EG30 EO30 EQ30 ES20 FA10 FJ25 Fa20 Fc15 Fd15 Fe15 Fo15 Fq20",
  "F.115 F,115 GA20 GT20 GV30 GW30 GX30 GY30 G.50 G,50 IY40 JA20 J.50",
  "J,50 KC15 KG35 KO35 KQ30 KS30 Kc40 Kd40 Ke40 Kg30 Ko40 Kq35 Ks20 Kt31",
  "Ku35 Ky45 LG20 LO20 LQ20 LT100 LV80 LW80 LY100 Lf20 Lt25 Lv35 Lw35",
  "Ly50 OA20 OT20 OV30 OW30 OX50 OY30 Ox20 O.50 O,50 PA50 PJ25 PX30 Pa20",
  "Pf-40 P.160 P,160 QA20 QT20 QV30 QW30 QX30 QY30 Qx20 Q.30 Q,30 RC15",
  "RY12 SS-15 SV20 SW20 SX30 SY30 Sy10 S.25 S,25 TA20 TJ80 TT-60 TY-30",
  "Ta70 Tc80 Td80 Te80 Tg80 Tm50 Tn50 To80 Tp50 Tq80 Tr50 Ts60 Tu50 Tv60",
  "Tw60 Tx70 Ty70 Tz60 T.100 T,100 UA30 US30 U.20 U,20 VA70 VC20 VG20",
  "VJ30 VO20 VQ20 VS20 Va45 Vc60 Vd60 Ve60 Vg45 Vi20 Vl20 Vm30 Vn30 Vo60",
  "Vp30 Vq45 Vs30 Vu30 Vv30 Vw30 Vx30 Vz20 V.60 V,60 WA70 WC20 WG20 WJ30",
  "WO20 WQ20 WS20 Wa45 Wc60 Wd60 We60 Wg45 Wi20 Wl20 Wm30 Wn30 Wo60 Wp30",
  "Wq45 Ws30 Wu30 Wv30 Ww30 Wx30 Wz20 W.60 W,60 XC30 XG30 XO30 XQ30 XS20",
  "XT-40 Xc20 Xd20 Xe20 Xo20 YA70 YC40 YG40 YI25 YJ80 YO40 YQ40 YS30",
  "YT-30 YX20 YY-31 Ya80 Yb25 Yc80 Yd80 Ye80 Yg80 Ym50 Yn50 Yo80 Yp50",
  "Yq80 Yr40 Ys80 Yu40 Yv35 Yw35 Yx30 Yy35 Yz35 Y.140 Y,140 ZT-40 Zv60",
  "Zw60 aT60 aV30 aW30 aY60 av20 aw20 ay30 bT60 bV30 bW30 bX20 bY80 bv20",
  "bw20 bx20 by30 bz20 b.20 b,20 cT60 cV30 cW30 cY60 cc15 cd15 ce15 ci15",
  "cl15 co15 cy20 c.20 c,20 dY40 eT60 eV30 eW30 eY60 ea10 em15 en15 ep15",
  "ev20 ew20 ex20 ey10 e.20 e,20 fI-31 fT-60 fa15 fb-31 fc20 fd20 fe20",
  "fh-31 fi-15 fk-31 fl-15 fo20 f.50 f,50 gT50 gY50 hT60 kc10 kd10 ke10",
  "ko10 kq30 ks10 mT60 mY70 my20 nT60 nY70 ny20 oT60 oV30 oW30 oX20 oY80",
  "ov20 ow20 ox12 oy20 oz20 o.20 o,20 pT60 pV30 pW30 pX20 pY80 pv20 pw20",
  "px12 py20 pz20 p.20 p,20 qY40 rY20 ra17 rc10 rd10 re10 rg20 ro10 rs20",
  "ry10 r.80 r,80 sT50 sV30 sW30 sY60 sv20 sw20 sx20 sy20 tY20 tc22 td22",
  "te22 to22 ty15 uY40 vA20 vT60 vY35 va30 vc20 vd20 ve20 vg20 vo20 vq20",
  "vs20 v.80 v,80 wA20 wT60 wY35 wa30 wc20 wd20 we20 wg20 wo20 wq20 ws20",
  "w.80 w,80 xT50 xY30 xa20 xc20 xd20 xe20 xg20 xo20 xq20 xv10 xw10 yA15",
  "yT40 yY35 ya20 yc20 yd20 ye20 yf-40 yg15 yo20 yt-40 y.80 y,80 zT50",
  "zY35 za30 zc40 zd40 ze40 zo40 zq30 zy15",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000]),
);
const TRACK = -0.03;
const LOOSE = 0.07;
// Manrope typo metrics (USE_TYPO_METRICS): ascender 2132, descender 600 / 2000.
const ASC = 1.066;
const LINE = 1.366;

// The remocn R mark, sized as in the site logo: 0.76em tall on the baseline,
// 0.04em of air before the next letter.
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_H = 0.76;
const R_W = (R_H * 124.06) / 134.26;
const R_GAP = 0.04;

const HOP_AT = 20;
const LIFT = 0.24;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam" palette: #f4f7ff, #8fb4ff, #3d5bff, #1a1660 on #02030a.
// It lights a floor the letters land on.
const THEMES = {
  dark: {
    bg: "#02030A",
    fg: "#F4F5F8",
    floor: [
      "rgba(143,180,255,0.62)",
      "rgba(61,91,255,0.5)",
      "rgba(26,22,96,0.55)",
      "rgba(2,3,10,0)",
    ],
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    floor: [
      "rgba(61,91,255,0.6)",
      "rgba(143,180,255,0.62)",
      "rgba(143,180,255,0.3)",
      "rgba(143,180,255,0.1)",
    ],
    grain: 0.045,
  },
} as const;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? MANROPE_500[code - 32] : 620) / 1000;
}

function inkCenter(ch: string) {
  const code = ch.charCodeAt(0);
  const box = code > 32 && code < 127 ? INK_500[code - 33] : null;
  return box ? (box[0] + box[2]) / 2 : advance(ch) / 2;
}

/** Landing squash: a one-frame hit, then a damped return with a hair of overshoot. */
function squash(d: number) {
  if (d < 0 || d > 14) return 0;
  if (d < 1) return d;
  const k = d - 1;
  return Math.exp(-k / 2.4) * Math.cos(k * 0.62);
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LetterRelay({
  word = "remocn",
  hop = 10,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
  mark = true,
}: LetterRelayProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const chars = useMemo(() => Array.from(word), [word]);
  const n = chars.length;
  const useMark = mark && (chars[0] === "r" || chars[0] === "R");
  const isMark = (i: number) => useMark && i === 0;

  const layout = useMemo(() => {
    const xs: number[] = [];
    let x = 0;
    chars.forEach((ch, i) => {
      if (i > 0 && !(useMark && i === 1)) x += KERN.get(chars[i - 1] + ch) ?? 0;
      xs.push(x);
      x += useMark && i === 0 ? R_W + R_GAP - TRACK : advance(ch) + TRACK;
    });
    const total = x - TRACK;
    const tight = xs.map((v) => v - total / 2);
    const spread = (n - 1) * LOOSE;
    const loose = tight.map((v, i) => v + i * LOOSE - spread / 2);
    return { tight, loose, wide: total + spread };
  }, [chars, n, useMark]);

  const F = Math.min(H * 0.34, (W * 0.66) / Math.max(layout.wide, 0.1));
  const baseline = H / 2 + F * 0.3;

  const lastLand = HOP_AT + n * hop;
  const settle = interpolate(t, [lastLand + 1, lastLand + 19], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  // The beam pool drifts a little toward whichever letter is in the air.
  const active = Math.min(n - 1, Math.max(0, (t - HOP_AT) / hop));
  const lo = Math.floor(active);
  const hi = Math.min(n - 1, lo + 1);
  const xAt = (i: number) =>
    layout.loose[i] + (layout.tight[i] - layout.loose[i]) * settle;
  const activeX = xAt(lo) + (xAt(hi) - xAt(lo)) * (active - lo);
  const drift = interpolate(t, [lastLand, lastLand + 30], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const poolX = 50 + ((activeX * F) / W) * 100 * 0.22 * drift;
  const floorTop = baseline + F * 0.09;
  const mask = `radial-gradient(58% 140% at ${poolX}% 0%, #000 35%, transparent 100%)`;
  const poolIn = interpolate(t, [0, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: floorTop,
          bottom: 0,
          opacity: poolIn,
          background: `linear-gradient(180deg, ${c.floor[0]} 0%, ${c.floor[1]} 4%, ${c.floor[2]} 38%, ${c.floor[3]} 100%)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: baseline,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: F,
          fontKerning: "none",
        }}
      >
        {chars.map((ch, i) => {
          const last = i === n - 1;
          const start = HOP_AT + i * hop;
          const land = start + hop;

          const enter = interpolate(t, [i * 2, i * 2 + 14], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });

          const p = interpolate(t, [start, land], [0, 1], CLAMP);
          const air = p > 0 && p < 1;
          const lift = F * LIFT * (last ? 1.25 : 1);
          const arc = air ? 4 * p * (1 - p) : 0;

          const crouch = interpolate(t, [start - 3, start], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const release = interpolate(p, [0, 0.2], [1, 0], CLAMP);
          const stretch = air ? 0.11 * Math.sin(Math.PI * p) * (1 - p) : 0;
          const hit = squash(t - land) * 0.085;
          const sy = 1 - 0.06 * crouch * release + stretch - hit;
          const sx = 1 + 0.04 * crouch * release - stretch * 0.6 + hit * 0.7;

          const rot = air ? 5 * Math.sin(Math.PI * p) * (1 - 0.35 * p) : 0;

          const take = interpolate(t, [start - 2, start + 2], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const give = last
            ? 0
            : interpolate(t, [land - 1, land + 5], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
          const color = interpolateColors(
            take * (1 - give),
            [0, 1],
            [c.fg, accent],
          );

          const ox = isMark(i) ? R_W / 2 : inkCenter(ch);
          const x = (xAt(i) + ox) * F;
          const y = -lift * arc + (1 - enter) * F * 0.16;

          return (
            <div
              key={`${i}-${ch}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                color,
                opacity: enter,
                transformOrigin: "0 0",
                transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
              }}
            >
              {isMark(i) ? (
                <svg
                  viewBox="0 0 124.06 134.26"
                  width={R_W * F}
                  height={R_H * F}
                  style={{
                    position: "absolute",
                    left: -ox * F,
                    top: -R_H * F,
                    display: "block",
                  }}
                  aria-hidden
                >
                  <path fill="currentColor" d={REMOCN_R_PATH} />
                </svg>
              ) : (
                <span
                  style={{
                    position: "absolute",
                    left: -ox * F,
                    top: -ASC * F,
                    lineHeight: LINE,
                    whiteSpace: "pre",
                  }}
                >
                  {ch}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
