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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const gabarito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AndYouProps {
  clauses?: string[];
  last?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

function measure(): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("and-you: no 2d context");
  const bodyCache: Record<string, number> = {};
  const lastCache: Record<string, number> = {};
  const em = (s: string, w: number, track: number) => {
    ctx.font = `${w} ${FONT_PX}px "${gabarito.fontFamily}"`;
    return ctx.measureText(s).width / FONT_PX + track * Array.from(s).length;
  };
  ctx.font = `${BODY_W} ${FONT_PX}px "${gabarito.fontFamily}"`;
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

function useMetrics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("and-you: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      gabarito.waitUntilDone(),
      document.fonts.load(`${BODY_W} 100px "${gabarito.fontFamily}"`),
      document.fonts.load(`${LAST_W} 100px "${gabarito.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure());
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
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

export function AndYou({
  clauses = [
    "For the founder who launches on Monday,",
    "the designer who just learned React,",
    "the two-person studio,",
    "the student with a weekend project,",
  ],
  last = "and you.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: AndYouProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const t = frame * speed;
  const D = Math.max(110, durationInFrames);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const list = clauses.length > 0 ? clauses : ["For everyone who builds,"];
  const m = useMetrics();

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

  const start = 6;
  const cl = Math.min(30, Math.max(14, (D * 0.56 - start) / n));
  const clauseAt = (k: number) => start + k * cl;
  const finalAt = clauseAt(n);

  let scroll = scrollAt(0);
  for (let k = 1; k < n; k++) {
    const e = interpolate(t, [clauseAt(k) - 2, clauseAt(k) + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    scroll += (scrollAt(k) - scrollAt(k - 1)) * e;
  }
  const back = interpolate(t, [finalAt - 4, finalAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const s = 1 + (sFinal - 1) * back;
  const offY = -scroll * (1 - back);
  const dim = 1 - 0.38 * back;

  const wordStyle: React.CSSProperties = {
    position: "absolute",
    height: F0,
    lineHeight: `${F0}px`,
    whiteSpace: "pre",
    fontFamily: gabarito.fontFamily,
    fontWeight: BODY_W,
    fontSize: F0,
    letterSpacing: `${TRACK}em`,
    color: c.ink,
  };

  const nodes = words.map((w, i) => {
    const at = clauseAt(w.clause) + w.order * 2;
    const p = interpolate(t, [at, at + 14], [0, 1], {
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
          transform: `translateY(${((1 - p) * F0 * 0.35).toFixed(2)}px)`,
        }}
      >
        {w.text}
      </div>
    );
  });

  const lastIn = interpolate(t, [finalAt + 4, finalAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tailIn = interpolate(t, [finalAt + 8, finalAt + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lastBase = H - marginY;
  const lastTop = lastBase - ((1 - m.asc - m.desc) / 2 + m.asc) * FY;
  const lastStyle: React.CSSProperties = {
    display: "inline-block",
    height: FY,
    lineHeight: `${FY}px`,
    whiteSpace: "pre",
    fontFamily: gabarito.fontFamily,
    fontWeight: LAST_W,
    fontSize: FY,
    letterSpacing: `${LAST_TRACK}em`,
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: marginX,
          top: marginY,
          width: room,
          transformOrigin: "0 0",
          transform: `scale(${s.toFixed(5)}) translateY(${offY.toFixed(2)}px)`,
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
              color: c.ink,
              transform: `translateY(${((1 - lastIn) * FY * 1.3).toFixed(2)}px)`,
            }}
          >
            {lastHead}
          </div>
          <div
            style={{
              ...lastStyle,
              marginTop: FY * 0.2,
              color: hi,
              transform: `translateY(${((1 - tailIn) * FY * 1.3).toFixed(2)}px)`,
            }}
          >
            {lastTail}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
