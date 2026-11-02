"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
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

const shoulders = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface EmbargoLiftProps {
  lines?: string[];
  slug?: string;
  liftedSlug?: string;
  highlight?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#26231F", ink: "#F6F0E6", accent: "#2BD96B" },
  light: { bg: "#F5F5F2", ink: "#000000", accent: "#0E9F4B" },
} as const;

const WGHT = 500;
const PX = 200;
const LEAD = 1.2;

const T_SLUG = 50;
const T_LIFT = 58;
const LIFT_STEP = 14;
const LIFT_DUR = 16;
const HOLD = 34;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_LIFT = Easing.bezier(0.7, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Seg {
  text: string;
  hidden: boolean;
  bar: number;
}

function parseLine(line: string, start: number): Seg[] {
  const out: Seg[] = [];
  let bar = start;
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  for (let r = re.exec(line); r; r = re.exec(line)) {
    if (r.index > last)
      out.push({ text: line.slice(last, r.index), hidden: false, bar: -1 });
    out.push({ text: r[1], hidden: true, bar });
    bar += 1;
    last = r.index + r[0].length;
  }
  if (last < line.length)
    out.push({ text: line.slice(last), hidden: false, bar: -1 });
  return out;
}

interface Metrics {
  w: Record<string, number>;
  asc: number;
  desc: number;
  cap: number;
  dsc: number;
}

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("embargo-lift: no 2d context");
  ctx.font = `${WGHT} ${PX}px "${shoulders.fontFamily}"`;
  const w: Record<string, number> = {};
  for (const s of texts) w[s] = ctx.measureText(s).width / PX;
  const fm = ctx.measureText("Hgp");
  const h = ctx.measureText("Hbdl");
  const g = ctx.measureText("gpy");
  return {
    w,
    asc: fm.fontBoundingBoxAscent / PX,
    desc: fm.fontBoundingBoxDescent / PX,
    cap: h.actualBoundingBoxAscent / PX,
    dsc: g.actualBoundingBoxDescent / PX,
  };
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("embargo-lift: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      shoulders.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${shoulders.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

export function EmbargoLift({
  lines = ["remocn is [free],", "[open source]", "and [out today]."],
  slug = "Embargoed until 9:00 a.m.",
  liftedSlug = "Embargo lifted, 9:00 a.m.",
  highlight,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: EmbargoLiftProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const rows: Seg[][] = [];
  let barCount = 0;
  for (const l of lines.length > 0 ? lines : ["[out today]."]) {
    const segs = parseLine(l, barCount);
    barCount += segs.filter((s) => s.hidden).length;
    rows.push(segs);
  }
  const hiBar = highlight ?? barCount - 1;

  const naturalEnd =
    T_LIFT + Math.max(0, barCount - 1) * LIFT_STEP + LIFT_DUR + HOLD;
  const pace = Math.max(1, naturalEnd / Math.max(1, durationInFrames));
  const t = frame * speed * pace;

  const texts: string[] = [];
  for (const segs of rows) {
    let prefix = "";
    for (const s of segs) {
      texts.push(prefix, s.text);
      prefix += s.text;
    }
    texts.push(prefix);
  }
  texts.push(slug, liftedSlug);
  const m = useMetrics(texts);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.07 : 0.06);
  const lineTexts = rows.map((segs) => segs.map((s) => s.text).join(""));
  const maxW = Math.max(0.1, ...lineTexts.map((l) => m.w[l]));
  const size = Math.min(
    (W - marginX * 2) / maxW,
    (H * (portrait ? 0.52 : 0.68)) / (rows.length * LEAD),
  );
  const slugSize = Math.max(H * (portrait ? 0.018 : 0.034), size * 0.13);
  const slugGap = slugSize * 1.6;
  const blockH = rows.length * LEAD * size;
  const totalH = slugSize + slugGap + blockH;
  const top = (H - totalH) / 2 + slugSize * 0.2;
  const firstBase = top + slugSize + slugGap + m.cap * size;

  const boxTop = (base: number, s: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * s;

  const textStyle = (s: number): React.CSSProperties => ({
    position: "absolute",
    height: s,
    lineHeight: `${s}px`,
    whiteSpace: "pre",
    fontFamily: shoulders.fontFamily,
    fontWeight: WGHT,
    fontSize: s,
  });

  const nodes: React.ReactNode[] = [];

  rows.forEach((segs, r) => {
    const lineW = m.w[lineTexts[r]] * size;
    const left = (W - lineW) / 2;
    const base = firstBase + r * LEAD * size;
    const p = interpolate(t, [2 + r * 4, 22 + r * 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const dy = (1 - p) * size * 0.22;
    nodes.push(
      <div
        key={`line-${r}`}
        style={{
          ...textStyle(size),
          left,
          top: boxTop(base, size),
          opacity: p,
          transform: `translateY(${dy.toFixed(2)}px)`,
          color: c.ink,
        }}
      >
        {segs.map((s, i) => (
          <span
            key={`${r}-${i}`}
            style={{ color: s.hidden && s.bar === hiBar ? hi : c.ink }}
          >
            {s.text}
          </span>
        ))}
      </div>,
    );
    let prefix = "";
    segs.forEach((s, i) => {
      const x0 = left + m.w[prefix] * size;
      prefix += s.text;
      if (!s.hidden) return;
      const tw = m.w[s.text] * size;
      const padX = size * 0.012;
      const barTop = base - (m.cap + 0.05) * size;
      const barBottom =
        base + (Math.min(Math.max(m.dsc, 0.1), 0.24) + 0.02) * size;
      const startAt = T_LIFT + s.bar * LIFT_STEP;
      const g = interpolate(t, [startAt, startAt + LIFT_DUR], [1, 0], {
        ...CLAMP,
        easing: EASE_LIFT,
      });
      if (g <= 0) return;
      nodes.push(
        <div
          key={`bar-${r}-${i}`}
          style={{
            position: "absolute",
            left: x0 - padX,
            top: barTop,
            width: tw + padX * 2,
            height: barBottom - barTop,
            background: c.ink,
            opacity: p,
            transform: `translateY(${dy.toFixed(2)}px) scaleX(${g.toFixed(4)})`,
            transformOrigin: "100% 50%",
          }}
        />,
      );
    });
  });

  const slugBase = top + m.cap * slugSize;
  const slugIn = interpolate(t, [10, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const flip = interpolate(t, [T_SLUG, T_SLUG + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_LIFT,
  });
  const slugClipTop = slugBase - (m.cap + 0.2) * slugSize;
  const slugClipH = (m.cap + 0.2 + 0.3) * slugSize;
  const slugLine = (text: string, y: number, o: number, key: string) => (
    <div
      key={key}
      style={{
        ...textStyle(slugSize),
        left: (W - m.w[text] * slugSize) / 2,
        top: boxTop(slugBase, slugSize) - slugClipTop,
        color: c.ink,
        opacity: o,
        transform: `translateY(${y.toFixed(2)}px)`,
      }}
    >
      {text}
    </div>
  );
  const travel = slugClipH;
  nodes.push(
    <div
      key="slug"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: slugClipTop,
        height: slugClipH,
        overflow: "hidden",
        opacity: slugIn,
      }}
    >
      {flip < 1
        ? slugLine(slug, -flip * travel, 0.6 * (1 - flip * 0.5), "old")
        : null}
      {flip > 0
        ? slugLine(liftedSlug, (1 - flip) * travel, 0.6 + 0.4 * flip, "new")
        : null}
    </div>,
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
