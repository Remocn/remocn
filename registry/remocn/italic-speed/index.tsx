"use client";

import { loadFont } from "@remotion/google-fonts/Archivo";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("italic", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface ItalicSpeedProps {
  /** The word that rides in on the strips. Set in caps. */
  title?: string;
  /** Second line, set smaller under the underline. Pass "" to hide. */
  subtitle?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Archivo Italic 500, per 1000 em, chars 32–126 then ’ “ ” … – — (harfbuzz):
// advance, left and right side bearing, and the caps/punctuation kerning pairs.
const ADV = [
  205, 282, 407, 582, 524, 958, 710, 227, 356, 356, 407, 630, 288, 333, 288,
  296, 574, 547, 571, 575, 566, 573, 575, 564, 575, 574, 315, 315, 630, 630,
  630, 595, 1002, 695, 702, 725, 731, 674, 611, 795, 734, 274, 571, 677, 552,
  846, 734, 785, 667, 785, 722, 670, 612, 728, 659, 938, 683, 666, 635, 316,
  296, 316, 630, 495, 189, 573, 579, 532, 579, 554, 293, 573, 573, 238, 236,
  528, 238, 860, 573, 583, 579, 579, 346, 524, 305, 572, 516, 740, 529, 516,
  503, 372, 245, 373, 630, 258, 435, 435, 901, 500, 1000,
];
const LSB = [
  0, 39, 104, 37, 27, 130, 36, 104, 58, -22, 71, 70, 2, 33, 42, -55, 47, 14, -2,
  27, 16, 32, 45, 95, 28, 48, 55, 17, 56, 51, 43, 104, 55, -35, 35, 54, 35, 36,
  36, 54, 36, 35, 20, 36, 36, 36, 36, 54, 36, 54, 35, 29, 80, 72, 87, 87, -34,
  85, -17, 25, 83, -55, 113, -71, 81, 24, 21, 34, 34, 34, -79, 8, 21, 21, -101,
  21, 21, 21, 21, 32, -10, 31, 21, 13, 51, 39, 58, 54, -35, -26, -17, 45, 83,
  -25, 27, 89, 103, 89, 42, -4, -4,
];
const RSB = [
  205, 5, -16, 11, 17, 101, 15, -16, -32, 48, -15, 72, 117, 31, 114, -83, 19,
  85, 12, 15, 33, 10, 26, -36, 20, 21, 56, 58, 45, 53, 58, 22, 40, 57, 17, 7,
  26, -14, -35, 42, 6, 6, 2, -55, 45, 7, 6, 24, -16, 24, 19, 26, -52, 3, -62,
  -64, -37, -65, -26, -64, 55, 17, 102, 58, -58, 24, 32, 21, -14, 31, -83, 19,
  42, -13, -13, -20, -14, 41, 42, 33, 34, 21, -36, 31, -26, 21, -36, -37, -23,
  -36, -3, -34, 80, 37, 70, 1, -13, 1, 114, -8, -8,
];
const KERN = new Map(
  [
    "AC-14 AG-14 AO-14 AQ-14 AT-86 AU-15 AV-31 AW-31 AX-24 AY-78 A?-30",
    "A'-98 BV-10 BW-10 BX-10 BY-14 CT-20 CV-4 CW-4 CX-8 CY-8 DA-14 DT-24",
    "DV-14 DW-14 DX-14 DY-14 DZ-10 D,-32 D:-10 D'-8 D…-32 EJ-20 FA-55",
    "FJ-78 FX-28 FY-28 FZ-42 F,-60 F:-12 F--20 F…-60 F–-20 F—-20 GV-5 GW-5",
    "KA-50 KC-44 KG-44 KJ-30 KO-44 KQ-44 KT-30 KV-54 KW-54 KX-20 KY-54",
    "KZ-10 K--60 K'-18 K–-60 K—-60 LC-30 LG-30 LJ-20 LO-30 LQ-30 LT-85",
    "LU-35 LV-92 LW-92 LX-148 LY-121 LZ-20 L?-50 L--80 L'-100 L’-100 L–-80",
    "L—-80 OA-14 OT-24 OV-14 OW-14 OX-14 OY-14 OZ-10 O,-32 O:-10 O'-8",
    "O…-32 PA-50 PJ-70 PT-20 PX-28 PY-18 PZ-30 P,-90 P…-90 QA-14 QT-24",
    "QV-14 QW-14 QX-14 QY-14 QZ-10 Q,-32 Q:-10 Q'-8 Q…-32 RC-10 RG-10",
    "RJ-30 RO-10 RQ-10 RT-22 RU-14 RV-10 RW-10 RX-19 RY-21 SY-35 TA-86",
    "TC-24 TG-24 TJ-108 TO-24 TQ-24 TX-20 TY-20 TZ-20 T,-50 T:-20 T…-50",
    "UA-15 VA-31 VC-14 VG-14 VJ-88 VO-14 VQ-14 VX-20 VY-20 V,-145 V:-10",
    "V--50 V…-145 V–-50 V—-50 WA-31 WC-14 WG-14 WJ-88 WO-14 WQ-14 WX-20",
    "WY-20 W,-145 W:-10 W--50 W…-145 W–-50 W—-50 XA-24 XC-14 XG-14 XO-14",
    "XQ-14 XT-20 XV-20 XW-20 XY-30 XZ-20 X--50 X–-50 X—-50 YA-78 YC-14",
    "YG-14 YJ-130 YO-14 YQ-14 YS-35 YT-20 YV-20 YW-20 YX-30 Y,-198 Y:-48",
    "Y--135 Y…-198 Y–-135 Y—-135 ZC-10 ZG-10 ZO-10 ZQ-10 ZT-20 ZX-20 Z--95",
    "Z–-95 Z—-95 0-40 0'7 0–40 0—40 1-40 1'-9 1–40 1—40 2-10 2–10 2—10",
    "3-40 3–40 3—40 4-40 4–40 4—40 5-40 5–40 5—40 6-20 6–20 6—20 77-10",
    "7,-120 7--40 7…-120 7–-40 7—-40 8-30 8–30 8—30 9-40 9–40 9—40 -V-50",
    "-W-50 -X-50 -Y-135 -040 -140 -240 -340 -440 -540 -640 -830 -920 'A-98",
    "'J-100 '4-12 ',-50 '…-50 ’A-98 –V-50 –W-50 –X-50 –Y-135 –040 –140",
    "–240 –340 –440 –540 –640 –830 –920 —V-50 —W-50 —X-50 —Y-135 —040 —140",
    "—240 —340 —440 —540 —640 —830 —920",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.686;

// Beat sheet (30fps, speed 1):
//  0–12    horizontal speed strips shoot in from the left edge, already moving
//          on frame 0, each with its own length and weight
//  3–19    the word rides in on them at high skew, leading letter first; the
//          trailing letters catch up, so the word arrives stretched
//  13–24   each letter brakes and its skew snaps to the resting slant with a
//          small overshoot (leans back a hair, then settles)
//  18–33   the strips retract: left ends race in, they fold down onto one thin
//          accent underline under the word
//  32–43   the second line slides up out from under the underline
//  43–     poster hold
const ARRIVE = 13;
const TRAVEL = 11;
const STAGGER = 1.2;
const LEAN = 34;
const RETRACT_AT = 18;
const RETRACT_LEN = 11;
const SUB_AT = 32;
const SUB_LEN = 11;

const RIDE = Easing.bezier(0.16, 0.8, 0.25, 1);
const STRIP_IN = Easing.bezier(0.2, 0.7, 0.3, 1);
const RETRACT = Easing.bezier(0.6, 0, 0.2, 1);
const SUB = Easing.bezier(0.2, 0.85, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    strip: "#2E2E34",
    sub: "#B9B8B3",
    // gradients.sh "beam": tail fades into the stage, head burns white-blue.
    beam: ["#1A1660", "#3D5BFF", "#8FB4FF", "#F4F7FF"],
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    strip: "#D6D4CD",
    sub: "#55545A",
    beam: ["#C9D4FF", "#8FB4FF", "#3D5BFF", "#1A1660"],
  },
} as const;

// Strips: vertical position (0 = cap top, 1 = baseline), thickness (× cap),
// right-end overhang past the word (× word width), whether it takes the
// accent, and how far across the frame it already is on frame 0.
const STRIPS = [
  { y: -0.06, h: 0.035, over: 0.08, accent: false, head: 0.55 },
  { y: 0.1, h: 0.09, over: -0.18, accent: true, head: 0.35 },
  { y: 0.24, h: 0.03, over: 0.14, accent: false, head: 0.7 },
  { y: 0.37, h: 0.13, over: -0.3, accent: false, head: 0.25 },
  { y: 0.52, h: 0.05, over: 0.03, accent: true, head: 0.6 },
  { y: 0.64, h: 0.025, over: 0.2, accent: false, head: 0.45 },
  { y: 0.76, h: 0.08, over: -0.08, accent: false, head: 0.3 },
  { y: 0.9, h: 0.04, over: 0.1, accent: true, head: 0.65 },
  { y: 1.06, h: 0.06, over: -0.22, accent: false, head: 0.4 },
];

const EXTRA = "’“”…–—";
function code(ch: string) {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c - 32;
  const x = EXTRA.indexOf(ch);
  return x >= 0 ? 95 + x : 46;
}

/** Pen offset of each glyph plus the total advance, in em, kerned. */
function layout(text: string) {
  const pens: number[] = [];
  let pen = 0;
  for (let i = 0; i < text.length; i++) {
    if (i > 0) pen += KERN.get(text[i - 1] + text[i]) ?? 0;
    pens.push(pen);
    pen += ADV[code(text[i])] / 1000;
  }
  return { pens, advance: pen };
}

export function ItalicSpeed({
  title = "FASTER",
  subtitle = "Ship at race pace.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ItalicSpeedProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const text = title.trim().toUpperCase() || "GO";
  const { pens, advance } = layout(text);
  const lsb = LSB[code(text[0])] / 1000;
  const rsb = RSB[code(text[text.length - 1])] / 1000;
  const inkEm = Math.max(0.5, advance - lsb - rsb);
  const fs = Math.min((0.78 * W) / inkEm, (0.36 * H) / CAP);
  const cap = CAP * fs;
  const inkW = inkEm * fs;

  const sub = subtitle.trim();
  const subFs = Math.max(0.44 * fs, 0.06 * W);
  const ruleGap = 0.13 * cap;
  const ruleH = Math.max(3, 0.0085 * H);
  const subGap = 0.3 * subFs;
  const blockH = cap + ruleGap + ruleH + (sub ? subGap + subFs * CAP * 1.3 : 0);
  const baseline = (H - blockH) / 2 + cap;
  const left = (W - inkW) / 2 - 0.02 * W;
  const penX = left - lsb * fs;
  const ruleY = baseline + ruleGap;
  // Italic: at the baseline the ink starts a little left of the cap-top ink.
  const ruleL = left - 0.02 * fs;
  const ruleR = left + inkW - 0.1 * fs;

  // Letters: the last one leads; each trails the next by STAGGER frames.
  const n = text.length;
  const letters = text.split("").map((ch, i) => {
    const arrive = ARRIVE + (n - 1 - i) * STAGGER;
    const ride = RIDE(interpolate(t, [arrive - TRAVEL, arrive], [0, 1], CLAMP));
    const dx = -(1.05 * W) * (1 - ride);
    const snap = spring({
      frame: t - (arrive - 2),
      fps,
      config: { damping: 11, stiffness: 320, mass: 0.55 },
    });
    const lean = -LEAN * (1 - snap);
    const x = penX + pens[i] * fs + dx;
    const pivot = x + (ADV[code(ch)] / 2000) * fs;
    return { ch, x, lean, pivot, visible: ride > 0 };
  });
  const lead = letters[n - 1];
  const leadRight = lead.x + (ADV[code(lead.ch)] / 1000) * fs;

  const strips = STRIPS.map((s, k) => {
    const color = s.accent ? `url(#${uid}-beam)` : c.strip;
    const enter = STRIP_IN(
      interpolate(t, [-TRAVEL * s.head, ARRIVE - 2 + k * 0.5], [0, 1], CLAMP),
    );
    const restR = ruleR + s.over * inkW;
    // The strip head never falls behind the leading letter it pulls along.
    const headX = Math.max(-0.02 * W + (restR + 0.02 * W) * enter, leadRight);
    const r0 = Math.min(headX, restR + 0.6 * W);
    const ret = RETRACT(
      interpolate(
        t,
        [RETRACT_AT + k * 0.5, RETRACT_AT + k * 0.5 + RETRACT_LEN],
        [0, 1],
        CLAMP,
      ),
    );
    const y0 = baseline - cap + s.y * cap - (s.h * cap * 1.4) / 2;
    const h0 = s.h * cap * 1.4;
    const l = -0.05 * W + (ruleL + 0.05 * W) * ret;
    const r = r0 + (ruleR - r0) * ret;
    const y = y0 + (ruleY - y0) * ret;
    const h = h0 + (ruleH - h0) * ret;
    return { key: k, l, r, y, h, color, accent: s.accent, ret };
  });
  const done = strips.every((s) => s.ret >= 1);

  const subP = SUB(interpolate(t, [SUB_AT, SUB_AT + SUB_LEN], [0, 1], CLAMP));
  const subLean = -14 * (1 - subP);
  const subBase = ruleY + ruleH + subGap + subFs * CAP;
  const subDy = -(subFs * 1.2) * (1 - subP);
  const subX = ruleL + 0.004 * W;

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={sub ? `${text}. ${sub}` : text}
      >
        <defs>
          <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c.beam[0]} stopOpacity={0} />
            <stop offset="0.35" stopColor={c.beam[0]} />
            <stop offset="0.7" stopColor={c.beam[1]} />
            <stop offset="0.92" stopColor={c.beam[2]} />
            <stop offset="1" stopColor={c.beam[3]} />
          </linearGradient>
          <linearGradient id={`${uid}-rule`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={accent} />
            <stop offset="0.75" stopColor={c.beam[1]} />
            <stop offset="1" stopColor={c.beam[2]} />
          </linearGradient>
          <clipPath id={`${uid}-sub`}>
            <rect x={0} y={ruleY + ruleH} width={W} height={H} />
          </clipPath>
        </defs>
        {done ? (
          <rect
            x={ruleL}
            y={ruleY}
            width={ruleR - ruleL}
            height={ruleH}
            fill={`url(#${uid}-rule)`}
          />
        ) : (
          [
            ...strips.filter((s) => !s.accent),
            ...strips.filter((s) => s.accent),
          ]
            .filter((s) => s.r > s.l)
            .map((s) => (
              <rect
                key={s.key}
                x={s.l}
                y={s.y}
                width={s.r - s.l}
                height={s.h}
                fill={s.color}
              />
            ))
        )}
        {letters.map((g, i) =>
          g.visible && g.ch !== " " ? (
            <text
              key={i}
              x={g.x}
              y={baseline}
              transform={`translate(${g.pivot} ${baseline}) skewX(${g.lean}) translate(${-g.pivot} ${-baseline})`}
              fill={c.ink}
              fontFamily={display}
              fontStyle="italic"
              fontWeight={500}
              fontSize={fs}
              style={{ fontKerning: "none" }}
            >
              {g.ch}
            </text>
          ) : null,
        )}
        {sub && subP > 0 ? (
          <g clipPath={`url(#${uid}-sub)`}>
            <text
              x={subX}
              y={subBase + subDy}
              transform={`translate(${subX} ${subBase}) skewX(${subLean}) translate(${-subX} ${-subBase})`}
              fill={c.sub}
              fontFamily={serif}
              fontStyle="italic"
              fontWeight={400}
              fontSize={subFs}
              style={{ letterSpacing: "-0.01em" }}
            >
              {sub}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
