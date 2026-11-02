"use client";

import { loadFont } from "@remotion/google-fonts/ArchivoNarrow";
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

export interface RepStackProps {
  /** One short word, set in caps. Trailing punctuation takes the accent. */
  word?: string;
  /** How many rows run through the gate before the last one locks. */
  reps?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Archivo Narrow 500, per 1000 em, chars 32–126 (harfbuzz): advance, left and right side bearing.
const ADV = [
  228, 242, 322, 456, 456, 729, 561, 169, 273, 273, 319, 479, 228, 273, 228,
  228, 456, 456, 456, 456, 456, 456, 456, 456, 456, 456, 242, 242, 479, 479,
  479, 470, 822, 561, 561, 592, 592, 547, 501, 638, 592, 228, 425, 561, 470,
  683, 592, 638, 547, 638, 592, 547, 501, 592, 547, 774, 547, 547, 501, 242,
  228, 242, 415, 456, 0, 456, 470, 425, 470, 456, 242, 470, 470, 228, 197, 425,
  197, 698, 470, 470, 470, 470, 288, 425, 242, 470, 425, 607, 425, 425, 410,
  288, 218, 288, 479,
];
const LSB = [
  0, 60, 40, 8, 47, 42, 39, 36, 37, 15, 20, 40, 58, 12, 58, 1, 37, 46, 37, 32,
  16, 37, 37, 30, 37, 37, 61, 61, 41, 40, 41, 44, 39, -1, 63, 39, 67, 67, 67,
  44, 67, 64, 12, 67, 67, 59, 67, 44, 67, 44, 67, 38, 18, 67, 5, 7, 3, 5, 19,
  49, 1, 22, 13, 0, 7, 28, 58, 38, 40, 39, 9, 14, 58, 65, -40, 58, 51, 58, 58,
  40, 58, 40, 58, 33, 12, 58, 8, 1, 6, 8, 23, 21, 68, 20, 32,
];
const RSB = [
  228, 56, 40, 11, 50, 35, 11, 39, 15, 37, 21, 41, 58, 13, 58, 0, 37, 8, 40, 37,
  16, 30, 37, 30, 37, 37, 69, 69, 40, 41, 40, 47, 39, -1, 30, 38, 44, 47, 36,
  61, 67, 64, 64, 9, 19, 59, 67, 44, 27, 44, 23, 41, 19, 67, 5, 7, 3, 5, 22, 21,
  0, 49, 10, 1, -193, 12, 40, 34, 58, 40, 0, 9, 58, 66, 51, -1, 52, 58, 58, 40,
  40, 58, 6, 39, 15, 58, 8, 2, 6, 8, 24, 20, 68, 21, 32,
];
const KERN = new Map(
  [
    "11-55 AT-60 AV-60 AW-35 AY-65 Av-19 Aw-14 Ay-19 F,-91 F.-91 FA-45 F_-91",
    "Fa-40 Fc-40 Fe-40 Fo-40 Kg-20 LT-60 LV-60 LW-55 LY-65 Ly-30 P,-105",
    "P.-105 PA-60 P_-105 RT-10 RV-14 RW-14 RY-19 T,-91 T--45 T.-91 T:-91",
    "T;-91 TA-60 TO-14 T_-91 Ta-70 Tc-81 Te-81 Ti-17 To-81 Tr-35 Ts-67 Tu-67",
    "Tw-50 Tx-40 Ty-50 Tz-40 V,-75 V--45 V.-75 V:-35 V;-35 VA-60 V_-75 Va-55",
    "Vc-50 Ve-50 Vi-14 Vo-50 Vr-35 Vu-30 Vy-30 W,-45 W--15 W.-45 W:-14 W;-14",
    "WA-35 W_-45 Wa-30 Wc-14 We-14 Wo-14 Wr-14 Wu-14 Wy-9 Xa-7 Xc-23 Xe-23",
    "Xo-23 Y,-101 Y--66 Y.-101 Y:-50 Y;-55 YA-65 Y_-101 Ya-55 Yc-63 Ye-63",
    "Yg-49 Yi-30 Yo-63 Yp-55 Yq-70 Ys-63 Yt-20 Yu-45 Yv-45 r,-45 r.-45 r_-45",
    "v,-60 v.-60 v_-60 w,-40 w.-40 w_-40 y,-60 y.-60 y_-60",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.686;
const TRACK = -0.006;

// Beat sheet (30fps, speed 1):
//  0–42    a reel of outlined copies of the word runs upward, braking; a
//          cap-height gate across the middle of the frame is a band of dusk
//          light, and letters crossing it are punched out of the band
//  42–50   the last copy overshoots the gate by a hair and settles into it:
//          the word stands cut out of the dusk, its punctuation in the accent
//  48–60   the outlined echoes above and below dim back
//  60–     poster hold
const RUN_LEN = 42;
const SETTLE_LEN = 8;
const OVERSHOOT = 0.03;
const DIM_AT = 48;
const DIM_LEN = 12;

const RUN = Easing.bezier(0.2, 0.52, 0.3, 1);
const SETTLE = Easing.bezier(0.45, 0, 0.55, 1);
const DIM = Easing.bezier(0.33, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: { stage: "#0A0A0B", ink: "#F3F2EF", cut: "#0A0A0B", echo: 0.36 },
  light: { stage: "#F5F4F0", ink: "#121214", cut: "#121214", echo: 0.3 },
} as const;

// gradients.sh "horizon" (bg #000000): a dusk band, cool sky over a warm
// horizon. It fills the gate, the letters crossing it read as cutouts. The
// band holds still; only its warm horizon glow drifts a few percent sideways.
const HORIZON = ["#dfe8ff", "#6f8fb0", "#c98f8a", "#b4553a"] as const;

function code(ch: string) {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c - 32;
  if (ch === "’" || ch === "‘") return 7;
  return 46;
}

/** Advance and ink box of a word, in em, with tracking. */
function measure(text: string) {
  let adv = 0;
  for (let i = 0; i < text.length; i++) {
    adv += ADV[code(text[i])] / 1000;
    if (i > 0) adv += (KERN.get(text[i - 1] + text[i]) ?? 0) + TRACK;
  }
  const lsb = LSB[code(text[0] ?? " ")] / 1000;
  const rsb = RSB[code(text[text.length - 1] ?? " ")] / 1000;
  return { lsb, ink: Math.max(0.2, adv - lsb - rsb) };
}

function splitTail(word: string) {
  const m = word.match(/^(.*?)([.!?…]+)$/);
  return m?.[1] ? [m[1], m[2]] : [word, ""];
}

export function RepStack({
  word = "AGAIN.",
  reps = 6,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RepStackProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gateId = `rs${uid}`;
  const duskId = `rsd${uid}`;
  const glowId = `rsg${uid}`;

  const text = word.trim().toUpperCase() || "AGAIN.";
  const [body, tail] = splitTail(text);
  const m = measure(text);
  const fs = Math.min((0.86 * W) / m.ink, (0.46 * H) / CAP);
  const cap = CAP * fs;
  const pitch = cap * 1.1;
  const x = (W - m.ink * fs) / 2 - m.lsb * fs;
  const baseline = (H + cap) / 2;
  const n = Math.max(2, Math.round(reps));

  const run = RUN(interpolate(t, [0, RUN_LEN], [0, 1], CLAMP));
  const settle = SETTLE(
    interpolate(t, [RUN_LEN, RUN_LEN + SETTLE_LEN], [0, 1], CLAMP),
  );
  // Rows still to travel, in pitches. It starts between two rows, so the
  // first frame is mid-pass, ends a hair past the gate, then settles.
  const left = (n + 0.45) * (1 - run) - OVERSHOOT * run + OVERSHOOT * settle;
  const dim = DIM(interpolate(t, [DIM_AT, DIM_AT + DIM_LEN], [0, 1], CLAMP));
  const echoOpacity = 1 - (1 - c.echo) * dim;

  const pad = 0.03 * fs;
  const gateTop = baseline - cap - pad;
  const gateH = cap + 2 * pad;
  const glowX = interpolate(t, [0, 90], [0.38, 0.46], CLAMP);
  const stroke = Math.max(1.5, fs * 0.0055);
  const rows: number[] = [];
  for (let r = -n - 2; r <= 2; r++) {
    const y = baseline + (r + left) * pitch;
    if (y > -0.2 * pitch && y - cap < H + 0.2 * pitch) rows.push(r);
  }

  const typeProps = {
    x,
    fontFamily: display,
    fontWeight: 500,
    fontSize: fs,
    style: { letterSpacing: `${TRACK}em`, fontKerning: "normal" as const },
  };

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-label={text}
        role="img"
      >
        <defs>
          <clipPath id={gateId}>
            <rect x={0} y={gateTop} width={W} height={gateH} />
          </clipPath>
          <linearGradient
            id={duskId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={gateTop}
            x2={0}
            y2={gateTop + gateH}
          >
            <stop offset="0" stopColor={HORIZON[1]} />
            <stop offset="0.55" stopColor={HORIZON[2]} />
            <stop offset="0.92" stopColor={HORIZON[3]} />
          </linearGradient>
          <radialGradient
            id={glowId}
            gradientUnits="userSpaceOnUse"
            cx={glowX * W}
            cy={gateTop + gateH * 0.78}
            r={W * 0.42}
            gradientTransform={`translate(${glowX * W} ${gateTop + gateH * 0.78}) scale(1 0.32) translate(${-glowX * W} ${-(gateTop + gateH * 0.78)})`}
          >
            <stop offset="0" stopColor={HORIZON[0]} stopOpacity={0.4} />
            <stop offset="0.45" stopColor={HORIZON[2]} stopOpacity={0.25} />
            <stop offset="1" stopColor={HORIZON[2]} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={echoOpacity}>
          {rows.map((r) => (
            <text
              key={r}
              {...typeProps}
              y={baseline + (r + left) * pitch}
              fill="none"
              stroke={c.ink}
              strokeWidth={stroke}
              strokeLinejoin="round"
            >
              {text}
            </text>
          ))}
        </g>
        <rect
          x={0}
          y={gateTop}
          width={W}
          height={gateH}
          fill={`url(#${duskId})`}
        />
        <rect
          x={0}
          y={gateTop}
          width={W}
          height={gateH}
          fill={`url(#${glowId})`}
        />
        <g clipPath={`url(#${gateId})`}>
          {rows.map((r) => (
            <text
              key={r}
              {...typeProps}
              y={baseline + (r + left) * pitch}
              fill={c.cut}
              stroke={c.cut}
              strokeWidth={stroke}
              strokeLinejoin="round"
            >
              {body}
              {tail ? (
                <tspan fill={accent} stroke={accent}>
                  {tail}
                </tspan>
              ) : null}
            </text>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
