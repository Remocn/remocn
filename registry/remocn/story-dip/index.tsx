"use client";

import { loadFont } from "@remotion/google-fonts/Afacad";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const afacad = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StoryBeat {
  slug: string;
  line: string;
}

export interface StoryDipProps {
  setup?: StoryBeat;
  snag?: StoryBeat;
  resolution?: StoryBeat;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#3A1F1A", ink: "#FBF3EA", accent: "#F2B544" },
  light: { bg: "#FBF6EE", ink: "#3B2414", accent: "#B07A00" },
} as const;

const DEFAULT_SETUP: StoryBeat = {
  slug: "Wednesday, 4:00 PM",
  line: "Leo’s film was one render away.",
};
const DEFAULT_SNAG: StoryBeat = {
  slug: "4:05 PM",
  line: "Then the client sent a new logo.",
};
const DEFAULT_RESOLUTION: StoryBeat = {
  slug: "4:15 PM",
  line: "One prop later, every scene had it.",
};

const LINE_TRACK = -0.02;
const SLUG_TRACK = 0.09;
const LH = 1.04;
const PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FALL = Easing.bezier(0.55, 0, 0.9, 0.45);
const EASE_CLIMB = Easing.bezier(0.45, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function useWidths(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("story-dip: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      afacad.waitUntilDone(),
      document.fonts.load(`400 ${PX}px "${afacad.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `400 ${PX}px "${afacad.fontFamily}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / PX : s.length * 0.45;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.w : null;
}

function wrapLines(ws: string[], adv: (s: string) => number, max: number) {
  const space = adv(" ");
  const lines: string[][] = [[]];
  let x = 0;
  for (const word of ws) {
    const w = adv(word);
    const cur = lines[lines.length - 1];
    if (cur.length > 0 && x + space + w > max) {
      lines.push([word]);
      x = w;
    } else {
      x += (cur.length > 0 ? space : 0) + w;
      cur.push(word);
    }
  }
  return lines;
}

function balancedLines(ws: string[], adv: (s: string) => number, max: number) {
  const base = wrapLines(ws, adv, max);
  if (base.length <= 1) return base;
  let lo = Math.max(...ws.map(adv));
  let hi = max;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (wrapLines(ws, adv, mid).length <= base.length) hi = mid;
    else lo = mid;
  }
  return wrapLines(ws, adv, hi);
}

export function StoryDip({
  setup = DEFAULT_SETUP,
  snag = DEFAULT_SNAG,
  resolution = DEFAULT_RESOLUTION,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: StoryDipProps) {
  const frame = useCurrentFrame();
  const t = frame * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const beats = [setup, snag, resolution];
  const tokens = beats.map((b) => b.line.split(/\s+/).filter(Boolean));
  const strings = Array.from(new Set([" ", ...tokens.flat()]));
  const w = useWidths(strings);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const marginX = W * (portrait ? 0.05 : 0.045);
  const gutter = W * (portrait ? 0.03 : 0.025);
  const cols = portrait ? 2 : 3;
  const colW = (W - 2 * marginX - (cols - 1) * gutter) / cols;
  const colOf = portrait ? [0, 0, 1] : [0, 1, 2];
  const maxLines = portrait ? 5 : 4;
  const adv = (s: string) => (w[s] ?? 0) + LINE_TRACK * Array.from(s).length;

  let F = portrait ? W * 0.1 : H * 0.1;
  for (let k = 0; k < 60; k++) {
    const ok = tokens.every(
      (ws) => wrapLines(ws, adv, colW / F).length <= maxLines,
    );
    if (ok) break;
    F *= 0.96;
  }
  const S = Math.max(14, F * 0.3);
  const laid = tokens.map((ws) => balancedLines(ws, adv, colW / F));
  const slugBlock = S * 1.2 + S * 0.9;
  const heights = laid.map((l) => slugBlock + l.length * F * LH);

  const top = H * (portrait ? 0.08 : 0.06);
  const bottom = H * (portrait ? 0.92 : 0.94);
  const startTop = H * (portrait ? 0.4 : 0.5) - heights[0] / 2;
  const gapY = F * 0.6;
  const lowTop = bottom - heights[1];
  const highTop = top;

  const k = Math.min(1.6, Math.max(0.75, T / 180));
  const at = (f: number) => f * k;
  const inAt = [at(2), at(30), at(86)];
  const fallA = at(54);
  const fallB = at(70);
  const climbA = at(108);
  const climbB = at(132);

  const fall = interpolate(t, [fallA, fallB], [0, 1], {
    ...CLAMP,
    easing: EASE_FALL,
  });
  const settle = interpolate(t, [fallB, fallB + 5, fallB + 12], [0, 1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const climb = interpolate(t, [climbA, climbB], [0, 1], {
    ...CLAMP,
    easing: EASE_CLIMB,
  });

  const snagStart = portrait
    ? Math.min(lowTop, startTop + heights[0] + gapY)
    : startTop;
  const snagTop =
    snagStart + (lowTop - snagStart) * fall + unit * 0.012 * settle;
  const resTop = lowTop + (highTop - lowTop) * climb;
  const tops = [startTop, snagTop, resTop];

  const lowDim = interpolate(t, [fallA, fallB], [1, 0.62], CLAMP);
  const lift = interpolate(t, [climbA + 8, climbB], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: afacad.fontFamily,
      }}
    >
      {beats.map((b, i) => {
        const x = marginX + colOf[i] * (colW + gutter);
        const slugE = interpolate(t, [inAt[i], inAt[i] + 14], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (slugE <= 0.001) return null;
        const lines = laid[i];
        const count = lines.reduce((n, l) => n + l.length, 0);
        const step = Math.min(2.4, 14 / Math.max(1, count));
        let idx = 0;
        const ink =
          i === 2 ? interpolateColors(lift, [0, 1], [c.ink, hi]) : c.ink;
        const inkOpacity = i === 1 ? lowDim : 1;
        return (
          <div
            key={`${b.slug}${String(i)}`}
            style={{
              position: "absolute",
              left: x,
              top: tops[i],
              width: colW,
            }}
          >
            <div
              style={{
                fontSize: S,
                fontWeight: 500,
                letterSpacing: `${SLUG_TRACK}em`,
                textTransform: "uppercase",
                color: hi,
                lineHeight: 1.2,
                marginBottom: S * 0.9,
                whiteSpace: "nowrap",
                opacity: slugE,
                transform: `translateY(${((1 - slugE) * S).toFixed(2)}px)`,
              }}
            >
              {b.slug}
            </div>
            {lines.map((line, li) => (
              <div
                key={`${line.join(" ")}${String(li)}`}
                style={{
                  height: F * LH,
                  lineHeight: `${F * LH}px`,
                  fontSize: F,
                  whiteSpace: "pre",
                  letterSpacing: `${LINE_TRACK}em`,
                }}
              >
                {line.map((word, wi) => {
                  const s0 = inAt[i] + 4 + idx * step;
                  idx++;
                  const e = interpolate(t, [s0, s0 + 14], [0, 1], {
                    ...CLAMP,
                    easing: EASE_OUT,
                  });
                  return (
                    <span
                      key={`${word}${String(wi)}`}
                      style={{
                        display: "inline-block",
                        color: ink,
                        opacity: e * inkOpacity,
                        transform: `translateY(${((1 - e) * F * 0.4).toFixed(2)}px)`,
                        marginRight:
                          wi < line.length - 1 ? `${adv(" ").toFixed(3)}em` : 0,
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
