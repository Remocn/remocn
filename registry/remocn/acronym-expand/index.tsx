"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
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

const sora = loadSora("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export interface AcronymExpandProps {
  short?: string;
  full?: string;
  eyebrow?: string;
  subhead?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    ground: [
      `radial-gradient(46% 58% at 50% 52%, color-mix(in oklab, ${LIMB[3]} 85%, transparent) 0%, transparent 72%)`,
      `radial-gradient(30% 34% at 50% 50%, color-mix(in oklab, ${LIMB[2]} 22%, transparent) 0%, transparent 80%)`,
    ].join(", "),
    init: (a: string) =>
      `linear-gradient(120deg, ${LIMB[0]} 0%, ${LIMB[1]} 42%, color-mix(in oklab, ${a} 75%, ${LIMB[1]}) 72%, ${LIMB[1]} 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    ground: [
      `radial-gradient(46% 58% at 50% 52%, color-mix(in oklab, ${LIMB[0]} 90%, transparent) 0%, transparent 72%)`,
      `radial-gradient(30% 34% at 50% 50%, color-mix(in oklab, ${LIMB[1]} 16%, transparent) 0%, transparent 80%)`,
    ].join(", "),
    init: (a: string) =>
      `linear-gradient(120deg, ${LIMB[2]} 0%, ${a} 46%, ${LIMB[1]} 100%)`,
  },
} as const;

const TRACK_SHORT = -0.02;
const TRACK_FULL = -0.035;
const LINE = 1.08;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.72, 0, 0.18, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Measure = ((s: string) => number) & {
  base: number;
};

function useMeasure(): Measure {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("acronym-expand: measuring"));
  const released = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    let live = true;
    const font = `500 100px "${sora.fontFamily}"`;
    Promise.all([sora.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) ctx.font = font;
        ctxRef.current = ctx;
        setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);

  const ctx = ready ? ctxRef.current : null;
  const fn = (s: string) =>
    ctx ? ctx.measureText(s).width / 100 : s.length * 0.6;
  let asc = 0.97;
  let desc = 0.24;
  if (ctx) {
    const m = ctx.measureText("Hg");
    asc = m.fontBoundingBoxAscent / 100 || asc;
    desc = m.fontBoundingBoxDescent / 100 || desc;
  }
  return Object.assign(fn, { base: (LINE - asc - desc) / 2 + asc });
}

function matchInitials(short: string, full: string) {
  const lower = full.toLowerCase();
  const starts = new Set<number>();
  for (let i = 0; i < full.length; i++) {
    if (full[i] !== " " && (i === 0 || full[i - 1] === " ")) starts.add(i);
  }
  const out: number[] = [];
  let from = 0;
  for (const ch of short.toLowerCase()) {
    if (ch === " ") {
      out.push(-1);
      continue;
    }
    let hit = -1;
    for (let i = from; i < lower.length; i++) {
      if (lower[i] === ch && starts.has(i)) {
        hit = i;
        break;
      }
    }
    if (hit < 0) hit = lower.indexOf(ch, from);
    out.push(hit);
    if (hit >= 0) from = hit + 1;
  }
  return out;
}

function splitTwo(words: string[], measure: Measure) {
  let best = { a: words.join(" "), b: "", w: Number.POSITIVE_INFINITY };
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" ");
    const b = words.slice(k).join(" ");
    const w = Math.max(measure(a), measure(b));
    if (w < best.w) best = { a, b, w };
  }
  return best;
}

interface Glyph {
  ch: string;
  x: number;
  y: number;
  fs: number;
  w: number;
}

function placeLine(
  text: string,
  measure: Measure,
  fs: number,
  track: number,
  cx: number,
  top: number,
): Glyph[] {
  const total = measure(text) + track * Math.max(0, text.length - 1);
  const left = cx - (total * fs) / 2;
  const out: Glyph[] = [];
  for (let i = 0; i < text.length; i++) {
    const x = left + (measure(text.slice(0, i)) + track * i) * fs;
    const w = (measure(text.slice(0, i + 1)) - measure(text.slice(0, i))) * fs;
    out.push({ ch: text[i], x, y: top, fs, w });
  }
  return out;
}

export function AcronymExpand({
  short = "MCP",
  full = "Model Context Protocol",
  eyebrow = "Now in remocn",
  subhead = "Your agent browses, installs and edits every component.",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: AcronymExpandProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const measure = useMeasure();

  const portrait = height > width * 1.1;
  const s = portrait ? width / 1080 : Math.min(width / 1280, height / 720);
  const maxW = width * (portrait ? 0.84 : 0.8);
  const cx = width / 2;

  const words = full.split(/\s+/).filter(Boolean);
  const oneEm = measure(full) + TRACK_FULL * Math.max(0, full.length - 1);
  const capFull = (portrait ? 156 : 112) * s;
  let lines = [words.join(" ")];
  let fsF = Math.min(capFull, maxW / Math.max(oneEm, 0.01));
  if (words.length > 1) {
    const two = splitTwo(words, measure);
    const twoEm = two.w + TRACK_FULL * Math.max(two.a.length, two.b.length);
    const fsTwo = Math.min(capFull, maxW / Math.max(twoEm, 0.01));
    if (fsTwo > fsF * 1.3 || portrait) {
      lines = [two.a, two.b];
      fsF = fsTwo;
    }
  }

  const eyeFs = (portrait ? 26 : 19) * s;
  const subFs = (portrait ? 34 : 26) * s;
  const eyeH = eyebrow ? eyeFs * 1.2 + fsF * 0.42 : 0;
  const fullH = lines.length * LINE * fsF;
  const subH = subhead ? fsF * 0.34 + subFs * 1.4 * (portrait ? 2 : 1) : 0;
  const stackTop = height / 2 - (eyeH + fullH + subH) / 2;
  const fullTop = stackTop + eyeH;
  const fullCy = fullTop + fullH / 2;

  const fullGlyphs: Glyph[] = [];
  lines.forEach((ln, i) => {
    for (const g of placeLine(
      ln,
      measure,
      fsF,
      TRACK_FULL,
      cx,
      fullTop + i * LINE * fsF,
    )) {
      fullGlyphs.push(g);
    }
    if (i < lines.length - 1)
      fullGlyphs.push({ ch: " ", x: 0, y: 0, fs: fsF, w: 0 });
  });
  const joined = lines.join(" ");

  const shortEm = measure(short) + TRACK_SHORT * Math.max(0, short.length - 1);
  const fsS = Math.min(
    (portrait ? 330 : 300) * s,
    (maxW * 0.86) / Math.max(shortEm, 0.01),
    height * 0.5,
  );
  const shortGlyphs = placeLine(
    short,
    measure,
    fsS,
    TRACK_SHORT,
    cx,
    fullCy - (LINE * fsS) / 2,
  );

  const anchors = matchInitials(short, joined);
  const anchorOf = new Map<number, number>();
  anchors.forEach((fi, si) => {
    if (fi >= 0) anchorOf.set(fi, si);
  });

  const wordSpans: { a: number; b: number; anchor: number }[] = [];
  {
    const re = /\S+/g;
    for (let m = re.exec(joined); m; m = re.exec(joined)) {
      const a = m.index;
      const b = a + m[0].length;
      let anchor = -1;
      for (let i = a; i < b; i++) {
        if (anchorOf.has(i)) {
          anchor = i;
          break;
        }
      }
      wordSpans.push({ a, b, anchor });
    }
  }

  const EXPAND = 38;
  const EXPAND_LEN = 26;
  const anchorT = (si: number) =>
    EASE_IO(clamp01((frame - EXPAND - si * 2) / EXPAND_LEN));
  const drift = interpolate(
    frame,
    [0, durationInFrames * speed],
    [0, 1],
    CLAMP,
  );

  type Draw = {
    id: string;
    ch: string;
    x: number;
    y: number;
    fs: number;
    opacity: number;
    blur: number;
    init: number;
    z: number;
  };
  const draws: Draw[] = [];

  const mid = (short.length - 1) / 2;
  shortGlyphs.forEach((g, si) => {
    if (g.ch === " ") return;
    const e = EASE_OUT(clamp01((frame - si * 3) / 18));
    const spread = (1 - e) * (si - mid) * 0.14 * fsS;
    const fi = anchors[si];
    const u = anchorT(si);
    if (fi < 0) {
      const out = clamp01((frame - EXPAND) / 12);
      draws.push({
        id: `s${si}`,
        ch: g.ch,
        x: g.x + spread,
        y: g.y + (1 - e) * 0.4 * fsS,
        fs: g.fs,
        opacity: e * (1 - out),
        blur: (1 - e) * 0.05 * fsS + out * 0.04 * fsS,
        init: 1,
        z: 2,
      });
      return;
    }
    const f = fullGlyphs[fi];
    const fs = g.fs + (f.fs - g.fs) * u;
    const x = g.x + spread + (f.x - g.x) * u;
    const y = g.y + (1 - e) * 0.4 * fsS + (f.y - g.y) * u;
    const same = g.ch === f.ch;
    const c = same ? 0 : interpolate(u, [0.35, 0.75], [0, 1], CLAMP);
    draws.push({
      id: `s${si}`,
      ch: g.ch,
      x,
      y,
      fs,
      opacity: e * (1 - c),
      blur: (1 - e) * 0.05 * fsS,
      init: 1,
      z: 2,
    });
    if (!same) {
      draws.push({
        id: `s${si}b`,
        ch: f.ch,
        x,
        y,
        fs,
        opacity: c,
        blur: 0,
        init: 1,
        z: 2,
      });
    }
  });

  type Tail = {
    id: string;
    text: string;
    edge: number;
    dir: 1 | -1;
    y: number;
    fs: number;
    w: number;
    v: number;
    max: number;
  };
  const tails: Tail[] = [];
  const runW = (txt: string, fs: number) =>
    (measure(txt) + TRACK_FULL * txt.length) * fs;
  const nowX = new Map<number, number>();
  anchors.forEach((fi, si) => {
    if (fi < 0) return;
    const u = anchorT(si);
    nowX.set(
      fi,
      shortGlyphs[si].x + (fullGlyphs[fi].x - shortGlyphs[si].x) * u,
    );
  });
  const lineOf = (i: number) => (fullGlyphs[i].y > fullTop + 1 ? 1 : 0);
  const room = (from: number, finalRight: number, now: number) => {
    for (const span of wordSpans) {
      if (span.a <= from || span.anchor < 0) continue;
      if (lineOf(span.a) !== lineOf(from)) return Number.POSITIVE_INFINITY;
      const nx = nowX.get(span.anchor) as number;
      const head = fullGlyphs[span.anchor].x - fullGlyphs[span.a].x;
      return nx - head - (fullGlyphs[span.a].x - finalRight) - now;
    }
    return Number.POSITIVE_INFINITY;
  };
  for (const span of wordSpans) {
    if (span.anchor < 0) {
      const v = EASE_OUT(clamp01((frame - EXPAND - 18) / 16));
      for (let i = span.a; i < span.b; i++) {
        const f = fullGlyphs[i];
        draws.push({
          id: `f${i}`,
          ch: f.ch,
          x: f.x,
          y: f.y + (1 - v) * 0.22 * f.fs,
          fs: f.fs,
          opacity: v,
          blur: (1 - v) * 0.06 * f.fs,
          init: 0,
          z: 1,
        });
      }
      continue;
    }
    const si = anchorOf.get(span.anchor) as number;
    const u = anchorT(si);
    const af = fullGlyphs[span.anchor];
    const sg = shortGlyphs[si];
    const ax = sg.x + (af.x - sg.x) * u;
    const ay = sg.y + (af.y - sg.y) * u;
    const afs = sg.fs + (af.fs - sg.fs) * u;
    const aw = af.w * (afs / af.fs);
    const fs = af.fs;
    const y = ay + (afs - fs) * measure.base;
    const v = EASE_OUT(clamp01((frame - EXPAND - si * 2 - 8) / 22));
    const after = joined.slice(span.anchor + 1, span.b);
    const before = joined.slice(span.a, span.anchor);
    if (after) {
      const next = fullGlyphs[span.anchor + 1];
      const gap = next.x - (af.x + af.w);
      const w = runW(after, fs);
      const edge = ax + aw + gap;
      const finalRight = next.x + w;
      tails.push({
        id: `t${span.anchor}`,
        text: after,
        edge,
        dir: 1,
        y,
        fs,
        w,
        v,
        max: room(span.anchor, finalRight, edge),
      });
    }
    if (before) {
      const first = fullGlyphs[span.a];
      tails.push({
        id: `h${span.anchor}`,
        text: before,
        edge: ax - (af.x - first.x - runW(before, fs)),
        dir: -1,
        y,
        fs,
        w: runW(before, fs),
        v,
        max: Number.POSITIVE_INFINITY,
      });
    }
  }

  const eyeT = EASE_OUT(clamp01((frame - 60) / 18));
  const subT = EASE_OUT(clamp01((frame - 66) / 20));
  const transparent = background === "transparent";
  const initImage = t.init(accent);

  const glyphStyle = (d: Draw): React.CSSProperties => ({
    position: "absolute",
    left: d.x,
    top: d.y,
    fontFamily: sora.fontFamily,
    fontWeight: 500,
    fontSize: d.fs,
    lineHeight: LINE,
    whiteSpace: "pre",
    opacity: d.opacity,
    zIndex: d.z,
    filter: d.blur > 0.05 ? `blur(${d.blur.toFixed(2)}px)` : undefined,
    ...(d.init
      ? {
          backgroundImage: initImage,
          backgroundSize: `${width}px ${height}px`,
          backgroundPosition: `${-d.x + (drift - 0.5) * width * 0.08}px ${-d.y}px`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }
      : { color: t.fg }),
  });

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? t.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: t.ground,
            transform: `scale(${1.04 + drift * 0.04})`,
          }}
        />
      ) : null}

      {eyebrow ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: stackTop + (1 - eyeT) * 10 * s,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: eyeFs * 0.6,
            fontFamily: mono.fontFamily,
            fontWeight: 500,
            fontSize: eyeFs,
            lineHeight: 1.2,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: t.muted,
            opacity: eyeT,
          }}
        >
          <span
            style={{
              width: eyeFs * 0.42,
              height: eyeFs * 0.42,
              borderRadius: 999,
              background: accent,
            }}
          />
          {eyebrow}
        </div>
      ) : null}

      {tails.map((tl) => {
        const pad = tl.fs * 0.25;
        const open = Math.max(
          0,
          Math.min(tl.w * tl.v + pad * tl.v, tl.max + pad * 0.2),
        );
        return (
          <div
            key={tl.id}
            style={{
              position: "absolute",
              left: tl.dir === 1 ? tl.edge : tl.edge - open,
              top: tl.y - pad,
              width: open,
              height: LINE * tl.fs + pad * 2,
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: pad,
                ...(tl.dir === 1 ? { left: 0 } : { right: 0 }),
                fontFamily: sora.fontFamily,
                fontWeight: 500,
                fontSize: tl.fs,
                lineHeight: LINE,
                letterSpacing: `${TRACK_FULL}em`,
                whiteSpace: "pre",
                color: t.fg,
                transform: `translateX(${(-(1 - tl.v) * tl.w * 0.45 * tl.dir).toFixed(2)}px)`,
                filter:
                  tl.v < 0.98
                    ? `blur(${((1 - tl.v) * 0.04 * tl.fs).toFixed(2)}px)`
                    : undefined,
              }}
            >
              {tl.text}
            </span>
          </div>
        );
      })}

      {draws.map((d) => (
        <div key={d.id} style={glyphStyle(d)}>
          {d.ch}
        </div>
      ))}

      {subhead ? (
        <div
          style={{
            position: "absolute",
            left: (width - Math.min(maxW, 820 * s * (portrait ? 1.1 : 1))) / 2,
            width: Math.min(maxW, 820 * s * (portrait ? 1.1 : 1)),
            top: fullTop + fullH + fsF * 0.34 + (1 - subT) * 12 * s,
            textAlign: "center",
            fontFamily: sora.fontFamily,
            fontWeight: 400,
            fontSize: subFs,
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: t.muted,
            textWrap: "balance",
            opacity: subT,
            filter: `blur(${((1 - subT) * 5 * s).toFixed(2)}px)`,
          }}
        >
          {subhead}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
