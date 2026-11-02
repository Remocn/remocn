"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface TitleConvergeProps {
  /**
   * Short word. Each letter drifts in on its own path. "remocn" (any case)
   * is set as the real logo: the R mark followed by "emocn".
   */
  word?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/** Manrope 500 advance widths (per mille) for ASCII 32–126. */
const ADV = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
/** Manrope 500 letter kerning: "AT60" = A then T, -60/1000 em ("+" widens). */
const KERN = new Map<string, number>();
for (const tok of [
  "AA+35 AT60 AV70 AW70 AY60 Av40 Aw40 Ay50 BV30 BW30 BX30 BY30 CS+30",
  "CX30 CY30 DV30 DW30 DX30 DY30 EG30 EO30 EQ30 GV30 GW30 GX30 GY30 IY40",
  "KG35 KO35 KQ30 KS30 Kc40 Kd40 Ke40 Kg30 Ko40 Kq35 Kt31 Ku35 Ky45 LT100",
  "LV80 LW80 LY100 Lv35 Lw35 Ly50 OV30 OW30 OX50 OY30 PA50 PX30 Pf+40",
  "QV30 QW30 QX30 QY30 SX30 SY30 TJ80 TT+60 TY+30 Ta70 Tc80 Td80 Te80",
  "Tg80 Tm50 Tn50 To80 Tp50 Tq80 Tr50 Ts60 Tu50 Tv60 Tw60 Tx70 Ty70 Tz60",
  "UA30 US30 VA70 VJ30 Va45 Vc60 Vd60 Ve60 Vg45 Vm30 Vn30 Vo60 Vp30 Vq45",
  "Vs30 Vu30 Vv30 Vw30 Vx30 WA70 WJ30 Wa45 Wc60 Wd60 We60 Wg45 Wm30 Wn30",
  "Wo60 Wp30 Wq45 Ws30 Wu30 Wv30 Ww30 Wx30 XC30 XG30 XO30 XQ30 XT+40 YA70",
  "YC40 YG40 YJ80 YO40 YQ40 YS30 YT+30 YY+31 Ya80 Yc80 Yd80 Ye80 Yg80",
  "Ym50 Yn50 Yo80 Yp50 Yq80 Yr40 Ys80 Yu40 Yv35 Yw35 Yx30 Yy35 Yz35 ZT+40",
  "Zv60 Zw60 aT60 aV30 aW30 aY60 ay30 bT60 bV30 bW30 bY80 by30 cT60 cV30",
  "cW30 cY60 dY40 eT60 eV30 eW30 eY60 fI+31 fT+60 fb+31 fh+31 fk+31 gT50",
  "gY50 hT60 kq30 mT60 mY70 nT60 nY70 oT60 oV30 oW30 oY80 pT60 pV30 pW30",
  "pY80 qY40 sT50 sV30 sW30 sY60 uY40 vT60 vY35 va30 wT60 wY35 wa30 xT50",
  "xY30 yT40 yY35 yf+40 yt+40 zT50 zY35 za30 zc40 zd40 ze40 zo40 zq30",
]
  .join(" ")
  .split(" ")) {
  const m = /^(.)(.)(\+?)(\d+)$/.exec(tok);
  if (m) KERN.set(m[1] + m[2], ((m[3] ? 1 : -1) * Number(m[4])) / 1000);
}
const TRACK = -0.03;
const CAP = 0.72;
const ASCENDER = 0.75;
const X_HEIGHT = 0.54;

/** The real remocn "R" mark (viewBox 124.06 × 134.26). */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
/** As on remocn.dev: the mark is 0.76em tall and sits 0.04em before "emocn". */
const MARK_H = 0.76;
const MARK_W = (MARK_H * 124.06) / 134.26;
const MARK_GAP = 0.04;
/**
 * The logo word is the brand asset, so it keeps the logo's Manrope 600,
 * -0.025em tracking and kerning; every other word is set in Manrope 500.
 */
const LOGO_ADV: Record<string, number> = {
  e: 0.596,
  m: 0.882,
  o: 0.61,
  c: 0.568,
  n: 0.615,
};
const LOGO_KERN: Record<string, number> = { em: -0.015, mo: -0.006 };
const LOGO_TRACK = -0.025;

/** Frame the camera finishes easing out and the last letter locks. */
const LOCK = 128;
const RULES = 116;

const DRIFT = Easing.bezier(0.3, 0.3, 0.2, 1);
const CAMERA = Easing.bezier(0.4, 0, 0.3, 1);
const SLIDE = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Fill gradients: gradients.sh "beam" on dark, its deep end on light.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    fill: ["#F4F7FF", "#B9CCFF", "#7E9BFF", "#4F6BFF"],
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    fill: ["#1A1660", "#2B2FA8", "#3D5BFF", "#6A6BF0"],
    grain: 0.045,
  },
} as const;

function hash(i: number, salt: number) {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? ADV[code - 32] : 620) / 1000;
}

function heightOf(ch: string) {
  if (/[A-Z0-9]/.test(ch)) return CAP;
  if (/[bdfhklt]/.test(ch)) return ASCENDER;
  return X_HEIGHT;
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

interface Letter {
  ch: string;
  mark: boolean;
  left: number;
  width: number;
}

export function TitleConverge({
  word = "remocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TitleConvergeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  // Kerned layout in em. The logo word swaps its "r" for the R mark.
  const layout = useMemo(() => {
    const isLogo = word.trim().toLowerCase() === "remocn";
    const chars = Array.from(isLogo ? "Remocn" : word);
    const letters: Letter[] = [];
    let x = 0;
    let top = 0;
    chars.forEach((ch, i) => {
      const mark = isLogo && i === 0;
      const pair = chars[i - 1] + ch;
      if (i > 0 && !letters[i - 1].mark) {
        x += (isLogo ? LOGO_KERN[pair] : KERN.get(pair)) ?? 0;
      }
      const width = mark
        ? MARK_W
        : isLogo
          ? (LOGO_ADV[ch] ?? advance(ch))
          : advance(ch);
      letters.push({ ch, mark, left: x, width });
      top = Math.max(top, mark ? MARK_H : heightOf(ch));
      const track = i < chars.length - 1 ? (isLogo ? LOGO_TRACK : TRACK) : 0;
      x += mark ? MARK_W + MARK_GAP : width + track;
    });
    return { letters, total: x, top, weight: isLogo ? 600 : 500 };
  }, [word]);
  const { letters } = layout;
  const n = letters.length;

  const F = Math.min((W * 0.66) / layout.total, (H * 0.32) / layout.top);
  const half = (layout.total * F) / 2;
  const left = (i: number) => letters[i].left * F - half;
  const topH = layout.top * F;
  const baseline = topH / 2;

  // Each letter: a straight path in from off-frame, its own length and speed.
  const paths = useMemo(
    () =>
      letters.map((_, i) => {
        const side = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        const vertical = i % 2 === 0 ? -1 : 1;
        const outer = Math.abs(side);
        const dx = side * (0.12 + outer * 0.6 + hash(i, 1) * 0.15);
        const dy = vertical * (0.2 + hash(i, 2) * 0.18 + outer * 0.25);
        return {
          dx,
          dy,
          end: LOCK - 30 + outer * 26 + hash(i, 3) * 6,
        };
      }),
    [letters, n],
  );

  const s0 = 5;
  const cam = interpolate(t, [0, LOCK], [0, 1], { ...CLAMP, easing: CAMERA });
  const push = interpolate(t, [LOCK, LOCK + 70], [0, 1], CLAMP);
  const s = Math.exp(Math.log(s0) * (1 - cam)) * (1 + push * 0.014);
  // Start framed on the middle of the word, a touch above centre.
  const focusY = -topH * 0.12 * (1 - cam);

  const ruleGap = topH * 0.34;
  const ruleH = Math.max(1.5, 2.5 * u);
  const ruleW = layout.total * F + 0.02 * F;
  const slide = (d: number) =>
    interpolate(t, [RULES + d, RULES + d + 26], [0, 1], {
      ...CLAMP,
      easing: SLIDE,
    });
  const topIn = slide(0);
  const bottomIn = slide(5);
  const travel = W / (2 * s) + ruleW / 2 + 8 * u;
  const uid = `tc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // The fill gradient lives in word space and turns a few degrees over the
  // shot; letters drift through it and lock into one continuous sweep.
  const angle = ((-16 + t * 0.05) * Math.PI) / 180;
  const reach = half * 1.08;
  const gx = Math.cos(angle) * reach;
  const gy = Math.sin(angle) * reach;
  const markScale = (MARK_H * F) / 134.26;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <g transform={`translate(${W / 2} ${H / 2}) scale(${s})`}>
          <g transform={`translate(0 ${-focusY})`}>
            {letters.map((l, i) => {
              const p = paths[i];
              const k = DRIFT(Math.min(1, Math.max(0, t / p.end)));
              const off = (1 - k) * F;
              const ox = left(i) + p.dx * off;
              const oy = baseline + p.dy * off;
              const flood = interpolate(t, [p.end - 16, p.end + 2], [0, 1], {
                ...CLAMP,
                easing: Easing.bezier(0.45, 0, 0.25, 1),
              });
              const line = interpolate(t, [p.end, p.end + 10], [1, 0], CLAMP);
              const glyphTop = -(l.mark ? MARK_H : heightOf(l.ch)) * F;
              const top = glyphTop - 0.04 * F;
              const bottom = 0.04 * F;
              const edge = bottom + (top - bottom) * flood;
              const shape = (props: Record<string, string | number>) =>
                l.mark ? (
                  <path
                    d={REMOCN_R_PATH}
                    transform={`translate(0 ${-MARK_H * F}) scale(${markScale})`}
                    {...props}
                    strokeWidth={
                      props.strokeWidth
                        ? Number(props.strokeWidth) / markScale
                        : undefined
                    }
                  />
                ) : (
                  <text
                    x={0}
                    y={0}
                    fontFamily={display}
                    fontWeight={layout.weight}
                    fontSize={F}
                    style={{ fontKerning: "none" }}
                    {...props}
                  >
                    {l.ch}
                  </text>
                );
              return (
                <g key={`${i}-${l.ch}`} transform={`translate(${ox} ${oy})`}>
                  <defs>
                    <linearGradient
                      id={`${uid}-f${i}`}
                      gradientUnits="userSpaceOnUse"
                      x1={-gx - ox}
                      y1={-gy - oy}
                      x2={gx - ox}
                      y2={gy - oy}
                    >
                      {c.fill.map((col, j) => (
                        <stop
                          key={col}
                          offset={j / (c.fill.length - 1)}
                          stopColor={col}
                        />
                      ))}
                    </linearGradient>
                    <clipPath id={`${uid}-${i}`}>
                      <rect
                        x={-0.2 * F}
                        y={edge}
                        width={F * 1.6}
                        height={Math.max(0, bottom - edge)}
                      />
                    </clipPath>
                  </defs>
                  {line > 0 ? (
                    <>
                      {/* Outline of the glyph's union: the variable font's
                          overlapping contours would show inside a plain stroke. */}
                      <mask
                        id={`${uid}-m${i}`}
                        maskUnits="userSpaceOnUse"
                        x={-F}
                        y={-2 * F}
                        width={3 * F}
                        height={3 * F}
                      >
                        {shape({
                          fill: "black",
                          stroke: "white",
                          strokeWidth: (3 * u) / s,
                          strokeLinejoin: "miter",
                          paintOrder: "stroke",
                        })}
                      </mask>
                      <rect
                        x={-F}
                        y={-2 * F}
                        width={3 * F}
                        height={3 * F}
                        fill={c.fg}
                        opacity={line * 0.9}
                        mask={`url(#${uid}-m${i})`}
                      />
                    </>
                  ) : null}
                  {flood > 0 ? (
                    <g clipPath={`url(#${uid}-${i})`}>
                      {shape({ fill: `url(#${uid}-f${i})` })}
                    </g>
                  ) : null}
                </g>
              );
            })}
            <rect
              x={-ruleW / 2 - (1 - topIn) * travel}
              y={-topH + baseline - ruleGap - ruleH / s}
              width={ruleW}
              height={ruleH / s}
              fill={accent}
            />
            <rect
              x={-ruleW / 2 + (1 - bottomIn) * travel}
              y={baseline + ruleGap}
              width={ruleW}
              height={ruleH / s}
              fill={accent}
            />
          </g>
        </g>
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
