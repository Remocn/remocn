"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type BetaThanksElementId,
  betaThanksTimeline,
  words,
} from "./timeline";

const shoulders = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

export interface BetaThanksProps {
  logo?: React.ReactNode;
  tag?: string;
  status?: string;
  before?: string;
  after?: string;
  accent?: string;
  /** Text color of the copy and logo; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Big Shoulders by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between words of the thank-you line. */
  stagger?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the logo, the tag's fade and travel and single
   * words, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<BetaThanksElementId>;
}

const THEMES = {
  dark: { bg: "#26231F", ink: "#F6F0E6", accent: "#2BD96B" },
  light: { bg: "#F5F5F2", ink: "#000000", accent: "#0E9F4B" },
} as const;

const REF = 200;
const TAG_EM = 0.3;
const LINE2_EM = 0.36;
const STATUS_GAP = 0.2;
const LINE_GAP = 0.16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TRAVEL = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Measured {
  w: number;
  h: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function BetaThanks(props: BetaThanksProps) {
  const {
    logo,
    tag = "beta",
    status = "is out.",
    before = "Thank you,",
    after = "testers.",
    accent,
    ink,
    background,
    fontFamily = shoulders.fontFamily,
    fontWeight = 500,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  // The pace that fits the schedule into a short clip counts the clip
  // without `speed`, so the schedule gets `durationInFrames`.
  const tl = useTimeline(betaThanksTimeline, props, durationInFrames, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const t = frame * speed;

  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender("beta-thanks: measuring"));
  const released = useRef(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [m, setM] = useState<Measured | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      shoulders.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, [fontFamily, fontWeight]);

  useLayoutEffect(() => {
    if (!fontsOk) return;
    const root = rootRef.current;
    const lg = logoRef.current;
    const slot = slotRef.current;
    if (!root || !lg || !slot) return;
    const lp = offsetIn(lg, root);
    const sp = offsetIn(slot, root);
    const next: Measured = {
      w: root.offsetWidth,
      h: root.offsetHeight,
      fromX: lp.x + lg.offsetWidth + REF * 0.07,
      fromY: lp.y + REF * 0.085,
      toX: sp.x,
      toY: sp.y,
    };
    setM((prev) =>
      prev &&
      prev.w === next.w &&
      prev.h === next.h &&
      prev.fromX === next.fromX &&
      prev.fromY === next.fromY &&
      prev.toX === next.toX &&
      prev.toY === next.toY
        ? prev
        : next,
    );
  });

  useEffect(() => {
    if (m && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [m, handle]);

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const marginY = H * (portrait ? 0.1 : 0.11);
  const k = m
    ? Math.min(
        (W - marginX * 2) / m.w,
        (H * (portrait ? 0.42 : 0.62)) / m.h,
        (H * (portrait ? 0.09 : 0.26)) / REF,
      )
    : 1;

  const rise = (id: BetaThanksElementId) => {
    const e = tl.get(id);
    return interpolate(t, [e.start, e.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const logoIn = rise("logo");
  const tagIn = rise("tag");
  const move = tl.get("travel");
  const drop = interpolate(
    t,
    [move.start + move.beat("drop"), move.start + move.beat("dropEnd")],
    [0, 1],
    { ...CLAMP, easing: EASE_TRAVEL },
  );
  const slide = interpolate(
    t,
    [move.start + move.beat("slide"), move.end],
    [0, 1],
    { ...CLAMP, easing: EASE_TRAVEL },
  );
  const travel = (drop + slide) / 2;
  const lift = interpolate(
    t,
    [move.start, move.start + move.beat("lift")],
    [0, 1],
    { ...CLAMP, easing: Easing.bezier(0.65, 0, 0.35, 1) },
  );
  const landed = t >= move.end;

  const tagScale0 = TAG_EM / LINE2_EM;
  const tagX = m ? m.fromX + (m.toX - m.fromX) * slide : 0;
  const tagY = m
    ? m.fromY + (m.toY - m.fromY) * drop - lift * (1 - drop) * REF * 0.06
    : 0;
  const tagS = tagScale0 + (1 - tagScale0) * travel;
  const tagColorMix = interpolate(travel, [0, 1], [0.62, 1], CLAMP);

  const statusWords = words(status);
  const beforeWords = words(before);
  const afterWords = words(after);

  const display: React.CSSProperties = {
    fontFamily,
    fontWeight,
    lineHeight: 1,
    letterSpacing: "-0.01em",
  };

  const riser = (key: string, text: string, p: number, color: string) => (
    <span
      key={key}
      style={{
        display: "inline-block",
        color,
        opacity: p,
        transform: `translateY(${((1 - p) * 0.32).toFixed(3)}em)${glide(midway(p))}`,
      }}
    >
      {text}
    </span>
  );

  const joinSpaced = (nodes: React.ReactNode[]) =>
    nodes.flatMap((n, i) => (i === 0 ? [n] : [" ", n]));

  const line2Nodes: React.ReactNode[] = [
    ...beforeWords.map((w, i) => riser(`b${i}`, w, rise(`before:${i}`), fg)),
    <span
      key="slot"
      ref={slotRef}
      style={{
        display: "inline-block",
        color: fg,
        opacity: landed ? 1 : 0,
      }}
    >
      {tag}
    </span>,
    ...afterWords.map((w, i) => riser(`a${i}`, w, rise(`after:${i}`), fg)),
  ];

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: marginX,
            bottom: marginY,
            transformOrigin: "0 100%",
            transform: `scale(${k})`,
            opacity: m ? 1 : 0,
          }}
        >
          <div
            ref={rootRef}
            style={{
              position: "relative",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                whiteSpace: "nowrap",
              }}
            >
              <div
                ref={logoRef}
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  opacity: logoIn,
                  transform: `translateY(${((1 - logoIn) * REF * 0.18).toFixed(2)}px)${glide(midway(logoIn))}`,
                }}
              >
                {logo ?? <RemocnLogo fontSize={REF} color={fg} />}
              </div>
              <div
                style={{
                  ...display,
                  fontSize: REF * 0.97,
                  marginLeft: REF * STATUS_GAP,
                  whiteSpace: "pre",
                }}
              >
                {joinSpaced(
                  statusWords.map((w, i) =>
                    riser(`s${i}`, w, rise(`status:${i}`), hi),
                  ),
                )}
              </div>
            </div>
            <div
              style={{
                ...display,
                fontSize: REF * LINE2_EM,
                marginTop: REF * LINE_GAP,
                maxWidth: REF * 4.6,
                whiteSpace: "normal",
                textWrap: "balance",
              }}
            >
              {joinSpaced(line2Nodes)}
            </div>
            {m && !landed ? (
              <span
                style={{
                  ...display,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: REF * LINE2_EM,
                  color: fg,
                  opacity: tagIn * tagColorMix,
                  transformOrigin: "0 0",
                  transform: `translate(${tagX.toFixed(2)}px, ${tagY.toFixed(2)}px) scale(${tagS.toFixed(4)})${glide(midway(lift) || midway(drop) || midway(slide))}`,
                  whiteSpace: "pre",
                }}
              >
                {tag}
              </span>
            ) : null}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
