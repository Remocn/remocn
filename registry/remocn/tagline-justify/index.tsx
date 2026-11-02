"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadTight("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface TaglineJustifyProps {
  words?: string[];
  text?: string;
  highlight?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/** Inter Tight 500 advance widths (per 1000 em) for ASCII 32–126. */
const TIGHT_500 = [
  223, 271, 452, 595, 601, 786, 608, 269, 324, 324, 479, 624, 274, 420, 260,
  325, 604, 370, 571, 602, 611, 575, 589, 527, 588, 589, 260, 271, 624, 624,
  624, 483, 926, 657, 612, 693, 679, 561, 544, 707, 699, 227, 509, 623, 522,
  858, 706, 726, 597, 727, 603, 601, 608, 695, 657, 940, 624, 643, 597, 324,
  325, 324, 433, 418, 402, 529, 574, 528, 574, 543, 327, 575, 561, 207, 207,
  514, 207, 843, 557, 560, 574, 574, 342, 493, 330, 553, 524, 783, 509, 524,
  509, 396, 301, 396, 624,
];
/** Instrument Serif Italic 400 advance widths (per 1000 em) for ASCII 32–126. */
const SERIF_ITALIC = [
  170, 275, 374, 629, 424, 591, 525, 235, 346, 346, 449, 531, 219, 426, 219,
  258, 461, 248, 404, 373, 394, 387, 411, 365, 437, 414, 299, 301, 531, 531,
  531, 358, 665, 457, 479, 475, 536, 454, 411, 514, 545, 250, 251, 499, 414,
  665, 542, 540, 469, 541, 525, 424, 461, 537, 458, 653, 545, 478, 427, 326,
  256, 326, 431, 372, 355, 474, 431, 351, 474, 348, 273, 401, 476, 288, 266,
  447, 240, 745, 521, 414, 450, 425, 368, 302, 272, 508, 412, 609, 450, 418,
  385, 320, 252, 320, 531,
];
/** Inter Tight 500 GPOS kerning (|k| ≥ 30/1000), "pairValue". */
const KERN_PAIRS = [
  "AC-35 AG-35 AO-35 AQ-35 AT-86 AV-76 AW-62 AY-74 At-34 Av-68 Aw-68 Ay-68",
  "DA-35 DT-31 DV-36 DY-37 D.-45 D,-45 FA-91 FJ-68 Fc-40 Fd-40 Fe-40 Fg-40",
  "Fo-40 Fq-40 Fu-34 Fv-34 Fy-34 Fz-34 F.-34 F,-40 GT-30 Gi34 Gj34 J.-34 J,-34",
  "KC-36 KG-36 KO-36 KQ-36 Kc-40 Kd-40 Ke-40 Kg-40 Ki34 Ko-40 Kq-40 Ku-34",
  "Kv-40 Kw-62 Ky-40 LA36 LT-94 LV-71 LY-53 Lv-68 Ly-68 OA-35 OT-31 OV-36",
  "OY-37 O.-45 O,-45 PA-77 PJ-96 P.-34 P,-40 QA-35 QT-31 QV-36 QY-37 Q.-45",
  "Q,-45 TA-86 TC-31 TG-31 TJ-91 TO-31 TQ-31 Ta-74 Tc-78 Td-78 Te-78 Tg-78",
  "Tm-57 Tn-57 To-78 Tp-57 Tq-78 Tr-57 Ts-74 Tu-74 Tv-62 Tw-62 Tx-51 Ty-62",
  "Tz-45 T.-34 T,-34 U.-34 U,-34 VA-76 VC-36 VG-36 VJ-96 VO-36 VQ-36 Va-54",
  "Vc-55 Vd-55 Ve-55 Vg-55 Vo-55 Vq-55 Vs-45 V.-96 V,-96 WA-62 WJ-62 Wa-53",
  "Wc-50 Wd-50 We-50 Wg-50 Wm-34 Wn-34 Wo-50 Wp-34 Wq-50 Wr-34 Ws-34 W.-96",
  "W,-96 YA-74 YC-37 YG-37 YJ-34 YO-37 YQ-37 Ya-82 Yc-89 Yd-89 Ye-89 Yg-89",
  "Ym-40 Yn-40 Yo-89 Yp-40 Yq-89 Yr-40 Ys-68 Yu-40 Y.-45 Y,-45 ZC-34 ZG-34",
  "ZO-34 ZQ-34 aT-45 aV-51 aW-51 aY-82 bA-34 bT-78 bV-55 bW-50 bY-96 cA-34",
  "cT-78 cV-55 cW-50 cY-96 eA-34 eT-78 eV-55 eW-50 eY-96 fA-34 fJ-62 f.-57",
  "f,-57 gT-51 hT-45 hV-51 hW-51 hY-82 iV34 iW34 jV34 jW34 kT-57 mT-45 mV-51",
  "mW-51 mY-82 nT-45 nV-51 nW-51 nY-82 oA-34 oT-78 oV-55 oW-50 oY-96 pA-34",
  "pT-78 pV-55 pW-50 pY-96 qT-51 rA-40 rJ-57 rT-57 rZ-34 rf31 rt31 r.-62",
  "r,-62 sT-74 sV-45 sW-34 sY-74 tT-34 uT-51 uY-57 vA-68 vJ-62 vT-34 vY-34",
  "v.-42 v,-42 wA-68 wJ-57 wT-51 wZ-34 w.-74 w,-74 xT-51 yA-68 yJ-62 yT-34",
  "yY-34 y.-42 y,-42 zT-34 .T-34 .Y-45 ,T-34 ,Y-45",
].join(" ");
const KERN = new Map(
  KERN_PAIRS.split(" ").map((p) => [p.slice(0, 2), Number(p.slice(2)) / 1000]),
);
const TRACK = -0.03;
const SPACE = 0.24;
const BASELINE = 0.8638;
const CAP = 0.728;
const ASC = 0.8;
const DESC = 0.17;
/** The highlight word is set in Instrument Serif Italic, scaled to match the grotesk's x-height. */
const SERIF_SCALE = 1.12;
const SERIF_TRACK = -0.01;
const SERIF_BASELINE = 0.84;

const STAGGER = 6;
const FIRST = 6;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "swirl" lives inside the highlight word (clip-text) and as a faint ember under it.
const THEMES = {
  dark: {
    bg: "#07060A",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F0EC",
    muted: "#8E8A93",
    hair: "rgba(255,255,255,0.18)",
    grain: 0.07,
    swirl: ["#FFE2C4", "#FF9A4D", "#D2456B"],
    ember: "rgba(210,69,107,0.16)",
  },
  light: {
    bg: "#F5F3EF",
    key: "rgba(255,255,255,0.9)",
    fg: "#141216",
    muted: "#6E6A70",
    hair: "rgba(20,18,22,0.2)",
    grain: 0.045,
    swirl: ["#FF9A4D", "#D2456B", "#3A1F6B"],
    ember: "rgba(255,154,77,0.14)",
  },
} as const;

function em(text: string) {
  let w = 0;
  let prev = "";
  for (const ch of text) {
    w += KERN.get(prev + ch) ?? 0;
    prev = ch;
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? TIGHT_500[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w;
}

function serifEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? SERIF_ITALIC[code - 32] : 420) / 1000;
    w += SERIF_TRACK;
  }
  return w * SERIF_SCALE;
}

function clean(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface Layout {
  lines: number[][];
  sizes: number[];
}

function* splits(n: number, k: number, from = 0): Generator<number[]> {
  if (k === 1) {
    yield [n];
    return;
  }
  for (let i = from + 1; i <= n - (k - 1); i++) {
    for (const rest of splits(n, k - 1, i)) yield [i, ...rest];
  }
}

function natural(widths: number[], line: number[]) {
  return line.reduce((s, j) => s + widths[j], 0) + SPACE * (line.length - 1);
}

function stackHeight(sizes: number[]) {
  let h = CAP * sizes[0];
  for (let i = 1; i < sizes.length; i++) {
    h += DESC * sizes[i - 1] + ASC * sizes[i];
  }
  return h;
}

function justifyLayout(widths: number[], key: number): Layout {
  const n = widths.length;
  const minLines = Math.min(3, Math.max(1, Math.floor(n / 2)));
  const maxLines = Math.max(minLines, Math.min(4, Math.floor(n / 2)));
  let best: Layout = { lines: [widths.map((_, i) => i)], sizes: [1] };
  let bestCost = Number.POSITIVE_INFINITY;
  for (let k = minLines; k <= maxLines; k++) {
    for (const ends of splits(n, k)) {
      const lines: number[][] = [];
      let start = 0;
      for (const end of ends) {
        lines.push(Array.from({ length: end - start }, (_, i) => start + i));
        start = end;
      }
      if (n > 1 && lines.some((l) => l.length < 2)) continue;
      const sizes = lines.map((l) => 1 / natural(widths, l));
      const logs = sizes.map(Math.log);
      const mean = logs.reduce((a, v) => a + v, 0) / k;
      let cost = logs.reduce((a, v) => a + (v - mean) ** 2, 0) * 12;
      const keyLine = lines.findIndex((l) => l.includes(key));
      if (keyLine >= 0) cost += (Math.max(...logs) - logs[keyLine]) * 1.5;
      const aspect = 1 / stackHeight(sizes);
      cost += Math.abs(aspect - 1.75) * 0.6;
      if (cost < bestCost) {
        bestCost = cost;
        best = { lines, sizes };
      }
    }
  }
  return best;
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        whiteSpace: "nowrap",
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

export function TaglineJustify({
  words: wordsProp,
  text = "Your launch deserves a film as good as the product.",
  highlight = "film",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TaglineJustifyProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const words = useMemo(
    () => wordsProp ?? text.trim().split(/\s+/),
    [wordsProp, text],
  );
  const target = clean(highlight);
  const widths = useMemo(
    () =>
      words.map((w) =>
        target !== "" && clean(w) === target ? serifEm(w) : em(w),
      ),
    [words, target],
  );
  const layout = useMemo(
    () =>
      justifyLayout(
        widths,
        words.findIndex((w) => target !== "" && clean(w) === target),
      ),
    [widths, words, target],
  );
  const { lines } = layout;

  const unitH = stackHeight(layout.sizes);
  const B = Math.min(W * 0.6, (H * 0.62) / unitH);
  const sizes = layout.sizes.map((k) => k * B);
  const blockH = unitH * B;
  const footGap = 44 * u;
  const footH = 26 * u;
  const groupH = blockH + footGap + footH;
  const left = (W - B) / 2;
  const capTop = (H - groupH) / 2;
  const baselines: number[] = [];
  sizes.forEach((F, i) => {
    baselines.push(
      i === 0
        ? capTop + CAP * F
        : baselines[i - 1] + DESC * sizes[i - 1] + ASC * F,
    );
  });
  const arrive = (j: number) => FIRST + j * STAGGER;
  const settle = (j: number) =>
    spring({
      frame: t - arrive(j),
      fps,
      config: { damping: 17, stiffness: 170, mass: 0.8 },
    });
  const push = interpolate(t, [0, 160], [0, 1], CLAMP);

  const nodes: React.ReactNode[] = [];
  const key: { box: { x: number; y: number; w: number; h: number } | null } = {
    box: null,
  };
  const sweep = interpolate(t, [0, 160], [0, 1], CLAMP);
  const swirlFill = `linear-gradient(${100 + sweep * 14}deg, ${c.swirl[0]} 0%, ${c.swirl[1]} ${42 + sweep * 6}%, ${c.swirl[2]} 100%)`;
  lines.forEach((line, li) => {
    const F = sizes[li];
    const width = B / F;
    const n = line.length;
    const levels: number[] = [];
    for (let m = 2; m <= n; m++) {
      const sum = line.slice(0, m).reduce((a, j) => a + widths[j], 0);
      levels[m] = (width - sum) / (m - 1);
    }
    levels[1] = (levels[2] ?? SPACE) + 1.1;
    let gap = levels[1];
    for (let m = 2; m <= n; m++) {
      gap += (levels[m] - levels[m - 1]) * settle(line[m - 1]);
    }
    let x = 0;
    line.forEach((j, k) => {
      const s = settle(j);
      const firstIn = k === 0 ? (1 - s) * 0.5 : 0;
      const o = interpolate(t, [arrive(j), arrive(j) + 6], [0, 1], CLAMP);
      const isKey = target !== "" && clean(words[j]) === target;
      const fill = isKey
        ? interpolate(t, [80, 98], [0, 1], { ...CLAMP, easing: EASE_IO })
        : 0;
      const anchor = k === 0 ? x : x + widths[j];
      const size = isKey ? F * SERIF_SCALE : F;
      if (isKey) {
        key.box = {
          x: left + (anchor + firstIn - (k === 0 ? 0 : widths[j])) * F,
          y: baselines[li],
          w: widths[j] * F,
          h: CAP * F,
        };
      }
      nodes.push(
        <div
          key={j}
          style={{
            position: "absolute",
            top: baselines[li] - (isKey ? SERIF_BASELINE : BASELINE) * size,
            left: left + (anchor + firstIn) * F,
            transform: k === 0 ? undefined : "translateX(-100%)",
            fontFamily: isKey ? serif : sans,
            fontStyle: isKey ? "italic" : "normal",
            fontWeight: isKey ? 400 : 500,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: `${isKey ? SERIF_TRACK : TRACK}em`,
            whiteSpace: "pre",
            color: c.fg,
            opacity: o,
          }}
        >
          {words[j]}
          {isKey ? (
            <span
              style={{
                position: "absolute",
                inset: "-0.1em -0.12em",
                padding: "0.1em 0.12em",
                color: "transparent",
                backgroundImage: swirlFill,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                clipPath: `inset(-10% ${(1 - fill) * 100}% -10% -2%)`,
              }}
            >
              {words[j]}
            </span>
          ) : null}
        </div>,
      );
      x += widths[j] + gap;
    });
  });

  const foot = (d: number) =>
    interpolate(t, [90 + d, 112 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const ruleP = interpolate(t, [84, 108], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const footTop = capTop + blockH + footGap;
  const emberIn = interpolate(t, [78, 110], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at 50% 40%, ${c.key}, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${1 + push * 0.025})`,
          transformOrigin: "50% 45%",
        }}
      >
        {key.box ? (
          <div
            style={{
              position: "absolute",
              left: key.box.x - key.box.w * 0.9,
              width: key.box.w * 2.8,
              top: key.box.y - key.box.h * 1.6,
              height: key.box.h * 2.6,
              background: `radial-gradient(50% 50% at 50% 50%, ${c.ember} 0%, transparent 70%)`,
              opacity: emberIn,
            }}
          />
        ) : null}
        {nodes}
        <div
          style={{
            position: "absolute",
            left,
            top: footTop - 18 * u,
            width: B,
            height: Math.max(1, u),
            background: `linear-gradient(90deg, ${accent} 0px, ${accent} ${36 * u}px, ${c.hair} ${36 * u}px)`,
            transform: `scaleX(${ruleP})`,
            transformOrigin: "0% 50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left,
            top: footTop,
            height: footH,
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            opacity: foot(0),
            transform: `translateY(${(1 - foot(0)) * 10 * u}px)`,
          }}
        >
          {logo ?? <RemocnLogo fontSize={24 * u} color={c.fg} />}
        </div>
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
