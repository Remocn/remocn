"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSchibsted } from "@remotion/google-fonts/SchibstedGrotesk";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Newspaper-ad grotesk for the copy: deadpan, upright, no shouting. */
const copy = loadSchibsted("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", { weights: ["600"], subsets: ["latin"] });

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** R mark proportions, as set on remocn.dev: 0.76em tall on the baseline. */
const MARK_EM = 0.76;
const MARK_ADV = (MARK_EM * 124.06) / 134.26;
const MARK_GAP = 0.04;
const LOGO_TRACK = -0.025;

/** Full logo as on remocn.dev: R mark + "emocn" in Manrope 600, tracking-tight. */
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
        letterSpacing: `${LOGO_TRACK}em`,
        lineHeight: 1,
        whiteSpace: "pre",
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: `${MARK_EM}em`, width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: `${MARK_GAP}em` }}>emocn</span>
    </div>
  );
}

export interface DeadpanBoxProps {
  /** The setup, without quote marks: curly marks are added and hung for you. */
  quote?: string;
  /** The deadpan attribution that lands the joke after a pause. */
  attribution?: string;
  /**
   * Brand the box starts as, and signs off with. "remocn" renders the real
   * remocn.dev logo; anything else is set as a plain wordmark.
   */
  brand?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Timing, in frames at speed 1.
const GROW_AT = 12;
const GROW_LEN = 24;
const QUOTE_AT = 28;
const LINE_STAGGER = 5;
const PUNCH_AT = 92; // after a deadpan beat of a little over a second
const PUNCH_LEN = 16;
export const DEADPAN_BOX_DURATION = 150;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SNAP = Easing.bezier(0.7, 0, 0.2, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const alpha = (color: string, a: number) =>
  `color-mix(in oklab, ${color} ${Math.round(a * 100)}%, transparent)`;

interface Blob {
  color: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  a: number;
}

/**
 * The box is a window onto one gradient field pinned to the frame: as the box
 * grows, it shows more of the same light instead of stretching it.
 * Dark: gradients.sh "beam" (deep indigo, the accent, a pale-blue bloom).
 * Light: "pixel-glass" (violet, the accent, a rose corner) on the off-white stage.
 */
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    grain: 0.06,
    base: (accent: string) =>
      `linear-gradient(158deg, ${accent} 0%, #2A2F9E 48%, #1A1660 100%)`,
    blobs: [
      { color: "#8FB4FF", x: 82, y: 12, rx: 62, ry: 78, a: 0.62 },
      { color: "#F4F7FF", x: 92, y: 4, rx: 28, ry: 36, a: 0.32 },
      { color: "ACCENT", x: 28, y: 46, rx: 70, ry: 82, a: 0.8 },
      { color: "#1A1660", x: 14, y: 100, rx: 60, ry: 60, a: 0.85 },
    ] as Blob[],
  },
  light: {
    bg: "#F5F4F0",
    grain: 0.04,
    base: (accent: string) =>
      `linear-gradient(150deg, #7A3CFF 0%, ${accent} 52%, #3D6BFF 100%)`,
    blobs: [
      { color: "#7A3CFF", x: 12, y: 14, rx: 60, ry: 72, a: 0.75 },
      { color: "#FF4FB8", x: 94, y: 96, rx: 48, ry: 58, a: 0.62 },
      { color: "ACCENT", x: 46, y: 52, rx: 58, ry: 66, a: 0.6 },
      { color: "#C9B6FF", x: 86, y: 6, rx: 30, ry: 40, a: 0.32 },
    ] as Blob[],
  },
} as const;

const QUOTE_TRACK = -0.03;
const SMALL_TRACK = -0.005;
const LEAD = 1.04;

interface FontMetrics {
  /** Advance width of a string at 1em, in em, tracking included. */
  width: (text: string, weight: 400 | 500, track: number) => number;
  /** "emocn" in the logo face, in em. */
  logoWord: number;
  /** Cap height, in em. */
  cap: number;
  /** Baseline below the top of a line-height: 1 box, in em. */
  base: number;
  /** Same, for the logo's Manrope line box. */
  logoBase: number;
  logoCap: number;
}

const PROBE = 200;

function measureFonts(): FontMetrics | null {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  const width = (text: string, weight: 400 | 500, track: number) => {
    ctx.font = `${weight} ${PROBE}px "${copy.fontFamily}"`;
    const n = [...text].length;
    return ctx.measureText(text).width / PROBE + track * Math.max(0, n - 1);
  };
  ctx.font = `500 ${PROBE}px "${copy.fontFamily}"`;
  const h = ctx.measureText("H");
  const asc = h.fontBoundingBoxAscent / PROBE;
  const desc = h.fontBoundingBoxDescent / PROBE;
  const cap = h.actualBoundingBoxAscent / PROBE;
  ctx.font = `600 ${PROBE}px "${manrope.fontFamily}"`;
  const mh = ctx.measureText("H");
  const mAsc = mh.fontBoundingBoxAscent / PROBE;
  const mDesc = mh.fontBoundingBoxDescent / PROBE;
  const word = ctx.measureText("emocn").width / PROBE + LOGO_TRACK * 5;
  return {
    width,
    logoWord: word,
    cap,
    base: 0.5 + (asc - desc) / 2,
    logoBase: 0.5 + (mAsc - mDesc) / 2,
    logoCap: Math.max(MARK_EM, mh.actualBoundingBoxAscent / PROBE),
  };
}

function useFontMetrics() {
  const [metrics, setMetrics] = useState<FontMetrics | null>(null);
  const [handle] = useState(() => delayRender("deadpan-box: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      copy.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`500 100px "${copy.fontFamily}"`),
      document.fonts.load(`400 100px "${copy.fontFamily}"`),
      document.fonts.load(`600 100px "${manrope.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measureFonts());
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return metrics;
}

function splitQuote(quote: string, width: (s: string) => number): string[] {
  if (quote.includes("\n")) return quote.split("\n").map((l) => l.trim());
  const words = quote.trim().split(/\s+/);
  if (words.length < 3) return [quote.trim()];
  let best = [quote.trim()];
  let bestW = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(width(a), width(b));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export function DeadpanBox({
  quote = "Nobody watches launch videos.",
  attribution = "Founder. Nobody watched the launch.",
  brand = "remocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DeadpanBoxProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const ink = "#FFFFFF";
  const fm = useFontMetrics();
  const isLogo = brand.trim().toLowerCase() === "remocn";

  const layout = useMemo(() => {
    if (!fm) return null;
    const qw = (s: string) => fm.width(s, 500, QUOTE_TRACK);
    // Quote lines with hung curly quotes.
    const lines = splitQuote(quote, qw).map((l, i, all) => {
      let text = l;
      if (i === 0) text = `“${text}`;
      if (i === all.length - 1) text = `${text}”`;
      return text;
    });
    const hang = qw("“") + QUOTE_TRACK;
    const lineEm = lines.map((l, i) => qw(l) - (i ? 0 : hang));
    const quoteEm = Math.max(...lineEm);
    const brandEm = isLogo
      ? MARK_ADV + MARK_GAP + fm.logoWord
      : fm.width(brand, 500, -0.02);
    return { lines, hang, quoteEm, brandEm };
  }, [fm, quote, brand, isLogo]);

  if (!fm || !layout) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }
  const { lines, hang, quoteEm, brandEm } = layout;
  const CAP = fm.cap;
  const BASELINE = fm.base;

  // Sizes: the quote sets the scale, everything else follows it. The hung
  // opening mark sits inside the left padding.
  const padL = 0.3 + hang;
  const padR = 0.36;
  const small = 0.3;
  const dashEm = fm.width("— ", 400, SMALL_TRACK) + SMALL_TRACK;
  const rowEm = fm.width(attribution, 400, SMALL_TRACK) * small;
  const Q = Math.min(
    (W * 0.68) / (Math.max(quoteEm, rowEm) + padL + padR),
    (H * 0.6) / (CAP + LEAD * (lines.length - 1) + 0.6 + small * CAP),
  );
  const S = small * Q;
  const padTop = 0.36 * Q;
  const padBottom = 0.38 * Q;
  const rowGap = 0.6 * Q;

  // Text block: quote, then the attribution, centred as one block in frame.
  const boxW = (quoteEm + padL + padR) * Q;
  const quoteH = padTop + (CAP + LEAD * (lines.length - 1)) * Q + padBottom;
  const blockH = quoteH - padBottom + rowGap + CAP * S + padBottom;
  const left = (W - boxW) / 2;
  const top = (H - blockH) / 2;
  const baselines = lines.map((_, i) => padTop + (CAP + LEAD * i) * Q);
  const rowBaseline = baselines[baselines.length - 1] + rowGap + CAP * S;
  const edge = 40 * (H / 720);

  // The box starts as the brand's masthead, hugging its logo.
  const M = 0.46 * Q;
  const markCap = isLogo ? fm.logoCap : CAP;
  const markBase = isLogo ? fm.logoBase : BASELINE;
  const padM = 0.34;
  const mastW = (brandEm + 2 * padM) * M;
  const mastH = (markCap + 2 * padM) * M;
  const mast = {
    x: (W - mastW) / 2,
    y: (H - mastH) / 2,
    w: mastW,
    h: mastH,
  };

  const growW = interpolate(t, [GROW_AT, GROW_AT + GROW_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const growH = interpolate(t, [GROW_AT + 3, GROW_AT + GROW_LEN + 3], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const punch = interpolate(t, [PUNCH_AT, PUNCH_AT + PUNCH_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_SNAP,
  });
  // Setup: the masthead grows to hug the quote. Punchline: it floods the frame.
  const hugX = lerp(mast.x, left, growW);
  const hugW = lerp(mast.w, boxW, growW);
  const hugY = lerp(mast.y, top, growH);
  const hugH = lerp(mast.h, quoteH, growH);
  const box = {
    x: lerp(hugX, -4, punch),
    y: lerp(hugY, -4, punch),
    w: lerp(hugW, W + 8, punch),
    h: lerp(hugH, H + 8, punch),
  };
  const mastOut = interpolate(t, [GROW_AT + 6, GROW_AT + 15], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.4, 0, 1, 1),
  });
  const breathe = interpolate(t, [0, DEADPAN_BOX_DURATION], [1.03, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.2, 0, 0.4, 1),
  });

  const lineIn = (i: number) =>
    interpolate(
      t,
      [QUOTE_AT + i * LINE_STAGGER, QUOTE_AT + i * LINE_STAGGER + 22],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
  const rowIn = interpolate(t, [PUNCH_AT + 8, PUNCH_AT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const signIn = interpolate(t, [PUNCH_AT + 16, PUNCH_AT + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // The field drifts a couple of percent over the shot, never more.
  const field = [
    ...c.blobs.map((b, k) => {
      const x = b.x + Math.sin(t / 48 + k * 1.9) * 2.2;
      const y = b.y + Math.cos(t / 61 + k * 2.4) * 1.8;
      const col = b.color === "ACCENT" ? accent : b.color;
      return `radial-gradient(${b.rx}% ${b.ry}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, ${alpha(col, b.a)} 0%, transparent 70%)`;
    }),
    c.base(accent),
  ].join(", ");

  const sign = 26 * (H / 720);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${breathe})`, transformOrigin: "50% 50%" }}
      >
        <div
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -box.x,
              top: -box.y,
              width: W,
              height: H,
              background: field,
            }}
          />

          {mastOut > 0 ? (
            <div
              style={{
                position: "absolute",
                left: mast.x - box.x + padM * M,
                top: mast.y - box.y + (padM + markCap - markBase) * M,
                opacity: mastOut,
                transform: `translateY(${(1 - mastOut) * -0.35 * M}px)`,
              }}
            >
              {isLogo ? (
                <RemocnLogo fontSize={M} color={ink} />
              ) : (
                <div
                  style={{
                    fontFamily: copy.fontFamily,
                    fontWeight: 500,
                    fontSize: M,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: ink,
                    whiteSpace: "pre",
                  }}
                >
                  {brand}
                </div>
              )}
            </div>
          ) : null}

          {lines.map((l, i) => {
            const p = lineIn(i);
            return (
              <div
                key={`${i}-${l}`}
                style={{
                  position: "absolute",
                  left: left - box.x + (padL - (i ? 0 : hang)) * Q,
                  top: top - box.y + baselines[i] - BASELINE * Q,
                  height: 1.1 * Q,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontFamily: copy.fontFamily,
                    fontWeight: 500,
                    fontSize: Q,
                    lineHeight: 1,
                    letterSpacing: `${QUOTE_TRACK}em`,
                    color: ink,
                    whiteSpace: "pre",
                    transform: `translateY(${(1 - p) * 1.1 * Q}px)`,
                  }}
                >
                  {l}
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              // the dash hangs, so the words align with the quote's left edge
              left: left - box.x + padL * Q - dashEm * S,
              top: top - box.y + rowBaseline - BASELINE * S,
              fontFamily: copy.fontFamily,
              fontWeight: 400,
              fontSize: S,
              lineHeight: 1,
              letterSpacing: `${SMALL_TRACK}em`,
              color: ink,
              whiteSpace: "pre",
              opacity: 0.84 * rowIn,
              transform: `translateY(${(1 - rowIn) * 0.6 * S}px)`,
            }}
          >
            <span style={{ opacity: 0.7 }}>— </span>
            {attribution}
          </div>
          <div
            style={{
              position: "absolute",
              right: box.x + box.w - W + edge,
              bottom: box.y + box.h - H + edge,
              opacity: signIn,
              transform: `translateY(${(1 - signIn) * 8 * (H / 720)}px)`,
            }}
          >
            {isLogo ? (
              <RemocnLogo fontSize={sign} color={ink} />
            ) : (
              <div
                style={{
                  fontFamily: copy.fontFamily,
                  fontWeight: 500,
                  fontSize: sign,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: ink,
                  whiteSpace: "pre",
                }}
              >
                {brand}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
