"use client";

import { loadFont } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: brand } = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface MacroPanProps {
  /** One-line headline. A closing period or other punctuation takes the accent. */
  title?: string;
  /** Running label in the corner. "remocn" is set as the real logo. */
  label?: string;
  /** Number set before the label, like a reel or chapter. */
  index?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/** Fraunces 400 advance widths (per mille) for ASCII 32–126. */
const ADV = [
  203, 314, 346, 644, 577, 730, 704, 167, 364, 360, 620, 550, 240, 386, 233,
  450, 648, 433, 588, 533, 566, 554, 592, 520, 564, 592, 282, 293, 512, 556,
  512, 484, 880, 640, 661, 645, 748, 626, 600, 702, 786, 376, 365, 710, 558,
  847, 707, 766, 654, 766, 685, 572, 586, 704, 624, 952, 650, 585, 606, 372,
  430, 372, 460, 456, 228, 548, 552, 455, 560, 485, 320, 519, 576, 315, 304,
  550, 313, 848, 590, 527, 548, 536, 468, 434, 372, 587, 489, 745, 582, 510,
  495, 400, 320, 398, 622,
];
/** Fraunces 400 kerning: "AT46" = A then T, -46/1000 em ("+" widens). */
const KERN = new Map<string, number>();
for (const tok of [
  "AT46 AU29 AV40 AW40 AY43 BT23 BU22 BV31 BW31 BY26 DA25 DT36 DU20 DV32",
  "DW32 DX30 DY33 DZ24 FA50 F.50 F,50 JA30 J.42 J,42 Kv34 Kw34 Ky34 LT42",
  "LU31 LV40 LW40 LY32 Lv20 Lw20 Ly20 NT+24 Nb+20 Nh+20 Nk+20 Nl+20",
  "OA25 OT36 OU20 OV32 OW32 OX30 OY33 OZ24 PA54 PB24 PD24 PE24 PF24 PH24",
  "PI24 PK24 PL24 PN21 PP24 PR24 PX29 PZ24 P.66 P,66 QA25 QT36 QU20 QV32",
  "QW32 QX30 QY33 QZ24 RU22 RV35 RW35 RY24 SU22 Sv20 Sw20 Sy20 S.20 S,20",
  "TA60 TC22 TG22 TO22 TQ22 TT+34 TV+38 TW+38 TX+26 Ta41 Tb+20 Tc46 Td46",
  "Te46 Tg41 Th+20 Ti25 Tk+20 Tl+20 Tm35 Tn35 To46 Tq46 Tr35 Ts41 Tu41",
  "Tv42 Tw42 Tx22 Ty42 Tz22 T.68 T,68 UA46 Ua21 Ui24 Um24 Un24 Ur24 Ux21",
  "U.52 U,52 VA74 Va50 Vc44 Vd44 Ve44 Vg50 Vo44 Vq44 Vs38 Vv25 Vw25 Vy25",
  "V.94 V,94 WA74 Wa50 Wc44 Wd44 We44 Wg50 Wo44 Wq44 Ws38 Wv25 Ww25 Wy25",
  "W.94 W,94 Xv24 Xw24 Xy24 YA54 YT+31 Ya46 Yb+20 Yc44 Yd44 Ye44 Yg26",
  "Yh+20 Yi28 Yk+20 Yl+20 Ym28 Yn28 Yo44 Yq44 Yr28 Ys38 Yu31 Yv36 Yw36",
  "Yx21 Yy36 Y.76 Y,76 bb20 bh20 bk20 bl20 bx20 cT58 cU26 cV53 cW53 cY64",
  "eJ20 eT60 eU32 eV58 eW58 eY73 eb21 eh21 ek21 el21 fa21 ob20 oh20 ok20",
  "ol20 ox20 pb20 ph20 pk20 pl20 px20 qj+35 ra26 rg22 rx20 ya22 yg20 yx27",
  "y.35 y,35 .T64 .U27 .V67 .W67 .Y49 ,T64 ,U27 ,V67 ,W67 ,Y49",
]
  .join(" ")
  .split(" ")) {
  const m = /^(.)(.)(\+?)(\d+)$/.exec(tok);
  if (m) KERN.set(m[1] + m[2], ((m[3] ? 1 : -1) * Number(m[4])) / 1000);
}
const TRACK = -0.022;
const WORD_SPACE = 0.05;
const CAP = 0.7;
const X_HEIGHT = 0.47;

const PAN_END = 100;
const PULL_LEN = 34;

const PAN = Easing.bezier(0.38, 0.08, 0.78, 1);
const PULL = Easing.bezier(0.55, 0, 0.12, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Letter fill: gradients.sh "rise" (sunrise from the baseline). Light keeps
// the palette's deep end so the type holds contrast on the off-white stage.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    fill: ["#FFF1E2", "#FFD2AE", "#FF8A3D", "#C4401F"],
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    fill: ["#2A0D0A", "#6E1E12", "#A3301A", "#E0662A"],
    grain: 0.045,
  },
} as const;

/** The real remocn "R" mark (viewBox 124.06 × 134.26). */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: brand,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? ADV[code - 32] : 640) / 1000;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function MacroPan({
  title = "Built to move.",
  label = "remocn",
  index = "01",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: MacroPanProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const layout = useMemo(() => {
    const chars = Array.from(title.trim());
    const lefts: number[] = [];
    let x = 0;
    chars.forEach((ch, i) => {
      if (i > 0) x += KERN.get(chars[i - 1] + ch) ?? 0;
      lefts.push(x);
      // Serif display wants a slightly wider word space than the font's.
      const space = ch === " " ? WORD_SPACE : 0;
      x += advance(ch) + space + (i < chars.length - 1 ? TRACK : 0);
    });
    return { chars, lefts, total: x };
  }, [title]);

  const F = Math.min((W * 0.86) / layout.total, (H * 0.36) / CAP);
  const lineX = (W - layout.total * F) / 2;
  const baseline = H / 2 + (CAP * F) / 2;
  const xh = X_HEIGHT * F;

  // Focus path in poster coordinates: across the last letters, ending on the mark.
  const lastIdx = layout.chars.length - 1;
  const startIdx = Math.max(0, lastIdx - 4);
  const endsOnMark = /[.!?]/.test(layout.chars[lastIdx] ?? "");
  const fx0 = lineX + (layout.lefts[startIdx] + 0.08) * F;
  const fy0 = baseline - xh * 0.62;
  const fx1 =
    lineX +
    (layout.lefts[lastIdx] + advance(layout.chars[lastIdx] ?? "") * 0.5) * F;
  const fy1 = baseline - (endsOnMark ? 0.08 * F : xh * 0.5);

  const s0 = (H * 1.55) / xh;
  const pan = interpolate(t, [0, PAN_END], [0, 1], { ...CLAMP, easing: PAN });
  const sPan = s0 * (1 - 0.12 * pan);
  const sEnd = s0 * 0.88;
  const pull = interpolate(t, [PAN_END, PAN_END + PULL_LEN], [0, 1], {
    ...CLAMP,
    easing: PULL,
  });
  const push = interpolate(
    t,
    [PAN_END + PULL_LEN, PAN_END + PULL_LEN + 50],
    [0, 1],
    { ...CLAMP, easing: Easing.bezier(0.33, 0, 0.67, 1) },
  );

  let transform: string;
  if (pull <= 0) {
    const fx = fx0 + (fx1 - fx0) * pan;
    const fy = fy0 + (fy1 - fy0) * pan;
    transform = `translate(${W / 2} ${H / 2}) scale(${sPan}) translate(${-fx} ${-fy})`;
  } else {
    const s = Math.exp(Math.log(sEnd) * (1 - pull)) * (1 + push * 0.012);
    const px = (W / 2 - fx1 * sEnd) / (1 - sEnd);
    const py = (H / 2 - fy1 * sEnd) / (1 - sEnd);
    transform = `translate(${px} ${py}) scale(${s}) translate(${-px} ${-py})`;
  }

  const labelIn = interpolate(t, [4, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const fontSize = 15 * u;
  const margin = 40 * u;
  const uid = `mp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Sunrise fill: runs from the top of the x-height down past the baseline and
  // leans a few degrees as the shot plays.
  const lean = (6 - t * 0.04) * F * 0.01;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={uid}
            gradientUnits="userSpaceOnUse"
            x1={lineX + lean}
            y1={baseline - CAP * F * 1.05}
            x2={lineX - lean}
            y2={baseline + 0.06 * F}
          >
            {c.fill.map((col, j) => (
              <stop key={col} offset={[0, 0.3, 0.68, 1][j]} stopColor={col} />
            ))}
          </linearGradient>
        </defs>
        <g transform={transform}>
          {layout.chars.map((ch, i) =>
            ch === " " ? null : (
              <text
                key={i}
                x={lineX + layout.lefts[i] * F}
                y={baseline}
                fontFamily={display}
                fontWeight={400}
                fontSize={F}
                fill={
                  /[.!?]/.test(ch) && i === lastIdx ? accent : `url(#${uid})`
                }
                style={{ fontKerning: "none" }}
              >
                {ch}
              </text>
            ),
          )}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: margin - 12 * u,
          bottom: margin - 7 * u,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontFamily: brand,
          fontWeight: 500,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-0.005em",
          fontVariantNumeric: "tabular-nums",
          // A stage-coloured pill keeps the label legible over the letterforms.
          padding: `${7 * u}px ${12 * u}px`,
          borderRadius: 999,
          background: c.bg,
          color: c.muted,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 8 * u}px)`,
        }}
      >
        <span style={{ color: c.fg }}>{index}</span>
        <span>/</span>
        {label.trim().toLowerCase() === "remocn" ? (
          <RemocnLogo fontSize={fontSize * 1.05} color={c.muted} />
        ) : (
          <span>{label}</span>
        )}
      </div>

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
