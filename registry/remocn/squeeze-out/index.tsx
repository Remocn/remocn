"use client";

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export interface SqueezeOutProps {
  text?: string;
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#1B2A6B",
    ink: "#F3E9D2",
  },
  light: {
    bg: "#F3E9D2",
    ink: "#1B2A6B",
  },
} as const;

const TRACK = 0.004;
const SQ_MIN = 0.26;
const LEAD = 1.0;
const CLEAR = 0.16;

const PER_GLYPH = 1.6;
const RELAX = 30;
const START = 2;
const OVERLAP = 0.6;

const EASE_RELAX = Easing.bezier(0.45, 0, 0.2, 1);
const EASE_FLOW = Easing.bezier(0.45, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  words: { text: string; adv: number[] }[];
  space: number;
  baseline: number;
  cap: number;
  desc: number;
}

function measure(text: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${anton.fontFamily}"`,
    fontWeight: "400",
    fontSize: "100px",
    lineHeight: "1",
    letterSpacing: `${TRACK}em`,
  });
  document.body.appendChild(probe);
  const width = (s: string) => {
    probe.textContent = s;
    return probe.getBoundingClientRect().width / 100;
  };
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const cs = Array.from(w);
      const adv: number[] = [];
      let prev = 0;
      for (let i = 0; i < cs.length; i++) {
        const x = width(cs.slice(0, i + 1).join(""));
        adv.push(x - prev);
        prev = x;
      }
      return { text: w, adv };
    });
  const space = width(" ");
  probe.remove();

  let baseline = 0.78;
  let cap = 0.72;
  let desc = 0.2;
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `400 200px "${anton.fontFamily}"`;
    const fm = ctx.measureText("Hdgpy");
    const asc = fm.fontBoundingBoxAscent / 200;
    const d = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + d)) / 2 + asc;
    cap = ctx.measureText("Hd").actualBoundingBoxAscent / 200;
    desc = fm.actualBoundingBoxDescent / 200;
  }
  return { words, space, baseline, cap, desc };
}

function useMetrics(text: string) {
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("squeeze-out: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      anton.waitUntilDone(),
      document.fonts.load(`400 100px "${anton.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key: text, m: measure(text) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [text, handle]);
  return state && state.key === text ? state.m : null;
}

function balance(widths: number[], space: number, n: number) {
  const k = widths.length;
  const lineW = (a: number, b: number) => {
    let x = 0;
    for (let i = a; i < b; i++) x += widths[i] + (i > a ? space : 0);
    return x;
  };
  let best: number[] = [];
  let bestMax = Number.POSITIVE_INFINITY;
  const walk = (start: number, left: number, cuts: number[]) => {
    if (left === 1) {
      const all = [...cuts, k];
      let prev = 0;
      let mx = 0;
      for (const c of all) {
        mx = Math.max(mx, lineW(prev, c));
        prev = c;
      }
      if (mx < bestMax) {
        bestMax = mx;
        best = all;
      }
      return;
    }
    for (let c = start + 1; c <= k - left + 1; c++)
      walk(c, left - 1, [...cuts, c]);
  };
  walk(0, n, []);
  return { cuts: best, widest: bestMax };
}

interface Glyph {
  ch: string;
  adv: number;
  hi: boolean;
}

export function SqueezeOut({
  text = "Freshly pressed frames.",
  highlight = "",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SqueezeOutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.ink;
  const m = useMetrics(text);

  const hiWords = useMemo(
    () =>
      new Set(
        highlight
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.toLowerCase()),
      ),
    [highlight],
  );

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * (portrait ? 0.08 : 0.075);
  const maxW = W * (portrait ? 0.84 : 0.62);
  const maxH = H * (portrait ? 0.46 : 0.68);
  const lead = Math.max(LEAD, m.cap + m.desc + CLEAR);
  const wordW = m.words.map((w) => w.adv.reduce((a, b) => a + b, 0));
  let best = { F: 0, split: balance(wordW, m.space, 1), lines: 1 };
  for (let n = 1; n <= Math.min(5, m.words.length); n++) {
    const sp = balance(wordW, m.space, n);
    const f = Math.min(
      maxW / Math.max(0.1, sp.widest),
      maxH / (m.cap + (n - 1) * lead + m.desc),
    );
    if (f > best.F * 1.04) best = { F: f, split: sp, lines: n };
  }
  const { F, split, lines } = best;
  const lineH = F * lead;
  const x0 = M;
  const lastBase = H - M - m.desc * F;
  const firstBase = lastBase - (lines - 1) * lineH;

  const rows: Glyph[][] = [];
  let prev = 0;
  for (const cut of split.cuts) {
    const row: Glyph[] = [];
    for (let i = prev; i < cut; i++) {
      const w = m.words[i];
      const hi = hiWords.has(w.text.toLowerCase());
      const cs = Array.from(w.text);
      cs.forEach((ch, j) => {
        row.push({ ch, adv: w.adv[j], hi });
      });
      if (i < cut - 1) row.push({ ch: " ", adv: m.space, hi: false });
    }
    rows.push(row);
    prev = cut;
  }

  const flows: { start: number; dur: number }[] = [];
  let at = START;
  for (const row of rows) {
    const dur = Math.max(12, row.length * PER_GLYPH * 1.25);
    flows.push({ start: at, dur });
    at += dur * OVERLAP;
  }
  const P = (r: number, f: number) => {
    const { start, dur } = flows[r];
    return (
      rows[r].length *
      interpolate(f, [start, start + dur], [0, 1], {
        ...CLAMP,
        easing: EASE_FLOW,
      })
    );
  };
  const leaveAt = (r: number, j: number) => {
    let lo = flows[r].start;
    let hi = flows[r].start + flows[r].dur;
    for (let it = 0; it < 22; it++) {
      const mid = (lo + hi) / 2;
      if (P(r, mid) < j) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {rows.map((row, r) => {
        const lineW = row.reduce((a, g) => a + g.adv, 0) * F;
        const nozzle = x0 + lineW;
        const base = firstBase + r * lineH;
        const top = base - m.cap * F - F * 0.12;
        const h = (m.cap + m.desc) * F + F * 0.24;
        const boxTop = base - m.baseline * F;
        const p = P(r, t);

        const cur = row.map((g, j) => {
          const age = t - leaveAt(r, j);
          const sq =
            SQ_MIN +
            (1 - SQ_MIN) *
              interpolate(age, [0, RELAX], [0, 1], {
                ...CLAMP,
                easing: EASE_RELAX,
              });
          const out = Math.min(1, Math.max(0, p - j));
          return { sq, w: g.adv * sq * F, out };
        });
        const xs: number[] = new Array(row.length).fill(0);
        let edge = nozzle;
        for (let j = row.length - 1; j >= 0; j--) {
          edge -= cur[j].out * cur[j].w;
          xs[j] = edge;
        }
        return (
          <div
            key={`row-${r}`}
            style={{
              position: "absolute",
              left: 0,
              top,
              width: nozzle,
              height: h,
              overflow: "hidden",
            }}
          >
            {row.map((g, j) => {
              if (cur[j].out <= 0 || g.ch === " ") return null;
              return (
                <div
                  key={`g-${r}-${j}`}
                  style={{
                    position: "absolute",
                    left: xs[j],
                    top: boxTop - top,
                    height: F,
                    lineHeight: `${F}px`,
                    whiteSpace: "pre",
                    fontFamily: anton.fontFamily,
                    fontWeight: 400,
                    fontSize: F,
                    letterSpacing: `${TRACK}em`,
                    color: g.hi ? spot : c.ink,
                    transformOrigin: "0% 50%",
                    transform: `scaleX(${cur[j].sq.toFixed(4)})`,
                    opacity: Math.min(1, 0.25 + cur[j].out),
                  }}
                >
                  {g.ch}
                </div>
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
