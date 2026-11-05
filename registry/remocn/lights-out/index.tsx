"use client";

import { loadFont } from "@remotion/google-fonts/Unbounded";
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

export interface LightsOutProps {
  /** Headline that slams in the instant the lights go out. Set in caps. */
  title?: string;
  /** Frames between two lights coming on. */
  beat?: number;
  /** Frames all five lights stay lit before they go out together. */
  hold?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Unbounded 500, per 1000 em, chars 32–126 then ’ “ ” … – — (harfbuzz): advance,
// left and right side bearing, and the caps/punctuation kerning pairs.
const ADV = [
  256, 302, 464, 842, 788, 1252, 909, 252, 361, 361, 528, 620, 282, 361, 279,
  440, 909, 495, 812, 821, 832, 791, 841, 728, 873, 841, 311, 316, 620, 620,
  620, 679, 1031, 928, 865, 923, 911, 780, 755, 955, 924, 323, 792, 851, 751,
  1206, 954, 956, 796, 957, 830, 823, 801, 870, 910, 1338, 832, 897, 791, 407,
  440, 407, 620, 482, 346, 806, 799, 743, 808, 722, 563, 796, 757, 293, 293,
  714, 293, 1182, 766, 778, 800, 800, 530, 719, 579, 754, 742, 1120, 682, 746,
  672, 440, 298, 440, 620, 277, 510, 514, 783, 652, 1182,
];
const LSB = [
  0, 54, 43, 44, 38, 25, 33, 43, 39, 23, 38, 30, 38, 57, 41, 15, 46, 11, 38, 32,
  24, 32, 47, 11, 46, 44, 58, 57, 29, 30, 31, 17, 36, 4, 53, 41, 77, 53, 77, 41,
  77, 77, 21, 77, 77, 77, 77, 40, 77, 40, 77, 37, 17, 67, 4, 12, -8, 11, 41, 72,
  15, 31, 35, -26, 29, 36, 63, 33, 36, 33, 19, 34, 63, 44, 44, 63, 63, 36, 36,
  33, 63, 35, 36, 27, 5, 55, 5, 7, -9, 9, 38, 33, 77, 32, 30, 52, 34, 52, 41,
  56, 56,
];
const RSB = [
  256, 54, 44, 44, 39, 24, -10, 43, 23, 39, 38, 30, 43, 57, 41, 15, 46, 81, 43,
  47, 31, 39, 44, 27, 46, 46, 58, 60, 31, 30, 29, 24, 32, 4, 36, 34, 40, 52, 37,
  59, 77, 76, 67, -3, 18, 76, 76, 40, 22, 41, 28, 37, 18, 67, 4, 12, -8, 12, 41,
  31, 15, 72, 34, -26, 29, 49, 35, 27, 26, 35, 0, 60, 55, 45, 45, -5, 63, 55,
  55, 34, 35, 62, 14, 33, 26, 36, 5, 8, -10, 4, 38, 32, 76, 32, 30, 29, 42, 28,
  41, 56, 56,
];
const KERN = new Map(
  [
    "AC-43 AG-43 AJ-26 AO-43 AQ-43 AS-37 AT-126 AU-44 AV-125 AW-65 AY-156",
    "AZ-7 A0-40 A1-77 A2-10 A3-22 A4-20 A5-22 A6-38 A7-56 A8-22 A9-31",
    "A:-16 A?-78 A--58 A'-101 A’-94 A–-58 A—-58 BA-36 BC-1 BG-1 BO-1 BQ-1",
    "BT-29 BV-38 BW-25 BX-34 BY-65 BZ-6 B1-8 B7-10 B?-5 CA-37 CB-2 CE-2",
    "CT-32 CV-37 CW-22 CX-57 CY-72 CZ-14 C1-4 C7-10 C.-27 C,-27 C…-27",
    "DA-45 DB-8 DE-8 DT-35 DV-45 DW-25 DX-66 DY-93 DZ-21 D1-12 D7-22 D.-37",
    "D,-37 D…-37 EA-15 EC-12 EG-12 EJ-8 EO-12 EQ-12 ET-11 EV-18 EW-8 EY-27",
    "E4-4 FA-65 FC-8 FG-8 FJ-6 FO-8 FQ-8 FS-9 FV-1 FX-12 FY-15 F2-6 F4-14",
    "F.-103 F,-103 F…-103 GA-14 GT-33 GV-50 GW-28 GY-94 G1-14 G7-19 G'-11",
    "G’-10 JA-40 JX-2 J.-29 J,-29 J…-29 KC-47 KG-47 KJ-41 KO-47 KQ-47",
    "KS-27 KX3 K0-30 K3-7 K4-17 K5-4 K6-28 K78 K8-7 K9-14 K!5 K?-22 K--69",
    "K'5 K–-69 K—-69 LC-39 LG-39 LJ-17 LO-39 LQ-39 LS-25 LT-153 LU-34",
    "LV-137 LW-89 LX7 LY-167 L0-25 L1-82 L3-4 L4-7 L5-5 L6-23 L7-52 L8-4",
    "L9-13 L?-84 L--89 L'-119 L’-120 L–-89 L—-89 OA-43 OB-8 OE-8 OT-35",
    "OV-43 OW-24 OX-61 OY-87 OZ-19 O1-10 O7-20 O.-35 O,-35 O…-35 PA-90",
    "PB-1 PE-1 PJ-6 PT-10 PV-25 PW-12 PX-62 PY-41 PZ-11 P4-35 P.-114",
    "P,-114 P?24 P&-18 P…-114 QA-43 QB-8 QE-8 QT-35 QV-43 QW-24 QX-55",
    "QY-87 QZ-19 Q1-10 Q7-20 Q.-35 Q,-33 Q…-35 RA-16 RC-7 RG-7 RJ-23 RO-7",
    "RQ-7 RS-2 RT-24 RU-2 RV-37 RW-24 RX-5 RY-58 R0-1 R4-36 R5-7 R6-1 R8-5",
    "R&-5 R--15 R–-15 R—-15 SA-36 SB-1 SE-1 ST-28 SV-38 SW-27 SX-44 SY-63",
    "SZ-6 S7-4 TA-126 TC-35 TG-35 TJ-134 TO-35 TQ-35 TS-21 T0-24 T17 T2-7",
    "T3-8 T4-102 T5-14 T6-23 T78 T8-10 T9-5 T.-128 T,-128 T:-79 T?4 T&-35",
    "T--112 T…-128 T–-112 T—-112 UA-44 UX-2 U.-33 U,-33 U…-33 VA-125 VC-43",
    "VG-43 VJ-84 VO-43 VQ-43 VS-37 VZ-9 V0-40 V1-2 V2-24 V3-29 V4-87 V5-29",
    "V6-39 V712 V8-30 V9-24 V.-122 V,-122 V:-56 V!6 V?-15 V&-51 V--73 V'6",
    "V’-5 V…-122 V–-73 V—-73 WA-65 WC-24 WG-24 WJ-25 WO-24 WQ-24 WS-26",
    "W0-22 W2-9 W3-15 W4-54 W5-19 W6-21 W74 W8-17 W9-13 W.-86 W,-86 W:-32",
    "W!3 W&-37 W--43 W'3 W…-86 W–-43 W—-43 XC-61 XG-61 XJ-57 XO-61 XQ-61",
    "XS-44 XU-2 XX1 XY-5 X0-37 X3-12 X4-28 X5-10 X6-34 X8-10 X9-17 X!4",
    "X?-23 X&-4 X--77 X'4 X–-77 X—-77 YA-157 YC-88 YG-88 YJ-136 YO-88",
    "YQ-88 YS-51 YT-1 YX-5 YY-6 YZ-20 Y0-76 Y1-11 Y2-48 Y3-60 Y4-134 Y5-47",
    "Y6-74 Y72 Y8-58 Y9-50 Y.-136 Y,-136 Y:-101 Y!5 Y?-31 Y&-72 Y--128",
    "Y'-3 Y’-29 Y…-136 Y–-128 Y—-128 ZA-7 ZC-19 ZG-19 ZJ-18 ZO-19 ZQ-19",
    "ZS-5 ZV-9 ZY-19 Z0-14 Z4-4 Z6-13 Z--43 Z–-43 Z—-43 0A-42 0B-6 0E-6",
    "0T-28 0V-43 0W-23 0X-38 0Y-75 0Z-16 01-8 07-16 0.-31 0,-31 0…-31 1A-4",
    "1V-5 1Y-17 2A-4 2C-1 2G-1 2J-4 2O-1 2Q-1 2T-9 2V-32 2W-19 2Y-62 2--17",
    "2–-17 2—-17 3A-24 3T-9 3V-28 3W-16 3X-13 3Y-55 4A-20 4T-45 4V-57",
    "4W-43 4X-17 4Y-73 41-35 42-6 47-35 4'-40 4’-37 5A-23 5T-14 5V-25",
    "5W-16 5X-9 5Y-37 51-7 52-4 57-6 6A-24 6T-13 6V-33 6W-18 6X-17 6Y-63",
    "67-4 7A-95 7C-16 7G-16 7J-58 7O-16 7Q-16 70-9 74-75 75-8 76-8 7.-122",
    "7,-122 7--55 7…-122 7–-55 7—-55 8A-22 8T-11 8V-32 8W-18 8X-12 8Y-61",
    "87-4 9A-41 9B-6 9E-6 9T-25 9V-41 9W-23 9X-37 9Y-73 9Z-15 91-7 97-14",
    "9.-25 9,-25 9…-25 .C-35 .G-35 .J-8 .O-35 .Q-35 .S-8 .T-128 .U-33",
    ".V-122 .W-86 .Y-135 .0-31 .1-92 .6-25 .7-57 .9-16 .?-88 .--77 .'-126",
    ".’-127 .–-77 .—-77 ,C-35 ,G-35 ,J-8 ,O-35 ,Q-35 ,S-8 ,T-128 ,U-33",
    ",V-122 ,W-86 ,Y-135 ,0-31 ,1-92 ,6-25 ,7-57 ,9-16 ,?-88 ,--77 ,'-126",
    ",’-127 ,–-77 ,—-77 :A-16 :T-79 :V-56 :W-32 :Y-101 ??15 &A19 &J-5",
    "&S-17 &T-67 &U-16 &V-55 &W-28 &X32 &Y-81 &'-56 &’-55 -A-58 -B-17",
    "-E-17 -T-112 -V-73 -W-43 -X-77 -Y-128 -Z-45 -1-64 -2-18 -7-46 -.-77",
    "-,-77 -'-13 -…-77 'A-101 'J-76 'V6 'W3 'X4 'Y5 '4-79 '.-126 ',-126",
    "'&-30 '--13 '…-126 '–-13 '—-13 ’A-107 ’C-11 ’G-11 ’J-99 ’O-11 ’Q-11",
    "’T2 ’Y-15 ’112 ’4-92 ’712 ’.-138 ’,-138 ’:-24 ’?4 ’&-28 ’--38 ’…-138",
    "’–-38 ’—-38 …C-35 …G-35 …J-8 …O-35 …Q-35 …S-8 …T-128 …U-33 …V-122",
    "…W-86 …Y-135 …0-31 …1-92 …6-25 …7-57 …9-16 …?-88 …--77 …'-126 …’-127",
    "…–-77 …—-77 –A-58 –B-17 –E-17 –T-112 –V-73 –W-43 –X-77 –Y-128 –Z-45",
    "–1-64 –2-18 –7-46 –.-77 –,-77 –'-13 –…-77 —A-58 —B-17 —E-17 —T-112",
    "—V-73 —W-43 —X-77 —Y-128 —Z-45 —1-64 —2-18 —7-46 —.-77 —,-77 —'-13",
    "—…-77",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.75;
/** Oblique slant, degrees: Unbounded has no italic, so the word is sheared. */
const SLANT = 11;

// Beat sheet (30fps, speed 1, beat 10, hold 24):
//  0–10    five dim discs on a thin rail, the row creeping closer (slow push)
//  10–50   the lamps come on one by one, one every 10 frames, hard on; each
//          one warms the "rise" ground glow from below a step more
//  50–74   all five lit, the push keeps tightening
//  74      lights out: all five go dark and the glow dies on the same frame;
//          the headline is already halfway in from the left, cut into lagging
//          bands that drag solid extrusions of themselves (a flat smear frame)
//  74–78   the headline brakes to a hard stop and the bands line up; the dark
//          row snaps up and shrinks to sit above it
//  78–     poster hold, the ground glow comes back low under the headline
const FIRST_LIGHT = 10;
const SLAM_LEN = 5;
const RISE_LEN = 9;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const RISE = Easing.bezier(0.2, 0.9, 0.3, 1);
const PUSH = Easing.bezier(0.5, 0, 0.75, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    off: "#26262B",
    rail: "#1B1B1F",
    glow: ["#FF8A3D", "#A3301A", "#2A0D0A"],
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    off: "#DCDAD3",
    rail: "#E6E4DE",
    glow: ["#FF9F5E", "#FFC9A3", "#FBE6D6"],
  },
} as const;

const EXTRA = "’“”…–—";
function code(ch: string) {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c - 32;
  const x = EXTRA.indexOf(ch);
  return x >= 0 ? 95 + x : 46;
}

function advance(text: string) {
  let adv = 0;
  for (let i = 0; i < text.length; i++) {
    adv += ADV[code(text[i])] / 1000;
    if (i > 0) adv += KERN.get(text[i - 1] + text[i]) ?? 0;
  }
  return adv;
}

/** Pen offsets of each glyph, in em, kerned. */
function penOffsets(text: string) {
  const out: number[] = [];
  let pen = 0;
  for (let i = 0; i < text.length; i++) {
    if (i > 0) pen += KERN.get(text[i - 1] + text[i]) ?? 0;
    out.push(pen);
    pen += ADV[code(text[i])] / 1000;
  }
  return out;
}

const BANDS = 12;
// Lag of each band, 0–1: tuned by eye so the bands read as streaks, not noise.
const LAGS = [0.55, 0.15, 0.85, 0.4, 1, 0.25, 0.7, 0.05, 0.9, 0.35, 0.6, 0.2];

export function LightsOut({
  title = "SHIP IT.",
  beat = 10,
  hold = 24,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: LightsOutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const text = title.trim().toUpperCase() || "GO";
  const lastLight = FIRST_LIGHT + 4 * beat;
  const outAt = lastLight + hold;
  const out = t >= outAt;

  // Headline metrics: sized so its ink spans ~86% of the width.
  const adv = advance(text);
  const lsb = LSB[code(text[0])] / 1000;
  const rsb = RSB[code(text[text.length - 1])] / 1000;
  const inkEm = Math.max(0.5, adv - lsb - rsb);
  const fs = Math.min((0.86 * W) / inkEm, (0.34 * H) / CAP);
  const cap = CAP * fs;
  const inkW = inkEm * fs;

  // Lights: big row centered, small row parked above the headline.
  const d = 0.105 * W;
  const gap = 0.04 * W;
  const rowW = 5 * d + 4 * gap;
  const small = Math.min(0.36, (0.34 * inkW) / rowW);
  const blockGap = 0.075 * H;
  const blockH = d * small + blockGap + cap;
  const top = (H - blockH) / 2;
  const smallCy = top + (d * small) / 2;
  const baseline = top + d * small + blockGap + cap;

  const push = 1 + 0.06 * PUSH(interpolate(t, [0, outAt], [0, 1], CLAMP));
  const rise = RISE(interpolate(t, [outAt, outAt + RISE_LEN], [0, 1], CLAMP));
  const rowScale = push + (small - push) * rise;
  const rowCy = H / 2 + (smallCy - H / 2) * rise;

  // Slam: its clock starts a frame early, so on the out frame the headline is
  // already halfway across, then it brakes hard.
  const slamStart = outAt - 1;
  // The shear pushes the cap line right; center the sheared ink, not the
  // upright one.
  const shear = Math.tan((SLANT * Math.PI) / 180);
  const restX = (W - inkW) / 2 - lsb * fs - (shear * cap) / 2;
  const from = restX - 0.62 * inkW - 0.12 * W;
  const xAt = (f: number) =>
    from +
    (restX - from) *
      SLAM(interpolate(f, [slamStart, slamStart + SLAM_LEN], [0, 1], CLAMP));
  const x = xAt(t);
  const velocity = x - xAt(t - 1);
  const smear = Math.min(velocity * 1.15, 0.9 * W);

  const pens = penOffsets(text);
  const lastIsDot = /[.!]$/.test(text);
  const glyphs = text.split("").map((ch, i) => ({
    ch,
    dx: pens[i] * fs,
    fill: lastIsDot && i === text.length - 1 ? accent : c.ink,
  }));

  const renderWord = (ox: number, key: string) => (
    <g key={key}>
      {glyphs.map((g, i) =>
        g.ch === " " ? null : (
          <text
            key={i}
            x={ox + g.dx}
            y={baseline}
            fill={g.fill}
            fontFamily={display}
            fontWeight={500}
            fontSize={fs}
            style={{ fontKerning: "none" }}
          >
            {g.ch}
          </text>
        ),
      )}
    </g>
  );

  // While it moves the word is cut into horizontal bands. Each band lags by
  // its own amount and drags a solid extrusion of itself behind it: a flat
  // smear frame, no blur. Once the velocity is gone the bands line up.
  const bandTop = baseline - cap * 1.08;
  const bandH = (cap * 1.16) / BANDS;
  const moving = out && smear > 0.025 * W;
  const step = 0.07 * fs;
  const lights = Array.from({ length: 5 }, (_, i) => {
    const on = !out && t >= FIRST_LIGHT + i * beat;
    const cx = W / 2 + (i - 2) * (d + gap) * rowScale;
    return { cx, on };
  });
  const r = (d / 2) * rowScale;
  const slantT = `translate(0 ${baseline}) skewX(${-SLANT}) translate(0 ${-baseline})`;

  // Ground: a warm "rise" glow from below that builds with every lamp, dies
  // on lights out, and comes back low under the landed headline.
  const lit = lights.reduce(
    (acc, _, i) =>
      acc +
      RISE(
        interpolate(
          t,
          [FIRST_LIGHT + i * beat, FIRST_LIGHT + i * beat + 6],
          [0, 1],
          CLAMP,
        ),
      ),
    0,
  );
  const after = interpolate(t, [outAt + 4, outAt + 30], [0, 0.42], {
    ...CLAMP,
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const glow = out ? after : lit / 5;
  const g = c.glow;

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: glow,
          background: `radial-gradient(75% 62% at 50% 122%, ${g[0]} 0%, ${g[1]} 30%, ${g[2]} 56%, transparent 82%)`,
        }}
      />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={text}
      >
        <rect
          x={W / 2 - (rowW / 2 + gap * 0.9) * rowScale}
          y={rowCy - 0.05 * d * rowScale}
          width={(rowW + gap * 1.8) * rowScale}
          height={0.1 * d * rowScale}
          fill={c.rail}
        />
        {lights.map((l, i) => (
          <circle
            key={i}
            cx={l.cx}
            cy={rowCy}
            r={r}
            fill={l.on ? `url(#${uid}-lamp)` : c.off}
          />
        ))}
        <defs>
          {/* Lamp lens: concentric, centered, so it reads as a flat light and
              not a lit sphere. */}
          <radialGradient id={`${uid}-lamp`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFF1E2" />
            <stop offset="0.22" stopColor="#FFC08A" />
            <stop offset="0.55" stopColor="#FF8A3D" />
            <stop offset="0.92" stopColor="#D2502A" />
            <stop offset="1" stopColor="#A3301A" />
          </radialGradient>
          {Array.from({ length: BANDS }, (_, k) => (
            <clipPath key={k} id={`${uid}-b${k}`}>
              <rect
                x={0}
                y={bandTop + k * bandH}
                width={W}
                height={bandH + 0.5}
              />
            </clipPath>
          ))}
        </defs>
        <g transform={slantT}>
          {moving
            ? Array.from({ length: BANDS }, (_, k) => {
                const lag = LAGS[k % LAGS.length];
                // Only the long-lag bands streak; the rest just slip, so the
                // letterforms still read through the smear.
                const head = x - smear * lag * 0.3;
                const tail = lag > 0.5 ? smear * lag * 0.85 : 0;
                const n = Math.min(18, Math.ceil(tail / step));
                return (
                  <g key={k} clipPath={`url(#${uid}-b${k})`}>
                    {Array.from({ length: n + 1 }, (_, j) =>
                      renderWord(
                        head - (n ? (tail * (n - j)) / n : 0),
                        `c${j}`,
                      ),
                    )}
                  </g>
                );
              })
            : null}
          {out && !moving ? renderWord(x, "w") : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
