"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSchibsted } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
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

const grotesk = loadSchibsted("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface FillerCutProps {
  transcript?: string;
  keep?: string;
  highlight?: string;
  showTime?: boolean;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#8E8D94",
    filler: "rgba(244, 243, 240, 0.26)",
    stops: [HALO[1], HALO[2]],
    glow: 0.16,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#77746E",
    filler: "rgba(17, 17, 19, 0.22)",
    stops: ["#f08a2c", HALO[2]],
    glow: 0.1,
    grain: 0.035,
  },
} as const;

const SPEAK_TRACK = -0.01;
const HEAD_TRACK = -0.04;
const SPEAK_LEAD = 1.32;
const HEAD_LEAD = 1.02;

const SPEAK_AT = 4;
const SPEAK_PER = 2;
const SPEAK_MAX = 28;
const MARK_AT = 34;
const MARK_TO_CUT = 10;
const CUT_GAP = 6;
const CUT_LEN = 10;
const REFLOW_GAP = 2;
const REFLOW_LEN = 12;
const SET_GAP = 4;
const SET_LEN = 24;
const SEC_PER_WORD = 0.38;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CUT = Easing.bezier(0.6, 0, 0.2, 1);
const EASE_SET = Easing.bezier(0.7, 0, 0.16, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

interface Token {
  said: string;
  keep: number;
  cut: number;
}

function plan(transcript: string, keep: string) {
  const said = transcript.split(/\s+/).filter(Boolean);
  const kept = keep.split(/\s+/).filter(Boolean);
  const tokens: Token[] = said.map((s) => ({ said: s, keep: -1, cut: -1 }));
  let j = 0;
  for (let i = 0; i < tokens.length && j < kept.length; i++)
    if (norm(tokens[i].said) === norm(kept[j])) tokens[i].keep = j++;
  const extra = kept.map((_, q) => q).filter((q) => q >= j);
  let cuts = 0;
  tokens.forEach((tk, i) => {
    if (tk.keep >= 0) return;
    tk.cut = i > 0 && tokens[i - 1].cut >= 0 ? tokens[i - 1].cut : cuts++;
  });
  return { tokens, kept, extra, cuts };
}

interface Metrics {
  said: number[];
  head: number[];
  space400: number;
  space500: number;
}

function measure(said: string[], kept: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fam = `"${grotesk.fontFamily}"`;
  if (!ctx)
    return {
      said: said.map((s) => s.length * 0.5),
      head: kept.map((s) => s.length * 0.52),
      space400: 0.25,
      space500: 0.25,
    };
  const width = (s: string, track: number) =>
    ctx.measureText(s).width / 1000 + track * Array.from(s).length;
  ctx.font = `400 1000px ${fam}`;
  const s400 = said.map((s) => width(s, SPEAK_TRACK));
  const space400 = ctx.measureText(" ").width / 1000;
  ctx.font = `500 1000px ${fam}`;
  const h500 = kept.map((s) => width(s, HEAD_TRACK));
  const space500 = ctx.measureText(" ").width / 1000;
  return { said: s400, head: h500, space400, space500 };
}

function useMetrics(said: string[], kept: string[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("filler-cut: measuring"));
  const released = useRef(false);
  const key = `${said.join(" ")}\n${kept.join(" ")}`;
  useEffect(() => {
    let live = true;
    Promise.all([
      grotesk.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`400 100px "${grotesk.fontFamily}"`),
      document.fonts.load(`500 100px "${grotesk.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [a, b] = key.split("\n");
        setMetrics(
          measure(a.split(" ").filter(Boolean), b.split(" ").filter(Boolean)),
        );
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return metrics;
}

function wrap(widths: number[], space: number, size: number, maxW: number) {
  const line: number[] = [];
  let li = 0;
  let x = 0;
  widths.forEach((w, i) => {
    const add = (x > 0 ? space : 0) * size + w * size;
    if (x > 0 && x + add > maxW) {
      li++;
      x = w * size;
    } else x += add;
    line[i] = li;
  });
  return line;
}

function headlineBreaks(
  widths: number[],
  space: number,
  maxW: number,
  cap: number,
) {
  const n = widths.length;
  let best: { line: number[]; size: number } | null = null;
  const tries: { line: number[]; size: number }[] = [];
  for (let mask = 0; mask < 1 << Math.max(0, n - 1); mask++) {
    let k = 1;
    for (let q = 0; q < n - 1; q++) if (mask & (1 << q)) k++;
    if (k > 3) continue;
    const line: number[] = [0];
    const lw = [widths[0]];
    for (let q = 1; q < n; q++) {
      if (mask & (1 << (q - 1))) {
        line.push(line[q - 1] + 1);
        lw.push(widths[q]);
      } else {
        line.push(line[q - 1]);
        lw[lw.length - 1] += space + widths[q];
      }
    }
    const widest = Math.max(...lw);
    const spread = widest - Math.min(...lw);
    tries.push({ line, size: Math.min(cap, maxW / widest) - spread * 0.001 });
  }
  const top = Math.max(...tries.map((r) => r.size));
  for (const r of tries) {
    const k = r.line[r.line.length - 1] + 1;
    const bk = best ? best.line[best.line.length - 1] + 1 : 99;
    if (r.size < top * 0.9) continue;
    if (!best || k < bk || (k === bk && r.size > best.size)) best = r;
  }
  return best ?? { line: widths.map(() => 0), size: cap };
}

function Grain({ opacity }: { opacity: number }) {
  const id = `fc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={9}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const shade = (a: string, b: string, p: number) =>
  p <= 0
    ? b
    : p >= 1
      ? a
      : `color-mix(in oklab, ${a} ${(p * 100).toFixed(1)}%, ${b})`;

const clock = (sec: number) => {
  const s = Math.max(0, sec);
  const whole = Math.floor(s);
  const tenth = Math.floor((s - whole) * 10);
  return `0:${String(whole).padStart(2, "0")}.${tenth}`;
};

export function FillerCut({
  transcript = "So, um, ship your, like, launch video, uh, today. You know?",
  keep = "Ship your launch video today.",
  highlight = "today.",
  showTime = true,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: FillerCutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const P = useMemo(() => plan(transcript, keep), [transcript, keep]);
  const m = useMetrics(
    P.tokens.map((tk) => tk.said),
    P.kept,
  );

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const portrait = H > W;
  const unit = Math.min(W, H);
  const left = W * (portrait ? 0.08 : 0.1);
  const maxW = W - left * 2;
  const sA = portrait ? W * 0.075 : unit * 0.084;
  const lineA = wrap(m.said, m.space400, sA, maxW);
  const nLinesA = (lineA[lineA.length - 1] ?? 0) + 1;

  const n = P.tokens.length;
  const speakPer = Math.min(SPEAK_PER, SPEAK_MAX / Math.max(1, n - 1));
  const markAt = Math.max(MARK_AT, SPEAK_AT + (n - 1) * speakPer + 8);
  const cutAt = markAt + MARK_TO_CUT;
  const cutP = (k: number) =>
    interpolate(
      t,
      [cutAt + k * CUT_GAP, cutAt + k * CUT_GAP + CUT_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_CUT },
    );
  const collapse = P.tokens.map((tk) => (tk.cut >= 0 ? cutP(tk.cut) : 0));

  const ripple = (col: number[]) => {
    const lineH = new Array(nLinesA).fill(0);
    for (let li = 0; li < nLinesA; li++) {
      let h = 0;
      for (let i = 0; i < n; i++)
        if (lineA[i] === li) h = Math.max(h, 1 - col[i]);
      lineH[li] = h * SPEAK_LEAD * sA;
    }
    const total = lineH.reduce((a, b) => a + b, 0);
    const top = H * 0.5 - total / 2;
    const xs: number[] = [];
    const ys: number[] = [];
    let y = top;
    for (let li = 0; li < nLinesA; li++) {
      let x = left;
      P.tokens.forEach((_, i) => {
        if (lineA[i] !== li) return;
        xs[i] = x;
        ys[i] = y + (SPEAK_LEAD * sA) / 2;
        x += (m.said[i] + m.space400) * sA * (1 - col[i]);
      });
      y += lineH[li];
    }
    return { xs, ys, total, top };
  };
  const live = ripple(collapse);
  const cutDone = ripple(P.tokens.map((tk) => (tk.cut >= 0 ? 1 : 0)));

  const cap = portrait ? W * 0.15 : H * 0.19;
  const hb = headlineBreaks(m.head, m.space500, maxW, cap);
  const sC = hb.size;
  const nLinesC = (hb.line[hb.line.length - 1] ?? 0) + 1;
  const blockC = nLinesC * HEAD_LEAD * sC;
  const topC = H * 0.5 - blockC / 2;
  const headX: number[] = [];
  const headY: number[] = [];
  {
    let x = left;
    let prev = -1;
    P.kept.forEach((_, q) => {
      if (hb.line[q] !== prev) {
        x = left;
        prev = hb.line[q];
      }
      headX[q] = x;
      headY[q] = topC + (hb.line[q] + 0.5) * HEAD_LEAD * sC;
      x += (m.head[q] + m.space500) * sC;
    });
  }

  const cutEnd = cutAt + Math.max(0, P.cuts - 1) * CUT_GAP + CUT_LEN;
  const reflowAt = cutEnd + REFLOW_GAP;
  const reflowEarly = interpolate(
    t,
    [reflowAt, reflowAt + REFLOW_LEN * 0.6],
    [0, 1],
    { ...CLAMP, easing: EASE_SET },
  );
  const reflowLate = interpolate(
    t,
    [reflowAt + REFLOW_LEN * 0.4, reflowAt + REFLOW_LEN],
    [0, 1],
    { ...CLAMP, easing: EASE_SET },
  );
  const reflowP = reflowEarly;
  const keptIdx = P.tokens.flatMap((tk, i) => (tk.keep >= 0 ? [i] : []));
  const lineB = wrap(
    keptIdx.map((i) => m.said[i]),
    m.space400,
    sA,
    maxW,
  );
  const nLinesB = (lineB[lineB.length - 1] ?? 0) + 1;
  const topB = H * 0.5 - (nLinesB * SPEAK_LEAD * sA) / 2;
  const reX: number[] = [];
  const reY: number[] = [];
  {
    let x = left;
    let prev = -1;
    keptIdx.forEach((i, r) => {
      if (lineB[r] !== prev) {
        x = left;
        prev = lineB[r];
      }
      reX[i] = x;
      reY[i] = topB + (lineB[r] + 0.5) * SPEAK_LEAD * sA;
      x += (m.said[i] + m.space400) * sA;
    });
  }
  const setAt = reflowAt + REFLOW_LEN + SET_GAP;
  const setP = interpolate(t, [setAt, setAt + SET_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_SET,
  });
  const setY = interpolate(t, [setAt, setAt + SET_LEN * 0.7], [0, 1], {
    ...CLAMP,
    easing: EASE_SET,
  });
  const markP = interpolate(t, [markAt, markAt + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hiP = interpolate(
    t,
    [setAt + SET_LEN - 6, setAt + SET_LEN + 10],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );
  const hiStart = highlight ? keep.lastIndexOf(highlight) : -1;
  const isHi = (q: number) => {
    if (hiStart < 0) return false;
    let at = 0;
    const words = keep.split(/\s+/).filter(Boolean);
    for (let i = 0; i < q; i++)
      at = keep.indexOf(words[i], at) + words[i].length;
    const s = keep.indexOf(words[q], at);
    return s < hiStart + highlight.length && s + words[q].length > hiStart;
  };
  const fill = `linear-gradient(100deg, ${c.stops[0]} 0%, ${c.stops[1]} 55%, ${accent} 100%)`;

  const els: React.ReactNode[] = [];
  P.tokens.forEach((tk, i) => {
    const spoken = interpolate(
      t,
      [SPEAK_AT + i * speakPer, SPEAK_AT + i * speakPer + 8],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const survivor = tk.keep >= 0;
    if (!survivor) {
      const col = collapse[i];
      if (col >= 1) return;
      els.push(
        <div
          key={`s${i}`}
          style={{
            position: "absolute",
            left: live.xs[i],
            top: live.ys[i] - sA * 0.5,
            fontFamily: grotesk.fontFamily,
            fontWeight: 400,
            fontSize: sA,
            lineHeight: `${sA}px`,
            letterSpacing: `${SPEAK_TRACK}em`,
            whiteSpace: "pre",
            color: shade(c.filler, c.muted, markP),
            opacity: spoken * (1 - col) ** 0.6,
            transformOrigin: "0% 50%",
            transform: `translateY(${((1 - spoken) * sA * 0.4).toFixed(2)}px) scaleX(${(1 - col).toFixed(4)})`,
          }}
        >
          {tk.said}
        </div>,
      );
      return;
    }
    const q = tk.keep;
    const p = setP;
    const size = lerp(sA, sC, p);
    const up = reY[i] < cutDone.ys[i] - 1;
    const preX =
      reflowP > 0
        ? lerp(cutDone.xs[i], reX[i], up ? reflowEarly : reflowLate)
        : live.xs[i];
    const preY =
      reflowP > 0
        ? lerp(cutDone.ys[i], reY[i], up ? reflowLate : reflowEarly)
        : live.ys[i];
    const x = lerp(preX, headX[q], p);
    const yMid = lerp(preY, headY[q], setY);
    const head = p >= 0.5;
    const hi = isHi(q);
    const textStyle: React.CSSProperties = {
      position: "absolute",
      left: x,
      top: yMid - size * 0.5,
      fontFamily: grotesk.fontFamily,
      fontWeight: head ? 500 : 400,
      fontSize: size,
      lineHeight: `${size}px`,
      letterSpacing: `${lerp(SPEAK_TRACK, HEAD_TRACK, p)}em`,
      whiteSpace: "pre",
      transform: `translateY(${((1 - spoken) * sA * 0.4).toFixed(2)}px)`,
      opacity: spoken,
    };
    const ink = shade(c.ink, c.muted, markP);
    const word = head ? P.kept[q] : tk.said;
    els.push(
      <div key={`k${i}`} style={{ ...textStyle, color: ink }}>
        {word}
      </div>,
    );
    if (hi && hiP > 0)
      els.push(
        <div
          key={`h${i}`}
          style={{
            ...textStyle,
            color: "transparent",
            backgroundImage: fill,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            opacity: hiP,
          }}
        >
          {word}
        </div>,
      );
  });
  for (const q of P.extra) {
    const a = interpolate(t, [setAt + 8, setAt + SET_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    els.push(
      <div
        key={`x${q}`}
        style={{
          position: "absolute",
          left: headX[q],
          top: headY[q] - sC * 0.5 + (1 - a) * sC * 0.3,
          fontFamily: grotesk.fontFamily,
          fontWeight: 500,
          fontSize: sC,
          lineHeight: `${sC}px`,
          letterSpacing: `${HEAD_TRACK}em`,
          whiteSpace: "pre",
          color: c.ink,
          opacity: a,
        }}
      >
        {P.kept[q]}
      </div>,
    );
  }

  const gone = P.tokens.reduce(
    (acc, tk, i) => acc + (tk.cut >= 0 ? collapse[i] : 0),
    0,
  );
  const secs = (n - gone) * SEC_PER_WORD;
  const timeOn =
    interpolate(t, [SPEAK_AT + 4, SPEAK_AT + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    }) *
    (1 - interpolate(t, [setAt, setAt + 10], [0, 1], CLAMP));
  const timeSize = Math.max(unit * 0.024, 11);
  const blockTop = live.top;

  const glow = `radial-gradient(60% 50% at 30% 55%, color-mix(in oklab, ${c.stops[1]} ${(c.glow * 100 * hiP).toFixed(1)}%, transparent) 0%, transparent 70%)`;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: glow }} />
      {els}
      {showTime ? (
        <div
          style={{
            position: "absolute",
            left,
            top: blockTop - timeSize * 2.6,
            display: "flex",
            gap: timeSize * 1.2,
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: timeSize,
            lineHeight: 1,
            letterSpacing: "0.04em",
            color: c.muted,
            fontVariantNumeric: "tabular-nums",
            opacity: timeOn,
            whiteSpace: "pre",
          }}
        >
          <span style={{ color: c.ink }}>{clock(secs)}</span>
          <span>{gone > 0.05 ? `−${clock(gone * SEC_PER_WORD)}` : ""}</span>
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
