"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface WrappedSquashProps {
  /** Two or three short lines. Set in caps; each line fills its own block. */
  lines?: string[];
  accent?: string;
  /** A bolder two-color pair, e.g. `["#FF4632", "#FFD2F2"]`. Replaces the gradient palette. */
  colors?: [string, string];
  theme?: "dark" | "light";
  speed?: number;
}

// Bricolage Grotesque 500, per 1000 em, chars 32–126 (harfbuzz).
const ADV = [
  246, 266, 317, 613, 630, 947, 756, 159, 305, 290, 395, 516, 165, 339, 196,
  354, 656, 320, 583, 595, 595, 600, 646, 494, 646, 641, 207, 188, 516, 516,
  516, 413, 952, 671, 666, 671, 691, 599, 578, 706, 709, 275, 358, 666, 508,
  909, 747, 716, 629, 719, 660, 641, 553, 718, 657, 957, 653, 600, 560, 315,
  342, 300, 547, 578, 283, 567, 618, 555, 617, 570, 380, 589, 608, 260, 266,
  561, 257, 913, 608, 604, 618, 617, 411, 535, 380, 599, 547, 827, 534, 591,
  500, 353, 260, 331, 516,
];
const LSB = [
  0, 59, 28, 23, 50, 30, 32, 28, 63, 8, 12, 60, 3, 33, 24, -1, 59, 33, 47, 30,
  27, 56, 59, 26, 54, 57, 29, 4, 60, 60, 60, 22, 61, 26, 82, 59, 82, 82, 82, 59,
  82, 82, 11, 82, 82, 82, 82, 59, 82, 59, 82, 50, 23, 77, 26, 31, 30, 11, 35,
  82, -13, 13, 17, 0, 20, 46, 75, 47, 48, 47, 27, 32, 75, 58, -28, 75, 75, 75,
  75, 47, 75, 48, 75, 42, 19, 67, 17, 22, 20, 54, 36, 29, 82, 2, 42,
];
const RSB = [
  0, 57, 28, 23, 48, 29, 40, 28, 23, 63, 12, 60, 24, 33, 23, -1, 57, 81, 48, 49,
  29, 55, 55, 26, 55, 58, 28, 25, 60, 60, 60, 24, 61, 25, 54, 38, 58, 39, 27,
  62, 82, 82, 81, 34, 18, 82, 82, 57, 36, 58, 44, 48, 22, 76, 26, 30, 27, 11,
  34, 24, -1, 78, 17, 0, 76, 58, 47, 23, 74, 40, 15, 33, 66, 58, 57, 20, 75, 68,
  66, 46, 48, 74, 18, 40, 33, 74, 17, 22, 19, 73, 35, 22, 83, 27, 43,
];
const KERN = new Map(
  [
    "AA16 AC-25 AG-24 AJ21 AO-25 AQ-15 AT-67 AU-26 AV-83 AW-53 AY-78 AZ20",
    "A0-22 A1-26 A6-22 A7-31 A.28 A,25 A’-59 BV-18 BX-17 BY-20 CS16 CX-17",
    "CY-16 C318 C424 DA-27 DJ-17 DT-25 DV-24 DX-40 DY-32 DZ-15 D7-25 D.-18",
    "D,-25 EC-15 EG-15 EJ32 EO-15 ET23 EW19 EX19 EY22 EZ27 E317 E728 E.27",
    "E,26 FA-46 FJ-41 FT40 FV23 FW29 FY31 FZ18 F735 F.-59 F,-57 F’17 GJ19",
    "GV-20 GY-23 G420 G,18 G-20 JA-23 J,-15 KC-24 KG-24 KJ16 KO-24 KT15",
    "KX24 KZ29 K0-21 K216 K6-21 K722 K.22 K,18 K--25 LA26 LC-18 LG-17 LJ57",
    "LO-18 LT-74 LU-17 LV-74 LW-45 LX16 LY-87 LZ41 L0-16 L1-24 L229 L6-16",
    "L7-27 L.42 L,50 L’-83 L--80 OA-25 OT-22 OV-25 OX-38 OY-31 O7-25 O.-15",
    "O,-21 PA-43 PJ-48 PX-20 P.-60 P,-66 P’21 QQ18 QT-22 QV-25 QY-31 Q7-25",
    "Q,21 RV-15 RY-16 RZ17 R.15 R--19 SV-20 SY-20 S317 S419 TA-67 TC-25",
    "TG-23 TJ-47 TO-23 TQ-23 TT44 TV27 TW31 TX16 TY33 TZ21 T0-18 T4-66",
    "T6-18 T739 T.-62 T,-60 T’18 T--81 UA-26 U.-15 U,-20 VA-83 VC-26 VG-24",
    "VJ-47 VO-25 VQ-25 VT27 VV19 VW31 VY29 V0-22 V4-44 V6-22 V724 V8-16",
    "V.-60 V,-57 V’22 V--35 WA-55 WC-15 WJ-40 WT31 WV31 WW30 WY26 WZ16",
    "W4-25 W724 W.-39 W,-43 W’22 W--22 XC-38 XG-39 XJ17 XO-39 XX17 XZ21",
    "X0-34 X4-19 X6-34 X9-19 X.18 X,15 X--47 YA-78 YC-33 YG-32 YJ-46 YO-32",
    "YQ-32 YT33 YV29 YW26 YY38 YZ15 Y0-29 Y4-66 Y6-29 Y733 Y8-16 Y.-75",
    "Y,-72 Y’26 Y--57 ZA17 ZC-15 ZG-16 ZJ40 ZO-16 ZT27 ZV19 ZW21 ZX20 ZY20",
    "ZZ31 Z224 Z727 Z.30 Z,32 Z’21 Z--49 0A-24 0T-19 0V-22 0X-34 0Y-29",
    "07-20 0,-19 2J21 2Z15 2.21 2,17 2--22 3315 3420 4T-18 4V-17 4Y-15",
    "41-16 4431 47-16 4’-15 5418 6V-21 6X-21 6Y-22 6415 7A-72 7C-15 7G-15",
    "7J-44 7O-15 7Q-15 7T44 7V27 7W30 7X16 7Y34 7Z21 7118 74-60 7740 7.-68",
    "7,-65 7’35 7--55 8V-17 8Y-17 9A-24 9T-20 9V-22 9X-34 9Y-29 97-21 9,-17",
    ".A28 .J45 .T-62 .U-15 .V-60 .W-37 .X16 .Y-76 .Z38 .1-18 .227 .7-22",
    "..26 .’-87 .--38 ,0-17 ,1-18 ,232 ,6-15 ,7-21 ,’-82 ,--30 ’A-70 ’C-17",
    "’G-17 ’J-49 ’O-15 ’Q-17 ’T34 ’V32 ’W33 ’X23 ’Y41 ’Z15 ’119 ’4-66 ’730",
    "’.-87 ’,-82 ’’22 ’--76 -J-30 -T-80 -V-34 -W-21 -X-48 -Y-57 -Z-16 -1-25",
    "-2-26 -417 -7-47 -.-38 -,-35 -’-74",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.66;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_BEAT = Easing.bezier(0.76, 0, 0.18, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// One gradients.sh palette per theme, laid as a single field across the whole
// frame: odd blocks are windows onto it, even blocks are solid and let the field
// through their letters. Dark = radial-glow (+ accent), light = ribbon.
const THEMES = {
  dark: {
    stage: "#08080C",
    field: ["", "#5A46CB", "#1D1240"],
    glow: "#9DB4FF",
    glowAlpha: 0.6,
    solid: "#F3F1FF",
    onField: "#F3F1FF",
    grain: 0.1,
  },
  light: {
    stage: "#F5F4F0",
    field: ["#7A5CFF", "#FF3D9A", "#FF8A3D"],
    glow: "#FFFFFF",
    glowAlpha: 0.34,
    solid: "#0A0A0B",
    onField: "#FFFFFF",
    grain: 0.08,
  },
} as const;

function code(ch: string) {
  const c = ch.charCodeAt(0);
  return c >= 32 && c < 127 ? c - 32 : 33;
}

/** Advance width plus the ink box of a line, in em. */
function measure(text: string) {
  let adv = 0;
  for (let i = 0; i < text.length; i++) {
    adv += ADV[code(text[i])] / 1000;
    if (i > 0) adv += KERN.get(text[i - 1] + text[i]) ?? 0;
  }
  const lsb = LSB[code(text[0] ?? " ")] / 1000;
  const rsb = RSB[code(text[text.length - 1] ?? " ")] / 1000;
  return { adv, lsb, ink: Math.max(0.2, adv - lsb - rsb) };
}

/** Stage n shows lines 0..n; the newest line arrives loud and squeezes the rest. */
function weights(inks: number[], visible: number, final: boolean) {
  return inks.map((ink, i) => {
    if (i >= visible) return 0;
    const balanced = 1 / ink;
    if (final || visible === 1) return balanced;
    return i === visible - 1 ? balanced * 1.75 : balanced * 0.7;
  });
}

function normalize(w: number[]) {
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((v) => v / sum);
}

export function WrappedSquash({
  lines = ["YOU", "SHIPPED", "A LOT"],
  accent = "#3B5BFD",
  colors,
  theme = "dark",
  speed = 1,
}: WrappedSquashProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const t = THEMES[theme];

  const rows = lines
    .slice(0, 3)
    .map((l) => l.toUpperCase().replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const n = Math.max(1, rows.length);
  const metrics = rows.map(measure);
  const inks = metrics.map((m) => m.ink);

  const field = t.field.map((c, i) =>
    theme === "dark" && i === 0 ? accent : c,
  );
  // Flat two-color override: blocks alternate the pair, no field.
  const flat = colors
    ? (i: number) =>
        i % 2 === 0
          ? { bg: colors[0], fg: colors[1] }
          : { bg: colors[1], fg: colors[0] }
    : null;

  // Beats: line 1 grows in, each next line arrives on a beat, then the lock.
  const BEATS = [26, 52].slice(0, n - 1);
  const LOCK = 26 + 26 * (n - 1);
  const intro = interpolate(frame, [0, 16], [0.46, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const stages = [
    ...Array.from({ length: n }, (_, s) =>
      normalize(weights(inks, s + 1, false)),
    ),
    normalize(weights(inks, n, true)),
  ];
  // How far each line has arrived (0..1), drives its gutter.
  const arrive = rows.map((_, i) =>
    i === 0
      ? 1
      : interpolate(frame, [BEATS[i - 1], BEATS[i - 1] + 14], [0, 1], {
          ...CLAMP,
          easing: EASE_BEAT,
        }),
  );
  let frac = stages[0];
  for (let s = 1; s < n; s++) {
    const p = arrive[s];
    frac = frac.map((v, i) => v + (stages[s][i] - v) * p);
  }
  const lock = spring({
    frame: frame - LOCK,
    fps,
    config: { damping: 16, stiffness: 170, mass: 0.9 },
  });
  frac = frac.map((v, i) => v + (stages[n][i] - v) * lock);

  const margin = Math.round(H * 0.03);
  const gutter = Math.round(H * 0.012);
  const gaps = arrive.slice(1).reduce((a, p) => a + p * gutter, 0);
  const full = H - margin * 2 - gaps;
  const usable = full * intro;
  const blockW = W - margin * 2;
  const F = H * 0.4;

  let y = margin + (full - usable) / 2;
  const blocks = rows.map((text, i) => {
    if (i > 0) y += arrive[i] * gutter;
    const h = Math.max(0, frac[i] * usable);
    const top = y;
    y += h;
    return { text, i, top, h };
  });

  // The field turns a few degrees and its light drifts across the shot.
  const drift = interpolate(frame, [0, 150], [0, 1], CLAMP);
  const ang = ((24 + 8 * drift) * Math.PI) / 180;
  const reach = Math.hypot(W, H) / 2;
  const fx = Math.cos(ang) * reach;
  const fy = Math.sin(ang) * reach;
  const fieldFill = `url(#${uid}-field)`;
  const glowFill = `url(#${uid}-glow)`;

  return (
    <AbsoluteFill style={{ background: t.stage }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <linearGradient
            id={`${uid}-field`}
            gradientUnits="userSpaceOnUse"
            x1={W / 2 - fx}
            y1={H / 2 - fy}
            x2={W / 2 + fx}
            y2={H / 2 + fy}
          >
            {field.map((c, i) => (
              <stop
                key={`${uid}-s${String(i)}`}
                offset={0.12 + (0.8 * i) / (field.length - 1)}
                stopColor={c}
              />
            ))}
          </linearGradient>
          <radialGradient
            id={`${uid}-glow`}
            gradientUnits="userSpaceOnUse"
            cx={W * (0.16 + 0.1 * drift)}
            cy={H * (0.12 + 0.04 * drift)}
            r={W * 0.55}
          >
            <stop offset="0" stopColor={t.glow} stopOpacity={t.glowAlpha} />
            <stop
              offset="0.5"
              stopColor={t.glow}
              stopOpacity={t.glowAlpha * 0.27}
            />
            <stop offset="1" stopColor={t.glow} stopOpacity={0} />
          </radialGradient>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              seed={7}
              stitchTiles="stitch"
            />
            <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2" />
          </filter>
        </defs>
        {blocks.map(({ text, i, top, h }) => {
          if (h < 0.5) return null;
          const m = metrics[i];
          const pad = Math.min(W * 0.018, h * 0.12);
          const innerW = blockW - pad * 2;
          const innerH = Math.max(0.01, h - pad * 2);
          const sx = innerW / (m.ink * F);
          const sy = innerH / (CAP * F);
          const tx = margin + pad - m.lsb * F * sx;
          const base = top + h - pad;
          const isWindow = i % 2 === 0;
          const flatC = flat ? flat(i) : null;
          const word = (fill: string) => (
            <text
              x={0}
              y={0}
              fill={fill}
              fontFamily={display}
              fontWeight={500}
              fontSize={F}
              textLength={m.adv * F}
              lengthAdjust="spacingAndGlyphs"
              style={{ fontKerning: "normal" }}
              transform={`translate(${tx} ${base}) scale(${sx} ${sy})`}
            >
              {text}
            </text>
          );
          const rect = (fill: string, mask?: string) => (
            <rect
              x={margin}
              y={top}
              width={blockW}
              height={h}
              fill={fill}
              mask={mask}
            />
          );
          return (
            <g key={`${uid}-${i}`}>
              {flatC ? (
                rect(flatC.bg)
              ) : isWindow ? (
                <>
                  {rect(fieldFill)}
                  {rect(glowFill)}
                </>
              ) : (
                rect(t.solid)
              )}
              <svg
                x={margin}
                y={top}
                width={blockW}
                height={h}
                viewBox={`${margin} ${top} ${blockW} ${h}`}
                overflow="hidden"
              >
                {flatC ? (
                  word(flatC.fg)
                ) : isWindow ? (
                  word(t.onField)
                ) : (
                  <>
                    <mask
                      id={`${uid}-m${i}`}
                      maskUnits="userSpaceOnUse"
                      x={margin}
                      y={top}
                      width={blockW}
                      height={h}
                    >
                      {word("#FFFFFF")}
                    </mask>
                    {rect(fieldFill, `url(#${uid}-m${i})`)}
                    {rect(glowFill, `url(#${uid}-m${i})`)}
                  </>
                )}
              </svg>
            </g>
          );
        })}
        {flat ? null : (
          <rect
            width={W}
            height={H}
            filter={`url(#${uid}-grain)`}
            opacity={t.grain}
            style={{ mixBlendMode: "overlay" }}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
}
