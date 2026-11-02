"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bricolage = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface SplitMatchProps {
  /**
   * Words in order; the reels lock on each one, the last one is the poster.
   * "remocn" is set as the real logo (R mark + "emocn" in Manrope).
   */
  words?: string[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps), four words:
//  0–10    both reels slam in from opposite sides and lock on word 1
//  10–26   hold: left half on stage, right half on a gradient panel, one word
//  26–35   step: left reel climbs, right reel drops, halves blur past each other
//  ...     two more step + lock beats
//  85      final lock on the last word
//  93–109  the seam closes: the gradient floods the left panel, neighbours fall away
//  109–145 poster hold with a slow push
const ENTER = 10;
const HOLD = 16;
const STEP = 9;
const MERGE_DELAY = 8;
const MERGE = 16;
const TAIL = 36;

export function splitMatchDuration(wordCount = 4) {
  return (
    ENTER +
    Math.max(0, wordCount - 1) * (HOLD + STEP) +
    MERGE_DELAY +
    MERGE +
    TAIL
  );
}

const WEIGHT = 500;
const TRACK = -0.035;
const LOGO_TRACK = -0.025;
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
/** As on remocn.dev: the mark is 0.76em tall and sits 0.04em before "emocn". */
const MARK_H = 0.76;
const MARK_W = (MARK_H * 124.06) / 134.26;
const MARK_GAP = 0.04;
const NARROW = "iljtfr.,'’!:;|";

const SNAP = Easing.bezier(0.78, 0, 0.18, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    onAccent: "#FFFFFF",
    dim: 0.26,
    dimAccent: 0.34,
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    onAccent: "#FFFFFF",
    dim: 0.2,
    dimAccent: 0.34,
    grain: 0.045,
  },
} as const;

/**
 * The panel: gradients.sh "mesh" on dark, "fluted" on light, with the
 * accent standing in for the palette's core blue. Blobs drift a few percent.
 */
function panelGradient(theme: "dark" | "light", accent: string, t: number) {
  const d = Math.sin(t / 40) * 3;
  const blob = (w: number, h: number, x: number, y: number, c: string) =>
    `radial-gradient(${w}% ${h}% at ${x}% ${y}%, ${c} 0%, transparent 68%)`;
  if (theme === "dark") {
    return [
      blob(46, 52, 88 - d, 12 + d, "rgba(236,220,242,0.85)"),
      blob(80, 90, 76 + d, 30, "#8796EE"),
      blob(90, 95, 40, 70 - d, accent),
      blob(85, 95, 12 + d, 96, "#0E1645"),
      "linear-gradient(160deg, #2E45B7, #0A0D24)",
    ].join(", ");
  }
  return [
    blob(30, 36, 92 - d, 6 + d, "rgba(255,226,196,0.9)"),
    blob(56, 64, 90 - d, 12 + d, "rgba(255,122,61,0.8)"),
    blob(80, 90, 70 + d, 40, "#2F7BFF"),
    blob(90, 95, 20, 96 - d, "#1D2A8F"),
    `linear-gradient(165deg, #2F7BFF, ${accent})`,
  ].join(", ");
}

function useMeasurer() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("split-match: measuring"));
  const released = useRef(false);
  const font = `${WEIGHT} 100px "${bricolage.fontFamily}"`;
  const logoFont = `600 100px "${manrope.fontFamily}"`;

  useEffect(() => {
    let live = true;
    Promise.all([
      bricolage.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(font),
      document.fonts.load(logoFont),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [font, logoFont, handle]);

  const ctx = useMemo(
    () => (ready ? document.createElement("canvas").getContext("2d") : null),
    [ready],
  );
  const measure = useCallback(
    (s: string, logo = false) => {
      if (!ctx) return s.length * 0.55;
      ctx.font = logo ? logoFont : font;
      return ctx.measureText(s).width / 100;
    },
    [ctx, font, logoFont],
  );
  return ready ? measure : null;
}

type Measure = (s: string, logo?: boolean) => number;

interface WordLayout {
  text: string;
  /** Set as the real logo: R mark + "emocn". */
  logo: boolean;
  /** Natural width in em, tracking included. */
  width: number;
  /** Where the seam cuts, in em from the start of the word. */
  cut: number;
}

/**
 * Picks the letter the seam runs through: a wide one near the middle, so the
 * cut lands inside a bowl or between two stems instead of grazing an "i".
 */
function layoutWord(text: string, measure: Measure): WordLayout {
  const logo = text.trim().toLowerCase() === "remocn";
  if (logo) {
    // R mark, then "emocn" in the logo's Manrope 600; cut through the "m".
    const lead = MARK_W + MARK_GAP;
    const width = lead + measure("emocn", true) + LOGO_TRACK * 4;
    const m0 = lead + measure("e", true) + LOGO_TRACK;
    const cut = m0 + measure("m", true) / 2;
    return { text: "emocn", logo, width, cut };
  }
  const chars = [...text];
  const width = measure(text) + TRACK * chars.length;
  let best = { score: Number.POSITIVE_INFINITY, cut: width / 2 };
  chars.forEach((ch, i) => {
    const adv = measure(ch);
    const start = measure(chars.slice(0, i + 1).join("")) - adv + TRACK * i;
    const center = start + adv / 2;
    const narrow = NARROW.includes(ch) ? 0.4 : 0;
    const score = Math.abs(center - width / 2) - adv * 0.35 + narrow;
    if (score < best.score) best = { score, cut: center };
  });
  return { text, logo, width, cut: best.cut };
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** Reel position at frame t: integer = locked on that word. */
function reelAt(t: number, n: number) {
  if (t < ENTER) {
    const k = interpolate(t, [-4, ENTER], [0, 1], { ...CLAMP, easing: SNAP });
    return -1 + k;
  }
  let p = 0;
  for (let i = 1; i < n; i++) {
    const start = ENTER + (i - 1) * (HOLD + STEP) + HOLD;
    p += interpolate(t, [start, start + STEP], [0, 1], {
      ...CLAMP,
      easing: SNAP,
    });
  }
  return p;
}

export function SplitMatch({
  words = ["build", "ship", "launch", "remocn"],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SplitMatchProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const measure = useMeasurer();

  const list = words.length ? words : ["remocn"];
  const n = list.length;

  if (!measure) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const layouts = list.map((w) => layoutWord(w, measure));

  const widest = Math.max(...layouts.map((l) => l.width));
  const F = Math.min(H * 0.33, (W * 0.8) / widest);
  const seam = W / 2;
  const cy = H / 2;
  const pitch = H * 0.5;
  const baseline = cy + F * 0.33;

  const p = reelAt(t, n);
  const v = (p - reelAt(t - 0.5, n)) * 2 * pitch;
  const blur = Math.min(Math.abs(v) * 0.15, H * 0.022);

  const lastLock = ENTER + (n - 1) * (HOLD + STEP);
  const merge = interpolate(
    t,
    [lastLock + MERGE_DELAY, lastLock + MERGE_DELAY + MERGE],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const edge = seam * (1 - merge);
  const push = interpolate(
    t,
    [lastLock, lastLock + MERGE + TAIL + 10],
    [0, 1],
    {
      ...CLAMP,
      easing: Easing.bezier(0.33, 0, 0.2, 1),
    },
  );
  const scale = 1 + push * 0.035;

  const reel = (dir: 1 | -1, color: string, dim: number) => {
    const nodes: ReactNode[] = [];
    for (let j = Math.floor(p) - 2; j <= Math.ceil(p) + 2; j++) {
      if (j < 0 || j >= n) continue;
      const d = j - p;
      if (Math.abs(d) > 1.6) continue;
      const near = interpolate(Math.abs(d), [0, 1], [1, dim], CLAMP);
      const opacity =
        Math.abs(d) < 0.01 ? 1 : near * (Math.abs(d) > 0.5 ? 1 - merge : 1);
      const l = layouts[j];
      const x = seam - l.cut * F;
      const y = baseline + d * pitch * dir;
      if (l.logo) {
        const k = (MARK_H * F) / 134.26;
        nodes.push(
          <g key={`${j}-logo`} opacity={opacity}>
            <path
              d={REMOCN_R_PATH}
              fill={color}
              transform={`translate(${x} ${y - MARK_H * F}) scale(${k})`}
            />
            <text
              x={x + (MARK_W + MARK_GAP) * F}
              y={y}
              fill={color}
              fontFamily={manrope.fontFamily}
              fontWeight={600}
              fontSize={F}
              style={{ letterSpacing: `${LOGO_TRACK}em` }}
            >
              {l.text}
            </text>
          </g>,
        );
        continue;
      }
      nodes.push(
        <text
          key={`${j}-${l.text}`}
          x={x}
          y={y}
          fill={color}
          opacity={opacity}
          fontFamily={bricolage.fontFamily}
          fontWeight={WEIGHT}
          fontSize={F}
          style={{ letterSpacing: `${TRACK}em` }}
        >
          {l.text}
        </text>,
      );
    }
    return nodes;
  };

  const ids = {
    left: `l${uid}`,
    right: `r${uid}`,
    blur: `b${uid}`,
  };
  const blurAttr = blur > 0.3 ? `url(#${ids.blur})` : undefined;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 80% at 25% 35%, ${c.key}, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: `${-H * 0.05}px ${-W * 0.05}px`,
            background: panelGradient(theme, accent, t),
            clipPath: `inset(0 0 0 ${edge + W * 0.05}px)`,
          }}
        />
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <clipPath id={ids.left}>
              <rect x={-W} y={-H} width={W + edge} height={H * 3} />
            </clipPath>
            <clipPath id={ids.right}>
              <rect x={edge} y={-H} width={W * 2} height={H * 3} />
            </clipPath>
            <filter
              id={ids.blur}
              filterUnits="userSpaceOnUse"
              x={-W}
              y={-H}
              width={W * 3}
              height={H * 3}
            >
              <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
            </filter>
          </defs>

          <g clipPath={`url(#${ids.left})`}>
            <g filter={blurAttr}>{reel(1, c.fg, c.dim)}</g>
          </g>

          <g clipPath={`url(#${ids.right})`}>
            <g filter={blurAttr}>{reel(-1, c.onAccent, c.dimAccent)}</g>
          </g>
        </svg>
      </div>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
