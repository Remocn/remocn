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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const T_TAG = 10;
const T_LIFT = 40;
const T_TURN = 58;
const T_LAND = 78;
const T_STATUS = 58;
const T_BEFORE = 64;
const T_AFTER = 78;
const NATURAL_END = 94;

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

function words(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

export function BetaThanks({
  logo,
  tag = "beta",
  status = "is out.",
  before = "Thank you,",
  after = "testers.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: BetaThanksProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const pace = Math.max(1, (NATURAL_END + 30) / Math.max(1, durationInFrames));
  const t = frame * speed * pace;

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
      document.fonts.load(`500 100px "${shoulders.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, []);

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

  const rise = (start: number, dur = 16) =>
    interpolate(t, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const logoIn = rise(0, 22);
  const tagIn = rise(T_TAG, 14);
  const drop = interpolate(t, [T_LIFT, T_TURN + 2], [0, 1], {
    ...CLAMP,
    easing: EASE_TRAVEL,
  });
  const slide = interpolate(t, [T_TURN - 2, T_LAND], [0, 1], {
    ...CLAMP,
    easing: EASE_TRAVEL,
  });
  const travel = (drop + slide) / 2;
  const lift = interpolate(t, [T_LIFT - 4, T_LIFT + 8], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const landed = t >= T_LAND;

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
    fontFamily: shoulders.fontFamily,
    fontWeight: 500,
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
        transform: `translateY(${((1 - p) * 0.32).toFixed(3)}em)`,
      }}
    >
      {text}
    </span>
  );

  const joinSpaced = (nodes: React.ReactNode[]) =>
    nodes.flatMap((n, i) => (i === 0 ? [n] : [" ", n]));

  const line2Nodes: React.ReactNode[] = [
    ...beforeWords.map((w, i) =>
      riser(`b${i}`, w, rise(T_BEFORE + i * 4), c.ink),
    ),
    <span
      key="slot"
      ref={slotRef}
      style={{
        display: "inline-block",
        color: c.ink,
        opacity: landed ? 1 : 0,
      }}
    >
      {tag}
    </span>,
    ...afterWords.map((w, i) =>
      riser(`a${i}`, w, rise(T_AFTER + i * 4), c.ink),
    ),
  ];

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
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
                transform: `translateY(${((1 - logoIn) * REF * 0.18).toFixed(2)}px)`,
              }}
            >
              {logo ?? <RemocnLogo fontSize={REF} color={c.ink} />}
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
                  riser(`s${i}`, w, rise(T_STATUS + i * 5, 18), hi),
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
                color: c.ink,
                opacity: tagIn * tagColorMix,
                transformOrigin: "0 0",
                transform: `translate(${tagX.toFixed(2)}px, ${tagY.toFixed(2)}px) scale(${tagS.toFixed(4)})`,
                whiteSpace: "pre",
              }}
            >
              {tag}
            </span>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
