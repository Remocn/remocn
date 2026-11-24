"use client";

import { loadFont } from "@remotion/google-fonts/Gabarito";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  type AndYouElementId,
  andYouTimeline,
  DEFAULT_CLAUSES,
  DEFAULT_LAST,
  FALLBACK_CLAUSES,
} from "./timeline";

const gabarito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AndYouProps {
  clauses?: string[];
  last?: string;
  accent?: string;
  /** Text color of the clauses and last line; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Gabarito by default. */
  fontFamily?: string;
  /** Frames between words as a clause builds. */
  stagger?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches each clause, the page pulling back, the last
   * line and its last word, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<AndYouElementId>;
}

const THEMES = {
  dark: { bg: "#3B1E6E", ink: "#FFFFFF", accent: "#FF7A6B" },
  light: { bg: "#EDE7FB", ink: "#3B1E6E", accent: "#D9483A" },
} as const;

const BODY_W = 400;
const LAST_W = 500;
const TRACK = -0.02;
const LAST_TRACK = -0.035;
const FONT_PX = 200;
const LH = 1.12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  body: (s: string) => number;
  last: (s: string) => number;
  asc: number;
  desc: number;
}

function measure(fontFamily: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("and-you: no 2d context");
  const bodyCache: Record<string, number> = {};
  const lastCache: Record<string, number> = {};
  const em = (s: string, w: number, track: number) => {
    ctx.font = `${w} ${FONT_PX}px "${fontFamily}"`;
    return ctx.measureText(s).width / FONT_PX + track * Array.from(s).length;
  };
  ctx.font = `${BODY_W} ${FONT_PX}px "${fontFamily}"`;
  const fm = ctx.measureText("Hxg");
  return {
    body: (s) => {
      if (bodyCache[s] === undefined) bodyCache[s] = em(s, BODY_W, TRACK);
      return bodyCache[s];
    },
    last: (s) => {
      if (lastCache[s] === undefined) lastCache[s] = em(s, LAST_W, LAST_TRACK);
      return lastCache[s];
    },
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(fontFamily: string) {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("and-you: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      gabarito.waitUntilDone(),
      document.fonts.load(`${BODY_W} 100px "${fontFamily}"`),
      document.fonts.load(`${LAST_W} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure(fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily]);
  return m;
}

interface Placed {
  text: string;
  clause: number;
  order: number;
  line: number;
  x: number;
}

function flow(
  clauses: string[],
  room: number,
  width: (s: string) => number,
): { words: Placed[]; lastLine: number[] } {
  const words: Placed[] = [];
  const lastLine: number[] = [];
  let line = 0;
  let cur: string[] = [];
  clauses.forEach((cl, ci) => {
    const parts = cl.split(" ").filter(Boolean);
    parts.forEach((w, wi) => {
      const prefix = cur.length > 0 ? `${cur.join(" ")} ` : "";
      if (cur.length > 0 && width(prefix + w) > room) {
        line += 1;
        cur = [];
        words.push({ text: w, clause: ci, order: wi, line, x: 0 });
      } else {
        words.push({
          text: w,
          clause: ci,
          order: wi,
          line,
          x: width(prefix),
        });
      }
      cur.push(w);
    });
    lastLine.push(line);
  });
  return { words, lastLine };
}

const moving = (p: number) => p > 0 && p < 1;

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

export function AndYou(props: AndYouProps) {
  const {
    clauses = DEFAULT_CLAUSES,
    last = DEFAULT_LAST,
    accent,
    ink,
    background,
    fontFamily = gabarito.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const t = frame * speed;
  // The clause slot is fitted to the composition's length, without `speed`.
  const tl = useTimeline(andYouTimeline, props, durationInFrames, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const list = clauses.length > 0 ? clauses : FALLBACK_CLAUSES;
  const m = useMetrics(fontFamily);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const marginY = H * (portrait ? 0.07 : 0.1);
  const room = W - marginX * 2;
  const F0 = portrait ? W * 0.12 : H * 0.15;
  const { words, lastLine } = flow(list, room / F0, m.body);
  const lineH = LH * F0;
  const heightAt = (k: number) => (lastLine[k] + 1) * lineH;
  const availH = H - marginY * 2;

  const scrollAt = (k: number) => Math.max(0, heightAt(k) - availH);

  const lastSplit = last.lastIndexOf(" ");
  const lastHead = lastSplit > 0 ? last.slice(0, lastSplit + 1) : "";
  const lastTail = lastSplit > 0 ? last.slice(lastSplit + 1) : last;
  const lastW = Math.max(0.1, m.last(last));
  const FY = Math.min(
    H * (portrait ? 0.16 : 0.34),
    (room * (portrait ? 1 : 0.62)) / lastW,
  );
  const lastCap = FY * 0.74;
  const gapY = H * 0.06;
  const finalRoomH = H - marginY * 2 - lastCap - gapY;
  const sFinal = Math.min(1, finalRoomH / heightAt(n - 1), portrait ? 1 : 0.6);

  const clause = (k: number) => tl.get(`clause:${k}`);
  const pullback = tl.get("pullback");
  const lastEl = tl.get("last");
  const tailEl = tl.get("tail");

  /** The page's scroll and its pull-back to `sFinal`, at time `u`. */
  const pageAt = (u: number) => {
    let scroll = scrollAt(0);
    for (let k = 1; k < n; k++) {
      const ck = clause(k);
      const e = interpolate(
        u,
        [ck.start + ck.beat("scrollFrom"), ck.start + ck.beat("scrollTo")],
        [0, 1],
        { ...CLAMP, easing: EASE_IO },
      );
      scroll += (scrollAt(k) - scrollAt(k - 1)) * e;
    }
    const back = interpolate(
      u,
      [pullback.start + pullback.beat("lead"), pullback.end],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_IO,
      },
    );
    return { back, s: 1 + (sFinal - 1) * back, offY: -scroll * (1 - back) };
  };
  const { back, s, offY } = pageAt(t);
  // The far end of the page sits a whole screen from the corner the scale
  // pivots on, so its tail is still crossing pixels when a progress test
  // already reads rest; compare with the neighbouring frames instead.
  const pageMoved = (a: number, b: number) => {
    const p = pageAt(a);
    const q = pageAt(b);
    return Math.abs(p.offY - q.offY) > 1e-3 || Math.abs(p.s - q.s) * W > 1e-3;
  };
  const pageMoving = pageMoved(t + speed, t) || pageMoved(t, t - speed);
  const dim = 1 - 0.38 * back;

  const wordStyle: React.CSSProperties = {
    position: "absolute",
    height: F0,
    lineHeight: `${F0}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight: BODY_W,
    fontSize: F0,
    letterSpacing: `${TRACK}em`,
    color: fg,
  };

  const nodes = words.map((w, i) => {
    const ck = clause(w.clause);
    const at = ck.start + w.order * ck.beat("stagger");
    const p = interpolate(t, [at, at + ck.beat("word")], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (p <= 0) return null;
    const lineTop = w.line * lineH;
    const screenTop = marginY + (offY + lineTop) * s;
    const seen = interpolate(
      screenTop,
      [marginY - lineH * s * 0.5, marginY + lineH * s * 0.05],
      [0, 1],
      CLAMP,
    );
    return (
      <div
        key={`w${i}`}
        style={{
          ...wordStyle,
          left: w.x * F0,
          top: lineTop + (lineH - F0) / 2,
          opacity: p * seen,
          transform: `translateY(${((1 - p) * F0 * 0.35).toFixed(2)}px)${glide(moving(p))}`,
        }}
      >
        {w.text}
      </div>
    );
  });

  const lastIn = interpolate(
    t,
    [lastEl.start + lastEl.beat("enter"), lastEl.end],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const tailIn = interpolate(
    t,
    [tailEl.start + tailEl.beat("enter"), tailEl.end],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const lastBase = H - marginY;
  const lastTop = lastBase - ((1 - m.asc - m.desc) / 2 + m.asc) * FY;
  const lastStyle: React.CSSProperties = {
    display: "inline-block",
    height: FY,
    lineHeight: `${FY}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight: LAST_W,
    fontSize: FY,
    letterSpacing: `${LAST_TRACK}em`,
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: marginX,
            top: marginY,
            width: room,
            transformOrigin: "0 0",
            transform: `scale(${s.toFixed(5)}) translateY(${offY.toFixed(2)}px)${glide(pageMoving)}`,
            opacity: dim,
          }}
        >
          {nodes}
        </div>
        {lastIn > 0 ? (
          <div
            style={{
              position: "absolute",
              right: marginX,
              top: lastTop - FY * 0.2,
              height: FY * 1.45,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                ...lastStyle,
                marginTop: FY * 0.2,
                color: fg,
                transform: `translateY(${((1 - lastIn) * FY * 1.3).toFixed(2)}px)${glide(moving(lastIn))}`,
              }}
            >
              {lastHead}
            </div>
            <div
              style={{
                ...lastStyle,
                marginTop: FY * 0.2,
                color: hi,
                transform: `translateY(${((1 - tailIn) * FY * 1.3).toFixed(2)}px)${glide(moving(tailIn))}`,
              }}
            >
              {lastTail}
            </div>
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
