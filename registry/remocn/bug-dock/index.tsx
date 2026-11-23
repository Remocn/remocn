"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadVariableFont } from "@remotion/google-fonts/Urbanist";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const urbanist = loadVariableFont("normal", { subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_RATIO = 124.06 / 134.26;
const R_EM = 0.76;
const R_GAP = 0.04;
const LOGO_TRACK = -0.025;

export interface BugDockProps {
  name?: string;
  headline?: string;
  highlight?: string;
  accent?: string;
  /** Text color of the name, mark and headline; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the headline and a custom name. Load it yourself; Urbanist by default. */
  fontFamily?: string;
  /** Frame the name starts tucking into its first letter. */
  tuckAt?: number;
  /** Frames between words of the headline. */
  stagger?: number;
  /** Size of the name and headline, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0B0B0B", ink: "#FFFFFF", blue: "#2F6BFF" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", blue: "#1F4FE0" },
} as const;

const ENTER_AT = 0;
const TUCK_AT = 34;
const TUCK_STEP = 6;
const TUCK_DUR = 11;
const DOCK_DUR = 30;
const HEAD_DELAY = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TUCK = Easing.bezier(0.55, 0, 0.2, 1);
const EASE_DOCK = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: number[];
  baseline: number;
  cap: number;
}

function measure(
  letters: string[],
  logo: boolean,
  fontFamily: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const adv: number[] = [];
  let baseline = 0.78;
  let cap = 0.72;
  if (ctx) {
    const family = logo ? manrope.fontFamily : fontFamily;
    const weight = logo ? 600 : 500;
    ctx.font = `${weight} 200px "${family}"`;
    for (const ch of letters) {
      adv.push(ctx.measureText(ch).width / 200 + LOGO_TRACK);
    }
    const fm = ctx.measureText("H");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    cap = fm.actualBoundingBoxAscent / 200;
  }
  return { adv, baseline, cap };
}

function useMetrics(letters: string[], logo: boolean, fontFamily: string) {
  const key = `${logo ? 1 : 0}${letters.join("")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("bug-dock: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const isLogo = key[0] === "1";
    const chars = Array.from(key.slice(1));
    Promise.all([
      urbanist.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`600 100px "${manrope.fontFamily}"`),
      document.fonts.load(`500 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(chars, isLogo, fontFamily) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.m : null;
}

function RMark({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      height={height}
      width={height * R_RATIO}
      style={{ display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function normalizeHex(c: string | undefined, fallback: string) {
  if (c && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) return c;
  return fallback;
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function BugDock({
  name = "remocn",
  headline = "Playing on every screen you ship.",
  highlight = "every screen",
  accent,
  ink,
  background,
  fontFamily = urbanist.fontFamily,
  tuckAt = TUCK_AT,
  stagger = 2.5,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: BugDockProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const blue = normalizeHex(accent, c.blue);

  const clean = name.trim() || "remocn";
  const logo = clean.toLowerCase() === "remocn";
  const tail = useMemo(
    () => Array.from(logo ? "emocn" : clean.slice(1)),
    [logo, clean],
  );
  const head = logo ? "" : Array.from(clean)[0];
  const letters = useMemo(
    () => (logo ? tail : [head, ...tail]),
    [logo, tail, head],
  );
  const m = useMetrics(letters, logo, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const words = useMemo(
    () => headline.split(/\s+/).filter(Boolean),
    [headline],
  );
  const hiWords = useMemo(
    () =>
      new Set(
        highlight
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")),
      ),
    [highlight],
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);

  const tailAdv = logo ? m.adv : m.adv.slice(1);
  const firstAdv = logo ? R_EM * R_RATIO + R_GAP : m.adv[0];
  const fullEm = firstAdv + tailAdv.reduce((a, b) => a + b, 0);
  const LF = Math.min(
    (W * (portrait ? 0.8 : 0.58)) / fullEm,
    H * (portrait ? 0.14 : 0.3),
  );
  const baseY = H * 0.5 + (m.cap * LF) / 2;

  const n = tailAdv.length;
  const tuckP = tailAdv.map((_, k) => {
    const order = n - 1 - k;
    const at = tuckAt + order * TUCK_STEP;
    return interpolate(t, [at, at + TUCK_DUR], [0, 1], {
      ...CLAMP,
      easing: EASE_TUCK,
    });
  });
  const tuckEnd = tuckAt + (n - 1) * TUCK_STEP + TUCK_DUR;
  const dockAt = tuckEnd + 2;
  const headAt = dockAt + HEAD_DELAY;

  const leftAt = (tucks: number[]) =>
    (W -
      (firstAdv -
        (logo ? R_GAP : 0) * tucks[0] +
        tailAdv.reduce((a, w, k) => a + w * (1 - tucks[k]), 0)) *
        LF) /
    2;
  const groupLeft = leftAt(tuckP);
  // Layout rounds a box to whole pixels, so the first letter's box clicks
  // sideways as the tail tucks in. While it slides it is laid out where it
  // stood before the tuck and the slide is a transform; standing before or
  // after the tuck it keeps its plain layout.
  const sliding = tuckP.some((k) => k > 0 && k < 1);
  const firstLeft = sliding ? leftAt(tuckP.map(() => 0)) : groupLeft;
  const firstDx = groupLeft - firstLeft;

  const xs: number[] = [];
  let shift = 0;
  for (let k = 0; k < n; k++) {
    let orig = firstAdv;
    for (let j = 0; j < k; j++) orig += tailAdv[j];
    shift += tuckP[k] * tailAdv[k];
    xs.push(groupLeft + (orig - shift) * LF);
  }

  const dock = interpolate(t, [dockAt, dockAt + DOCK_DUR], [0, 1], {
    ...CLAMP,
    easing: EASE_DOCK,
  });

  const firstH = logo ? R_EM * LF : m.cap * LF;
  const firstW = logo ? firstH * R_RATIO : m.adv[0] * LF;
  const bugH = H * (portrait ? 0.04 : 0.08);
  const bugScale = bugH / firstH;
  const margin = Math.min(W, H) * 0.075;
  const bugRight = W - margin;
  const bugBottom = H - margin;

  const startLeft = groupLeft;
  const startBottom = baseY;
  const endLeft = bugRight - firstW * bugScale;
  const curScale = 1 + (bugScale - 1) * dock;
  // Layout rounds a box to whole pixels, so a mark eased by `left`/`top`
  // clicks along pixel by pixel. It is laid out where it docks and the ride
  // there is a transform, exactly 0 once docked.
  const restTop = bugBottom - firstH * bugScale;
  const dockDx = (startLeft - endLeft) * (1 - dock);
  const dockDy =
    (1 - dock) * (startBottom - bugBottom - firstH * (1 - bugScale));
  const docking = dock < 1;
  const bugOpacity = 1 - 0.18 * dock;

  const enter = (i: number) =>
    interpolate(t, [ENTER_AT + i * 2, ENTER_AT + i * 2 + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const tailFont = logo ? manrope.fontFamily : fontFamily;
  const tailWeight = logo ? 600 : 500;
  const tailNodes = tailAdv.map((adv, k) => {
    const prevRight =
      k === 0 ? groupLeft + firstAdv * LF : xs[k - 1] + tailAdv[k - 1] * LF;
    const clipL = Math.max(0, prevRight - xs[k]);
    const e = enter(k + 1);
    const ch = logo ? tail[k] : letters[k + 1];
    return (
      <div
        key={`${k}-${ch}`}
        style={{
          position: "absolute",
          left: xs[k],
          top: baseY - m.baseline * LF - LF * 0.15,
          height: LF * 1.3,
          width: adv * LF + LF * 0.3,
          overflow: "hidden",
          clipPath: `inset(0 0 0 ${clipL.toFixed(2)}px)`,
          opacity: 1 - tuckP[k],
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: LF * 0.15,
            fontFamily: tailFont,
            fontWeight: tailWeight,
            fontSize: LF,
            lineHeight: `${LF}px`,
            letterSpacing: `${LOGO_TRACK}em`,
            whiteSpace: "pre",
            color: fg,
            transform: `translateY(${((1 - e) * LF * 0.9).toFixed(2)}px)${glide(e > 0 && (1 - e) * LF > 1e-3)}`,
          }}
        >
          {ch}
        </div>
      </div>
    );
  });

  const firstEnter = enter(0);
  const headFs = (portrait ? 132 : 124) * s;
  const headLeft = portrait ? W * 0.08 : W * 0.075;
  const headW = portrait ? W * 0.84 : W * 0.78;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: firstLeft,
            top: baseY - firstH - LF * 0.2,
            width: firstW + LF * 0.1,
            height: firstH + LF * 0.2,
            overflow: "hidden",
            opacity: dock > 0 ? 0 : 1,
            transform:
              Math.abs(firstDx) > 1e-3 ? `translateX(${firstDx}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: LF * 0.2,
              transform: `translateY(${((1 - firstEnter) * firstH * 1.1).toFixed(2)}px)${glide(firstEnter > 0 && (1 - firstEnter) * firstH > 1e-3)}`,
            }}
          >
            {logo ? (
              <RMark height={firstH} color={fg} />
            ) : (
              <span
                style={{
                  display: "block",
                  fontFamily,
                  fontWeight: 500,
                  fontSize: LF,
                  lineHeight: `${firstH}px`,
                  color: fg,
                }}
              >
                {head}
              </span>
            )}
          </div>
        </div>

        {tailNodes}

        {dock > 0 ? (
          <div
            style={{
              position: "absolute",
              left: endLeft,
              top: restTop,
              width: firstW,
              height: firstH,
              transformOrigin: "0 0",
              transform: `${docking ? `translate(${dockDx}px, ${dockDy}px) ` : ""}scale(${curScale.toFixed(4)})${glide(docking)}`,
              opacity: bugOpacity,
            }}
          >
            {logo ? (
              <RMark height={firstH} color={fg} />
            ) : (
              <span
                style={{
                  display: "block",
                  fontFamily,
                  fontWeight: 500,
                  fontSize: LF,
                  lineHeight: `${firstH}px`,
                  color: fg,
                }}
              >
                {head}
              </span>
            )}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: headLeft,
            width: headW,
            top: portrait ? H * 0.36 : H * 0.27,
            fontFamily,
            fontSize: headFs,
            fontVariationSettings: '"wght" 400',
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: fg,
            textWrap: "balance",
          }}
        >
          {words.map((w, i) => {
            const at = headAt + i * stagger;
            const p = interpolate(t, [at, at + 16], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const hi = hiWords.has(
              w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""),
            );
            return (
              <span
                key={`${i}-${w}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: "0.12em",
                  marginBottom: "-0.12em",
                  marginRight: "0.24em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    color: hi ? blue : fg,
                    // The value stays raw (rounding would step it by hand),
                    // and the mark stays on at rest so the word keeps one way
                    // of being drawn from the rise into the hold.
                    transform: `translateY(${(1 - p) * 1.1}em)${glide(p > 0 && p < 1)}`,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
