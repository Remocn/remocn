"use client";

import { loadFont } from "@remotion/google-fonts/Oswald";
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

export interface StripeMaskProps {
  /** Headline. Breaks into a new line after each sentence. */
  title?: string;
  /** Stripe slant in degrees, leaning right. */
  slant?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Oswald 500, per 1000 em, chars 32–126 (harfbuzz): advance, left and right side bearing.
const ADV = [
  243, 233, 315, 511, 488, 950, 587, 149, 319, 295, 411, 433, 213, 314, 217,
  396, 534, 382, 497, 496, 504, 493, 521, 413, 510, 521, 239, 251, 386, 429,
  386, 483, 928, 522, 557, 540, 557, 428, 413, 559, 586, 275, 326, 532, 421,
  683, 545, 563, 527, 564, 561, 494, 430, 566, 516, 712, 499, 487, 425, 336,
  396, 317, 460, 356, 293, 435, 477, 440, 473, 446, 304, 472, 478, 248, 250,
  471, 252, 718, 474, 455, 476, 474, 353, 400, 330, 473, 404, 593, 416, 421,
  370, 338, 251, 351, 465,
];
const LSB = [
  0, 48, 23, 40, 30, 41, 48, 23, 67, 32, 42, 26, 42, 36, 47, 36, 56, 26, 41, 39,
  32, 45, 55, 21, 44, 41, 64, 63, 41, 59, 56, 40, 52, 20, 61, 49, 61, 61, 61,
  49, 63, 65, 10, 61, 61, 59, 61, 49, 61, 49, 61, 41, 13, 55, 22, 31, 10, 10,
  33, 57, 36, 23, 32, 0, 49, 22, 53, 41, 42, 41, 18, 23, 54, 56, -18, 53, 61,
  52, 52, 41, 52, 43, 55, 22, 18, 47, 12, 24, 10, 7, 34, 44, 66, 40, 38,
];
const RSB = [
  243, 48, 12, 38, 31, 41, 48, 11, 33, 44, 20, 26, 38, 36, 38, 36, 56, 93, 32,
  35, 17, 32, 43, 37, 43, 56, 45, 55, 46, 59, 31, 38, 32, 20, 35, 42, 48, 25,
  19, 52, 63, 64, 62, 6, 16, 59, 62, 48, 21, 49, 38, 26, 13, 55, 22, 31, 9, 10,
  24, 43, 36, 57, 31, 0, 48, 37, 42, 37, 51, 40, 8, -14, 48, 56, 51, 1, 56, 49,
  48, 41, 42, 51, 15, 22, 23, 53, 11, 25, 5, 11, 25, 27, 67, 44, 34,
];
const KERN = new Map(
  [
    "&T-24 *J-18 *X-12 ,B-6 ,C-12 ,D-6 ,E-6 ,F-6 ,G-12 ,H-6 ,I-6 ,K-6 ,L-6",
    ",N-6 ,O-12 ,P-6 ,Q-12 ,R-6 ,T-56 ,U-12 ,V-46 ,W-38 ,Y-60 ,t-18 ,v-10",
    ",w-12 ,y-18 -T-30 -V-24 -W-6 -X-12 -Y-30 .B-6 .C-12 .D-6 .E-6 .F-6",
    ".G-12 .H-6 .I-6 .K-6 .L-6 .N-6 .O-12 .P-6 .Q-12 .R-6 .T-56 .U-12 .V-46",
    ".W-38 .Y-60 .t-18 .v-10 .w-12 .y-18 /C-12 /G-12 /O-12 /Q-12 /S-18 /c-36",
    "/d-36 /e-36 /o-36 /q-36 07-6 0X-6 0Y-12 17-8 24-12 41-12 47-14 57-12",
    "61-6 62-6 67-10 69-9 6Y-6 74-28 87-13 8Y-6 97-16 :T-66 :V-12 :W-18",
    ":Y-46 ;T-66 ;V-12 ;W-18 ;Y-46 AC-9 AG-9 AO-9 AS-6 AT-43 AU-6 AV-36",
    "AW-23 AY-42 Af-15 At-12 Aw-18 Ay-18 B,-12 B.-12 BT-21 BV-24 BX-20 BY-17",
    "C,-6 C.-6 CX-6 D,-12 D.-12 D7-6 DA-9 DJ-6 DT-6 DV-6 DX-12 DY-12 DZ-6",
    "F,-73 F.-73 F:-16 F;-16 FA-35 FJ-26 Fa-20 Fc-12 Fd-12 Fe-12 Fo-12 Fq-12",
    "Fs-14 Fx-6 Fy-6 Fz-16 GT-15 GV-8 GY-14 J,-32 J.-32 K--18 KC-21 KG-21",
    "KO-21 KQ-17 KS-13 Kc-14 Kd-14 Ke-14 Ko-14 Kq-14 Kt-12 Ku-7 Kw-20 Ky-32",
    "L*-78 L--30 L1-24 L7-6 LC-10 LG-10 LO-10 LQ-13 LS-6 LT-73 LU-14 LV-71",
    "LW-47 LY-86 Lf-16 Lt-18 Lw-32 Ly-52 MS-9 MT-7 MV-6 MY-6 O,-12 O.-12",
    "O7-6 OA-9 OJ-6 OT-6 OV-6 OX-12 OY-12 OZ-6 P,-86 P--68 P.-96 P/-64 P4-16",
    "P7-6 PA-47 PJ-26 PS-6 PX-14 PZ-16 Pa-31 Pc-21 Pd-21 Pe-21 Pg-22 Po-21",
    "Ps-18 Pz-12 Q,-12 Q.-12 Q7-6 QA-9 QJ-6 QT-6 QV-6 QX-12 QY-12 QZ-6 RC-6",
    "RG-6 RO-6 RQ-6 RT-12 RV-8 RY-19 Ra-10 Rc-15 Rd-15 Re-15 Ro-15 Rq-15",
    "Ry-6 Rz-12 S/-12 SA-6 SM-6 SS-12 SV-6 SX-6 SY-6 T&-6 T,-56 T--30 T.-56",
    "T/-36 T:-66 T;-66 TA-43 TC-6 TG-6 TJ-26 TM-7 TO-6 TQ-6 Ta-68 Tc-58",
    "Td-58 Te-58 Tf-28 Tg-60 Tj-8 Tm-54 Tn-54 To-58 Tp-54 Tr-54 Ts-63 Tt-14",
    "Tu-45 Tw-58 Tx-46 Ty-52 Tz-48 U,-12 U.-12 U/-18 UA-6 V,-52 V--24 V.-52",
    "V:-18 V;-18 VA-36 VC-7 VG-7 VJ-12 VM-6 VO-7 VQ-7 Va-53 Vc-37 Vd-37",
    "Ve-37 Vg-46 Vm-24 Vn-24 Vo-37 Vp-27 Vq-32 Vr-24 Vs-34 Vt-6 Vu-25 Vv-16",
    "Vw-20 Vx-24 Vy-22 Vz-40 W,-38 W--6 W.-38 W/-24 W:-18 W;-18 WA-23 Wa-30",
    "Wc-22 Wd-22 We-22 Wf-6 Wg-26 Wm-16 Wn-16 Wo-22 Wp-10 Wr-16 Ws-10 Wv-6",
    "Ww-6 Wx-6 X*-18 X--12 X0-6 XC-12 XG-12 XO-12 XQ-12 XS-11 Xa-6 Xc-10",
    "Xd-10 Xe-10 Xf-12 Xg-6 Xo-10 Xq-10 Xs-16 Xt-12 Xv-24 Xw-26 Xy-30 Y,-72",
    "Y--30 Y.-72 Y/-30 Y0-12 Y4-18 Y6-6 Y8-6 Y:-52 Y;-52 YA-42 YC-12 YG-12",
    "YJ-12 YM-6 YO-12 YQ-12 YS-6 Ya-66 Yc-60 Yd-60 Ye-60 Yf-32 Yg-60 Ym-52",
    "Yn-52 Yo-60 Yp-43 Yq-13 Yr-52 Ys-49 Yu-48 Yw-37 Yx-40 Yy-30 Yz-32 ZC-6",
    "ZG-6 ZO-6 ZQ-6 Za-6 Zc-6 Zd-6 Ze-6 Zo-6 Zq-6 aT-55 aV-45 aW-24 aY-63",
    "bT-58 bV-36 bW-20 bY-60 bx-8 cT-45 cV-11 cY-45 dT38 dV18 dW18 dY24",
    "eT-58 eV-27 eW-7 eY-57 ex-10 f.-20 f:-6 f;-6 fA-6 fa-12 fc-7 fd-7 fe-7",
    "fo-7 fq-7 gT-26 gV-6 gX-12 gY-10 gg-6 gj18 gt6 gw6 gy10 hT-54 hV-30",
    "hW-16 hY-52 kT-36 kV-8 kW-6 kY-32 kc-11 kd-11 ke-11 kg-6 ko-11 kq-11",
    "ks-6 lT16 lV8 lW8 lY12 mT-54 mV-30 mW-16 mY-52 nT-54 nV-30 nW-16 nY-52",
    "oT-58 oV-36 oW-20 oY-60 ox-8 pT-58 pV-36 pW-20 pY-60 px-8 qT-50 qV-14",
    "qY-37 r,-84 r.-84 rA-28 rJ-18 rT-48 rX-24 rY-22 rZ-20 ra-13 rg-8 rq-16",
    "sT-55 sV-32 sX-6 sY-57 tT-16 tV-13 tY-18 tg-6 uT-53 uV-20 uY-48 v,-29",
    "v.-30 vA-22 vJ-18 vT-62 vV-20 vW-6 vX-24 vY-36 vZ-20 va-9 vg-8 w,-17",
    "w.-20 wA-16 wJ-30 wT-58 wV-20 wW-6 wX-26 wY-36 wZ-12 wa-10 wg-6 xT-46",
    "xV-24 xW-6 xY-40 xc-10 xd-10 xe-10 xo-10 xq-10 y,-33 y.-33 yA-22 yJ-18",
    "yT-62 yV-20 yW-6 yX-24 yY-36 yZ-20 ya-9 yg-8 zT-46 zV-17 zY-32 zc-6",
    "zd-6 ze-6 zg-6 zo-6 zq-6",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.81;
const DESC = 0.19;
const TRACK = -0.008;
const PITCH = 1.0;

// Beat sheet (30fps, speed 1):
//  0–40    three accent bars sweep in from the left, staggered, decelerating;
//          the headline drifts the other way and only shows inside the bars,
//          so its letters slide through them
//  44–60   the bars widen and merge into one slab: the full headline on accent
//  60–70   hold on the slab
//  70–96   the slab breaks back into three thin bars that slide left and park
//          as a mark beside the headline, wiping it to ink on the stage
//  96–     poster hold
const SWEEP_AT = -6;
const SWEEP_LEN = 46;
const SWEEP_STAGGER = 5;
const DRIFT_LEN = 52;
const WIDEN_AT = 44;
const WIDEN_LEN = 13;
const WIDEN_STAGGER = 2;
const RETRACT_AT = 70;
const RETRACT_LEN = 24;
const RETRACT_STAGGER = 3;

const SWEEP = Easing.bezier(0.2, 0.8, 0.3, 1);
const DRIFT = Easing.bezier(0.3, 0.55, 0.35, 1);
const WIDEN = Easing.bezier(0.7, 0, 0.25, 1);
const MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const THIN = Easing.bezier(0.3, 0.9, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: { stage: "#0A0A0B", ink: "#F3F2EF", onAccent: "#F3F2EF" },
  light: { stage: "#F5F4F0", ink: "#121214", onAccent: "#F5F4F0" },
} as const;

// gradients.sh "beam" (bg #02030a): deep indigo at the top of the frame,
// through the accent, to pale blue at the bottom. It lives in frame space, so
// the bars read as windows onto one beam of light. The light stage drops the
// palest stop so the bars keep their edge on off-white.
const BEAM = ["#1a1660", "#8fb4ff", "#f4f7ff"] as const;

function code(ch: string) {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c - 32;
  if (ch === "’" || ch === "‘") return 7;
  return 46;
}

/** Advance and ink box of a line, in em, with tracking. */
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

/** A slanted bar: center and width measured on the headline's center line. */
interface Bar {
  c: number;
  w: number;
  top: number;
  bottom: number;
}

const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export function StripeMask({
  title = "Faster. Every frame.",
  slant = 18,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: StripeMaskProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `sm${uid}`;
  const beamId = `smb${uid}`;

  const lines = title
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const metrics = lines.map(measure);
  const k = Math.tan((slant * Math.PI) / 180);

  // Lockup in em: mark, gap, headline block.
  const blockEm = CAP + (lines.length - 1) * PITCH;
  const textEm = Math.max(...metrics.map((m) => m.ink));
  const stripeEm = 0.11;
  const stripeGapEm = 0.08;
  const markEm = 3 * stripeEm + 2 * stripeGapEm + blockEm * k;
  const gapEm = 0.3;
  const lockEm = markEm + gapEm + textEm;
  const fs = Math.min((0.8 * W) / lockEm, (0.52 * H) / (blockEm + DESC));

  const x0 = (W - lockEm * fs) / 2;
  const tx = x0 + (markEm + gapEm) * fs;
  const textW = textEm * fs;
  const blockTop = (H - blockEm * fs) / 2 - 0.02 * H;
  const blockBottom = blockTop + blockEm * fs;
  const yc = (blockTop + blockBottom) / 2;
  const baselines = lines.map((_, i) => blockTop + (CAP + i * PITCH) * fs);

  // A bar leans right toward the top; x offset of its edges at height y.
  const shift = (y: number) => (yc - y) * k;

  const fullTop = -0.08 * H;
  const fullBottom = 1.08 * H;
  const pad = 0.06 * fs;
  const slabL = tx - pad - shift(blockTop - pad);
  const slabR = tx + textW + pad - shift(blockBottom + DESC * fs + pad);
  const third = (slabR - slabL) / 3;
  const sw = stripeEm * fs;
  const sg = stripeGapEm * fs;

  const bars: Bar[] = [0, 1, 2].map((i) => {
    const restC = tx + textW * (1 / 6 + i / 3);
    const restW = textW * 0.17;
    const mergedC = slabL + (i + 0.5) * third;
    // Overlap generously so no hairline seams survive the merge.
    const mergedW = third * 1.2;
    const markC = x0 + i * (sw + sg) + sw / 2 - shift(blockBottom);

    // The rightmost bar leads the sweep; the leftmost leads the retreat, so
    // the bars spread apart on the way back and never overlap.
    const lead = 2 - i;
    const sweepFrom = SWEEP_AT + lead * SWEEP_STAGGER;
    const sweep = SWEEP(
      interpolate(t, [sweepFrom, sweepFrom + SWEEP_LEN], [0, 1], CLAMP),
    );
    const widenFrom = WIDEN_AT + Math.abs(i - 1) * WIDEN_STAGGER;
    const widen = WIDEN(
      interpolate(t, [widenFrom, widenFrom + WIDEN_LEN], [0, 1], CLAMP),
    );
    const retractFrom = RETRACT_AT + i * RETRACT_STAGGER;
    const local = interpolate(
      t,
      [retractFrom, retractFrom + RETRACT_LEN],
      [0, 1],
      CLAMP,
    );
    const move = MOVE(local);
    // Bars thin out ahead of the move, so the slab splits back into three.
    const thin = THIN(Math.min(1, local / 0.7));

    const center = mix(mix(restC, mergedC, widen), markC, move);
    return {
      c: center - (1 - sweep) * 1.15 * W,
      w: mix(mix(restW, mergedW, widen), sw, thin),
      top: mix(fullTop, blockTop, move),
      bottom: mix(fullBottom, blockBottom, move),
    };
  });

  const points = (b: Bar) =>
    [
      [b.c - b.w / 2 + shift(b.top), b.top],
      [b.c + b.w / 2 + shift(b.top), b.top],
      [b.c + b.w / 2 + shift(b.bottom), b.bottom],
      [b.c - b.w / 2 + shift(b.bottom), b.bottom],
    ]
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

  const drift =
    (1 -
      DRIFT(interpolate(t, [SWEEP_AT, SWEEP_AT + DRIFT_LEN], [0, 1], CLAMP))) *
    0.5 *
    W;
  // The beam rises a few percent of the frame over the shot.
  const beamDrift = interpolate(t, [0, 120], [0, 0.06 * H], CLAMP);
  // The ink copy may only appear once the slab hides it completely.
  const merged = t >= WIDEN_AT + WIDEN_STAGGER + WIDEN_LEN;

  const headline = (fill: string, dx: number) =>
    lines.map((line, i) => (
      <text
        key={`${line}-${i}`}
        x={tx - metrics[i].lsb * fs + dx}
        y={baselines[i]}
        fill={fill}
        fontFamily={display}
        fontWeight={500}
        fontSize={fs}
        style={{ letterSpacing: `${TRACK}em`, fontKerning: "normal" }}
      >
        {line}
      </text>
    ));

  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-label={title}
        role="img"
      >
        <defs>
          <linearGradient
            id={beamId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={fullTop - beamDrift}
            x2={0.12 * W}
            y2={fullBottom - beamDrift}
          >
            <stop offset="0" stopColor={BEAM[0]} />
            <stop offset="0.62" stopColor={accent} />
            <stop offset="0.94" stopColor={BEAM[1]} />
            {theme === "dark" ? <stop offset="1" stopColor={BEAM[2]} /> : null}
          </linearGradient>
          <clipPath id={clipId}>
            {bars.map((b, i) => (
              <polygon key={["a", "b", "c"][i]} points={points(b)} />
            ))}
          </clipPath>
        </defs>
        {merged ? <g>{headline(c.ink, 0)}</g> : null}
        {bars.map((b, i) => (
          <polygon
            key={["a", "b", "c"][i]}
            points={points(b)}
            fill={`url(#${beamId})`}
          />
        ))}
        <g clipPath={`url(#${clipId})`}>{headline(c.onAccent, drift)}</g>
      </svg>
    </AbsoluteFill>
  );
}
