"use client";

import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const inter = loadInterTight("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface PointExpandProps {
  statements?: string[];
  pulses?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const PALETTES = {
  dark: { stage: "#0A0A0B", stageFg: "#F4F3F0", beamFg: "#F7F8FF" },
  light: { stage: "#F5F4F0", stageFg: "#111113", beamFg: "#F7F8FF" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_EXPAND = Easing.bezier(0.7, 0, 0.25, 1);
const EASE_DROP = Easing.bezier(0.3, 1.35, 0.5, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const INTER_TIGHT_500 = [
  223, 271, 452, 595, 601, 786, 608, 269, 324, 324, 479, 624, 274, 420, 260,
  325, 604, 370, 571, 602, 611, 575, 589, 527, 588, 589, 260, 271, 624, 624,
  624, 483, 926, 657, 612, 693, 679, 561, 544, 707, 699, 227, 509, 623, 522,
  858, 706, 726, 597, 727, 603, 601, 608, 695, 657, 940, 624, 643, 597, 324,
  325, 324, 433, 418, 402, 529, 574, 528, 574, 543, 327, 575, 561, 207, 207,
  514, 207, 843, 557, 560, 574, 574, 342, 493, 330, 553, 524, 783, 509, 524,
  509, 396, 301, 396, 624,
];
const KERN_PAIRS = [
  "AC-35 AG-35 AO-35 AQ-35 AT-86 AV-76 AW-62 AY-74 Ac-8 Ad-8 Ae-8 Ag-8",
  "Ao-8 Aq-8 At-34 Av-68 Aw-68 Ay-68 CX-9 DA-35 DT-31 DV-36 DW-9 DX-19",
  "DY-37 D.-45 D,-45 FA-91 FJ-68 Fc-40 Fd-40 Fe-40 Fg-40 Fo-40 Fq-40",
  "Fu-34 Fv-34 Fy-34 Fz-34 F.-34 F,-40 GA-22 GT-30 GV-22 GX-9 GY-25 Gi34",
  "Gj34 J.-34 J,-34 KC-36 KG-36 KO-36 KQ-36 Kc-40 Kd-40 Ke-40 Kg-40 Ki34",
  "Ko-40 Kq-40 Ku-34 Kv-40 Kw-62 Ky-40 LA36 LC-28 LG-28 LO-28 LQ-28 LT-94",
  "LV-71 LW-14 LY-53 Lt-22 Lv-68 Ly-68 OA-35 OT-31 OV-36 OW-9 OX-19 OY-37",
  "O.-45 O,-45 PA-77 PJ-96 P.-34 P,-40 QA-35 QT-31 QV-36 QW-9 QX-19 QY-37",
  "Q.-45 Q,-45 RV-18 RY-26 TA-86 TC-31 TG-31 TJ-91 TO-31 TQ-31 TY16 Ta-74",
  "Tc-78 Td-78 Te-78 Tg-78 Tm-57 Tn-57 To-78 Tp-57 Tq-78 Tr-57 Ts-74",
  "Tu-74 Tv-62 Tw-62 Tx-51 Ty-62 Tz-45 T.-34 T,-34 U.-34 U,-34 VA-76",
  "VC-36 VG-36 VJ-96 VO-36 VQ-36 Va-54 Vc-55 Vd-55 Ve-55 Vg-55 Vo-55",
  "Vq-55 Vs-45 V.-96 V,-96 WA-62 WC-9 WG-9 WJ-62 WO-9 WQ-9 Wa-53 Wc-50",
  "Wd-50 We-50 Wg-50 Wm-34 Wn-34 Wo-50 Wp-34 Wq-50 Wr-34 Ws-34 W.-96",
  "W,-96 XC-19 XG-19 XO-19 XQ-19 Xc-28 Xd-28 Xe-28 Xg-28 Xo-28 Xq-28",
  "YA-74 YC-37 YG-37 YJ-34 YO-37 YQ-37 YT16 Ya-82 Yc-89 Yd-89 Ye-89 Yg-89",
  "Ym-40 Yn-40 Yo-89 Yp-40 Yq-89 Yr-40 Ys-68 Yu-40 Y.-45 Y,-45 ZC-34",
  "ZG-34 ZO-34 ZQ-34 aT-45 aV-51 aW-51 aY-82 av-20 ay-20 bA-34 bT-78",
  "bV-55 bW-50 bX-28 bY-96 bv-19 bw-17 bx-21 by-19 cA-34 cT-78 cV-55",
  "cW-50 cX-28 cY-96 cv-19 cw-17 cx-21 cy-19 eA-34 eT-78 eV-55 eW-50",
  "eX-28 eY-96 ev-19 ew-17 ex-21 ey-19 fA-34 fJ-62 fY8 fa-17 fc-21 fd-21",
  "fe-21 fg-21 fo-21 fq-21 fs-21 f.-57 f,-57 gT-51 hT-45 hV-51 hW-51",
  "hY-82 hv-20 hy-20 iV34 iW34 jV34 jW34 kT-57 kc-22 kd-22 ke-22 kg-22",
  "ko-22 kq-22 mT-45 mV-51 mW-51 mY-82 mv-20 my-20 nT-45 nV-51 nW-51",
  "nY-82 nv-20 ny-20 oA-34 oT-78 oV-55 oW-50 oX-28 oY-96 ov-19 ow-17",
  "ox-21 oy-19 pA-34 pT-78 pV-55 pW-50 pX-28 pY-96 pv-19 pw-17 px-21",
  "py-19 qT-51 rA-40 rJ-57 rT-57 rZ-34 rc-20 rd-20 re-20 rf31 rg-20 ro-20",
  "rq-20 rt31 rv17 rw8 rx17 ry17 r.-62 r,-62 sT-74 sV-45 sW-34 sY-74 tB11",
  "tD11 tE11 tF11 tH11 tI11 tK11 tL11 tM11 tN11 tP11 tR11 tT-34 tV-8 tW-8",
  "tY-13 tb11 th11 tk11 tl11 ts-9 uT-51 uY-57 vA-68 vJ-62 vT-34 vY-34",
  "va-16 vc-19 vd-19 ve-19 vg-19 vo-19 vq-19 v.-42 v,-42 wA-68 wJ-57",
  "wT-51 wZ-34 wc-17 wd-17 we-17 wg-17 wo-17 wq-17 w.-74 w,-74 xT-51",
  "xc-21 xd-21 xe-21 xg-21 xo-21 xq-21 yA-68 yJ-62 yT-34 yY-34 ya-16",
  "yc-19 yd-19 ye-19 yg-19 yo-19 yq-19 y.-42 y,-42 zT-34 zc-16 zd-16",
  "ze-16 zg-16 zo-16 zq-16 .T-34 .Y-45 ,T-34 ,Y-45",
].join(" ");
const KERN = new Map<string, number>(
  KERN_PAIRS.split(" ").map((t) => [t.slice(0, 2), Number(t.slice(2)) / 1000]),
);
const TRACK = -0.02;
const ASC = 0.969;
const DESC = 0.241;
const LINE = 1.08;
const DOT = 0.15;
const DOT_GAP = 0.05;

function textEm(text: string) {
  let w = 0;
  let prev = "";
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c <= 126 ? INTER_TIGHT_500[c - 32] : 580) / 1000 + TRACK;
    w += KERN.get(prev + ch) ?? 0;
    prev = ch;
  }
  return w;
}

function breakLines(text: string, maxEm: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = textEm(words.join(" ")) + DOT_GAP + DOT;
  const count = Math.max(1, Math.ceil(total / maxEm));
  const greedy = (target: number) => {
    const lines: string[][] = [[]];
    for (const w of words) {
      const cur = lines[lines.length - 1];
      const next = [...cur, w].join(" ");
      if (cur.length && textEm(next) + DOT_GAP + DOT > target) lines.push([w]);
      else cur.push(w);
    }
    return lines;
  };
  let target = total / count;
  let lines = greedy(target);
  while (lines.length > count && target < maxEm) {
    target = Math.min(maxEm, target * 1.04);
    lines = greedy(target);
  }
  return lines;
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
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function PointExpand({
  statements = [
    "Launch films used to take weeks.",
    "Now they take an afternoon.",
    "Copy, paste, render.",
  ],
  pulses = 2,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: PointExpandProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = PALETTES[theme];
  const list = (statements.length ? statements : [""]).slice(0, 5);
  const count = list.length;

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);
  const maxW = width * (portrait ? 0.84 : 0.78);
  const baseFs = (portrait ? 112 : 108) * s;

  const scenes = list.map((raw, k) => {
    const text = raw.trim().replace(/[.。]+$/, "");
    const cap = portrait ? 3 : 2;
    let fs = baseFs;
    let lines = breakLines(text, maxW / fs);
    for (let i = 0; i < 10 && lines.length > cap; i++) {
      fs *= 0.9;
      lines = breakLines(text, maxW / fs);
    }
    const lh = fs * LINE;
    const top = (height - lines.length * lh) / 2;
    const baseline = ((LINE - (ASC + DESC)) / 2 + ASC) * fs;
    const rows = lines.map((words, li) => {
      const t = words.join(" ");
      const last = li === lines.length - 1;
      const w = (textEm(t) + (last ? DOT_GAP + DOT : 0)) * fs;
      return { words, left: (width - w) / 2, w, y: top + li * lh };
    });
    const lastRow = rows[rows.length - 1];
    const r = (DOT * fs) / 2;
    const point = {
      x: lastRow.left + lastRow.w - r,
      y: lastRow.y + baseline - r - fs * 0.002,
      r,
    };
    const beam = k % 2 === 1;
    return { text, fs, lh, rows, point, beam };
  });

  const RISE = 14;
  const STAGGER = 2;
  const HOLD = 6;
  const PULSE = 7;
  const EXPAND = 18;
  const starts: number[] = [];
  const expands: number[] = [];
  let t = 2;
  for (let k = 0; k < count; k++) {
    starts.push(t);
    const words = scenes[k].rows.reduce((m, r) => m + r.words.length, 0);
    const landed = t + RISE + (words - 1) * STAGGER;
    const expandAt = landed + HOLD + pulses * PULSE;
    expands.push(expandAt);
    t = expandAt + EXPAND * 0.5;
  }
  const radius = (k: number) => {
    if (k === 0) return Number.POSITIVE_INFINITY;
    const { point } = scenes[k - 1];
    const far = Math.max(
      Math.hypot(point.x, point.y),
      Math.hypot(width - point.x, point.y),
      Math.hypot(point.x, height - point.y),
      Math.hypot(width - point.x, height - point.y),
    );
    const e = interpolate(
      frame,
      [expands[k - 1], expands[k - 1] + EXPAND],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_EXPAND,
      },
    );
    if (e <= 0) return 0;
    return point.r + (far + 4 - point.r) * e;
  };

  const pointFill = (k: number) => {
    if (k === count - 1) return scenes[k].beam ? p.stage : accent;
    return scenes[k + 1].beam ? accent : p.stage;
  };

  return (
    <AbsoluteFill style={{ background: p.stage, overflow: "hidden" }}>
      {scenes.map((sc, k) => {
        const r = radius(k);
        if (r <= 0.5) return null;
        if (k + 1 < count && radius(k + 1) > Math.hypot(width, height) * 1.5)
          return null;
        const origin = k > 0 ? scenes[k - 1].point : null;
        const fg = sc.beam ? p.beamFg : p.stageFg;
        const sink =
          k + 1 < count
            ? interpolate(frame, [expands[k], expands[k] + EXPAND], [0, 1], {
                ...CLAMP,
                easing: EASE_EXPAND,
              })
            : 0;
        const settle = Math.max(
          0,
          interpolate(frame, [starts[k] - 4, starts[k] + 40], [1, 0], {
            ...CLAMP,
            easing: EASE_OUT,
          }),
        );
        const ox = origin ? origin.x : width / 2;
        const oy = origin ? origin.y : height / 2;
        const ground = sc.beam
          ? [
              `radial-gradient(circle at ${ox}px ${oy}px, ${accent} 0%, color-mix(in oklab, ${BEAM[2]} 85%, ${accent}) ${(0.12 * width).toFixed(0)}px, ${BEAM[3]} ${(0.62 * width).toFixed(0)}px, #0b0a2e ${(1.1 * width).toFixed(0)}px)`,
              `radial-gradient(60% 60% at 50% 120%, color-mix(in oklab, ${BEAM[1]} 28%, transparent) 0%, transparent 70%)`,
            ].join(", ")
          : origin
            ? `radial-gradient(circle at ${ox}px ${oy}px, color-mix(in oklab, ${accent} ${theme === "dark" ? 16 : 10}%, ${p.stage}) 0%, ${p.stage} ${(0.7 * width).toFixed(0)}px)`
            : p.stage;
        const words = sc.rows.reduce((m, row) => m + row.words.length, 0);
        const landed = starts[k] + RISE + (words - 1) * STAGGER;
        const drop = interpolate(frame, [landed - 6, landed + 4], [0, 1], {
          ...CLAMP,
          easing: EASE_DROP,
        });
        const last = k === count - 1;
        const nPulses = last ? 1 : pulses;
        const pulseStart = landed + HOLD;
        let pulseScale = 1;
        const rings: { r: number; o: number }[] = [];
        for (let i = 0; i < nPulses; i++) {
          const a = pulseStart + i * PULSE;
          const u = interpolate(frame, [a, a + PULSE], [0, 1], CLAMP);
          if (u > 0 && u < 1)
            pulseScale += Math.sin(u * Math.PI) * (last ? 0.18 : 0.38);
          const ru = interpolate(frame, [a + 1, a + 1 + PULSE * 2.2], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          if (ru > 0 && ru < 1)
            rings.push({ r: sc.point.r * (1.2 + 3.4 * ru), o: (1 - ru) * 0.7 });
        }
        const pre = last
          ? 1
          : 1 -
            0.18 *
              Math.sin(
                interpolate(
                  frame,
                  [expands[k] - 4, expands[k] + 2],
                  [0, 1],
                  CLAMP,
                ) * Math.PI,
              );
        const dotScale = (0.55 + 0.45 * drop) * pulseScale * pre;
        const fill = pointFill(k);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              inset: 0,
              clipPath: Number.isFinite(r)
                ? `circle(${r.toFixed(2)}px at ${ox.toFixed(2)}px ${oy.toFixed(2)}px)`
                : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: ground,
                transform: `scale(${(1 + settle * 0.04).toFixed(4)})`,
                transformOrigin: `${ox}px ${oy}px`,
              }}
            />
            <Grain opacity={sc.beam ? 0.07 : theme === "dark" ? 0.05 : 0.035} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${(1 - sink * 0.05 + settle * 0.02).toFixed(4)})`,
                transformOrigin: `${sc.point.x}px ${sc.point.y}px`,
                opacity: 1 - sink * 0.35,
              }}
            >
              {(() => {
                let wi = 0;
                return sc.rows.map((row, li) => (
                  <div
                    key={li}
                    style={{
                      position: "absolute",
                      left: row.left,
                      top: row.y,
                      height: sc.lh,
                      lineHeight: `${sc.lh}px`,
                      fontFamily: inter.fontFamily,
                      fontWeight: 500,
                      fontSize: sc.fs,
                      letterSpacing: `${TRACK}em`,
                      color: fg,
                      whiteSpace: "nowrap",
                      display: "flex",
                      fontVariantLigatures: "none",
                    }}
                  >
                    {row.words.map((w, j) => {
                      const idx = wi++;
                      const u = interpolate(
                        frame,
                        [
                          starts[k] + idx * STAGGER,
                          starts[k] + idx * STAGGER + RISE,
                        ],
                        [0, 1],
                        { ...CLAMP, easing: EASE_OUT },
                      );
                      return (
                        <span
                          key={j}
                          style={{
                            display: "inline-block",
                            overflow: "hidden",
                            height: sc.lh + sc.fs * 0.1,
                            paddingRight: "0.04em",
                            marginRight:
                              j < row.words.length - 1
                                ? `${(INTER_TIGHT_500[0] / 1000 + TRACK - 0.04).toFixed(3)}em`
                                : "-0.04em",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              transform: `translateY(${((1 - u) * 118).toFixed(2)}%)`,
                            }}
                          >
                            {w}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ));
              })()}
              <svg
                width={width}
                height={height}
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
                aria-hidden
              >
                {rings.map((ring, i) => (
                  <circle
                    key={i}
                    cx={sc.point.x}
                    cy={sc.point.y}
                    r={ring.r}
                    fill="none"
                    stroke={fill}
                    strokeWidth={Math.max(1, 1.6 * s)}
                    opacity={ring.o}
                  />
                ))}
                {drop > 0 ? (
                  <circle
                    cx={sc.point.x}
                    cy={sc.point.y - (1 - drop) * sc.fs * 0.35}
                    r={sc.point.r * dotScale}
                    fill={fill}
                    opacity={Math.min(1, drop * 2)}
                  />
                ) : null}
              </svg>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
