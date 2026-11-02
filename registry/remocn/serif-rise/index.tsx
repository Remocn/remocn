"use client";

import { loadVariableFont } from "@remotion/google-fonts/BricolageGrotesque";
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

const gothic = loadVariableFont("normal", { subsets: ["latin"] });

export interface SerifRiseProps {
  lines?: string[];
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#16130F",
    ink: "#F2EFE8",
    accent: "#E5342A",
    rule: "rgba(242,239,232,0.2)",
    grain: 0.05,
  },
  light: {
    bg: "#F2EFE8",
    ink: "#111111",
    accent: "#E5342A",
    rule: "rgba(17,17,17,0.18)",
    grain: 0.035,
  },
} as const;

const W_START = 500;
const W_END = 380;
const WGHT = W_END;
const CTRS_MAX = 1;
const TRACK = -0.022;
const LINE = 1.02;
const HAIR = 0.03;
const REACH = 0.62;

const RISE_LEN = 18;
const RISE_GAP = 1.5;
const SWEEP_AT = 32;
const SWEEP_GAP = 2;
const SWEEP_SPAN = 44;
const SWEEP_LEN = 16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CTRS = Easing.bezier(0.33, 0, 0.2, 1);
const EASE_SERIF = Easing.bezier(0.3, 1.45, 0.5, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const fvs = (k: number) =>
  `"wght" ${(W_START + (W_END - W_START) * k).toFixed(1)}, "opsz" 96, "wdth" 100`;

type Side = "none" | "both" | "left" | "right";
interface Stem {
  cx: number;
  w: number;
  foot: Side;
  head: Side;
  top: number;
}
interface Metrics {
  adv: Record<string, [number, number]>;
  kern: Record<string, [number, number]>;
  stems: Record<string, Stem[]>;
  cap: number;
  baseline: number;
}

const RASTER = 300;

function runsAt(
  data: Uint8ClampedArray,
  W: number,
  y: number,
): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  for (let x = 0; x < W; x++) {
    const on = data[(y * W + x) * 4 + 3] > 110;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      out.push([start, x]);
      start = -1;
    }
  }
  if (start >= 0) out.push([start, W]);
  return out;
}

function findStems(
  ctx: CanvasRenderingContext2D,
  ch: string,
  xh: number,
  cap: number,
  asc: number,
): Stem[] {
  const S = RASTER;
  const pad = Math.round(S * 0.3);
  const advPx = ctx.measureText(ch).width;
  const W = Math.ceil(advPx + pad * 2);
  const H = Math.ceil(S * 1.6);
  const base = Math.round(S * 1.15);
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.font = `${WGHT} ${S}px "${gothic.fontFamily}"`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(ch, pad, base);
  const data = ctx.getImageData(0, 0, W, H).data;
  const alpha = (x: number, y: number) =>
    x < 0 || x >= W || y < 0 || y >= H ? 0 : data[(y * W + x) * 4 + 3];
  const upper = ch !== ch.toLowerCase() || /[0-9]/.test(ch);
  const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
  const y1 = base - 3;
  const y2 = base - Math.round(xh * S * 0.22);
  const y3 = base - Math.round(xh * S * 0.48);
  const r1s = runsAt(data, W, y1);
  const r3s = runsAt(data, W, y3);
  const stems: Stem[] = [];
  for (const [a, b] of runsAt(data, W, y2)) {
    const w = b - a;
    const cx = (a + b) / 2;
    if (w > S * 0.2 || w < S * 0.02) continue;
    const r3 = r3s.find(([p, q]) => near((p + q) / 2, cx, w * 0.2));
    if (!r3 || !near(r3[1] - r3[0], w, w * 0.3)) continue;
    let foot: Side = "none";
    const r1 = r1s.find(([p, q]) => p <= cx && q >= cx);
    if (r1 && alpha(Math.round(cx), base + 5) < 40) {
      const w1 = r1[1] - r1[0];
      if (near(w1, w, w * 0.3)) foot = "both";
      else if (near(r1[0], a, w * 0.25)) foot = "left";
      else if (near(r1[1], b, w * 0.25)) foot = "right";
    }
    let y = y2;
    while (y > 1 && alpha(Math.round(cx), y - 1) > 110) y--;
    const top = (base - y) / S;
    let head: Side = "none";
    const atHeight =
      near(top, xh, 0.05) || near(top, cap, 0.05) || near(top, asc, 0.06);
    if (atHeight && !"tf".includes(ch)) {
      const rt = runsAt(data, W, y + 3).find(([p, q]) => p <= cx && q >= cx);
      if (rt) {
        const wt = rt[1] - rt[0];
        if (near(wt, w, w * 0.35)) head = upper ? "both" : "left";
        else if (near(rt[0], a, w * 0.25)) head = "left";
        else if (near(rt[1], b, w * 0.25) && upper) head = "right";
      }
    }
    if (foot === "none" && head === "none") continue;
    stems.push({ cx: (cx - pad) / S, w: w / S, foot, head, top });
  }
  return stems;
}

function measure(lines: string[]): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${gothic.fontFamily}"`,
    fontStyle: "normal",
    fontSize: "100px",
    lineHeight: "1",
  });
  document.body.appendChild(probe);
  const widthOf = (s: string, ctrs: number) => {
    probe.style.fontVariationSettings = fvs(ctrs);
    probe.textContent = s;
    return probe.getBoundingClientRect().width / 100;
  };
  const adv: Metrics["adv"] = {};
  const kern: Metrics["kern"] = {};
  for (const line of lines) {
    const chars = Array.from(line);
    chars.forEach((ch, i) => {
      if (!adv[ch]) adv[ch] = [widthOf(ch, 0), widthOf(ch, CTRS_MAX)];
      const next = chars[i + 1];
      if (next) {
        const pair = ch + next;
        if (!kern[pair]) {
          kern[pair] = [0, CTRS_MAX].map((c) => {
            const k = widthOf(pair, c) - widthOf(ch, c) - widthOf(next, c);
            return Math.abs(k) < 0.002 ? 0 : k;
          }) as [number, number];
        }
      }
    });
  }
  probe.remove();

  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  const stems: Metrics["stems"] = {};
  let cap = 0.7;
  let baseline = 0.8;
  if (ctx) {
    ctx.font = `${WGHT} 100px "${gothic.fontFamily}"`;
    const fH = ctx.measureText("H");
    cap = fH.actualBoundingBoxAscent / 100;
    const xh = ctx.measureText("x").actualBoundingBoxAscent / 100;
    const asc = ctx.measureText("l").actualBoundingBoxAscent / 100;
    const fa = fH.fontBoundingBoxAscent / 100;
    const fd = fH.fontBoundingBoxDescent / 100;
    baseline = (1 - (fa + fd)) / 2 + fa;
    for (const ch of Object.keys(adv)) {
      stems[ch] = ch.trim() ? findStems(ctx, ch, xh, cap, asc) : [];
    }
  }
  return { adv, kern, stems, cap, baseline };
}

function useMetrics(lines: string[]) {
  const key = lines.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("serif-rise: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      gothic.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${gothic.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(key.split("\u0001")) });
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

function Grain({ opacity }: { opacity: number }) {
  const id = `sr${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function SerifRise({
  lines = ["From rough cut", "to final cut."],
  highlight = "final cut.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SerifRiseProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const rows = useMemo(
    () => (lines.length > 0 ? lines : ["final cut."]).map((l) => l || " "),
    [lines],
  );
  const m = useMetrics(rows);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const lineWidth = (s: string, k: number) => {
    const chars = Array.from(s);
    return chars.reduce((acc, ch, i) => {
      const a = m.adv[ch];
      const kn = i < chars.length - 1 ? m.kern[ch + chars[i + 1]] : null;
      return (
        acc +
        lerp(a[0], a[1], k) +
        (kn ? lerp(kn[0], kn[1], k) : 0) +
        (i < chars.length - 1 ? TRACK : 0)
      );
    }, 0);
  };
  const widest = Math.max(
    ...rows.map((r) => Math.max(lineWidth(r, 0), lineWidth(r, 1))),
  );

  const portrait = H > W * 1.1;
  const edge = W * (portrait ? 0.05 : 0.035);
  const F = Math.min(
    (W - edge * 2) / widest,
    (H * (portrait ? 0.5 : 0.78)) / (rows.length * LINE),
  );
  const lineH = F * LINE;
  const capPx = m.cap * F;
  const blockH = (rows.length - 1) * lineH + capPx;
  const firstBase = (H - blockH) / 2 + capPx;
  const ruleH = Math.max(1.5, F * 0.008);

  const hlRanges = rows.map((r) => {
    if (!highlight) return null;
    const at = r.indexOf(highlight);
    return at >= 0 ? [at, at + Array.from(highlight).length] : null;
  });

  const ruleNodes: React.ReactNode[] = [];
  const glyphNodes: React.ReactNode[] = [];
  const serifNodes: React.ReactNode[] = [];
  const total = rows.reduce((a, r) => a + Array.from(r).length, 0);
  const gap = Math.min(SWEEP_GAP, SWEEP_SPAN / Math.max(1, total - 1));
  let gi = 0;
  rows.forEach((row, r) => {
    const chars = Array.from(row);
    const baseY = firstBase + r * lineH;
    const ruleP = interpolate(t, [r * 4, r * 4 + 22], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    ruleNodes.push(
      <div
        key={`rule${r}`}
        style={{
          position: "absolute",
          left: 0,
          top: baseY + ruleH * 0.5,
          width: W,
          height: ruleH,
          background: c.rule,
          transformOrigin: "0% 50%",
          transform: `scaleX(${ruleP.toFixed(4)})`,
        }}
      />,
    );
    const progress = chars.map((ch, i) => {
      const idx = gi + i;
      const p = interpolate(
        t,
        [SWEEP_AT + idx * gap, SWEEP_AT + idx * gap + SWEEP_LEN],
        [0, 1],
        CLAMP,
      );
      return {
        ctrs: EASE_CTRS(p),
        serif: p <= 0.3 ? 0 : EASE_SERIF(Math.min(1, (p - 0.3) / 0.7)),
        ch,
      };
    });
    let x = 0;
    const xs = progress.map(({ ch, ctrs }, i) => {
      const gx = x;
      const a = m.adv[ch];
      const kn = i < chars.length - 1 ? m.kern[ch + chars[i + 1]] : null;
      x += lerp(a[0], a[1], ctrs) + (kn ? lerp(kn[0], kn[1], ctrs) : 0) + TRACK;
      return gx;
    });
    const left = edge;
    const hl = hlRanges[r];
    const hlFill = (i: number) => hl !== null && i >= hl[0] && i < hl[1];
    const colorFor = (i: number) => (hlFill(i) ? spot : c.ink);

    progress.forEach(({ ch, ctrs, serif }, i) => {
      const idx = gi + i;
      const gxPx = left + xs[i] * F;
      const rise = interpolate(
        t,
        [idx * RISE_GAP, idx * RISE_GAP + RISE_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const dy = (1 - rise) * F * 0.9;
      glyphNodes.push(
        <div
          key={`m${r}-${i}`}
          style={{
            position: "absolute",
            left: gxPx - F * 0.2,
            top: baseY - capPx * 1.5,
            width: m.adv[ch][0] * F + F * 0.6,
            height: capPx * 1.5 + F * 0.3,
            overflow: "hidden",
            clipPath: `inset(0 0 ${rise < 1 ? (F * 0.3 - F * 0.03).toFixed(1) : 0}px 0)`,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: F * 0.2,
              top: capPx * 1.5 - m.baseline * F,
              height: F,
              lineHeight: `${F}px`,
              whiteSpace: "pre",
              fontFamily: gothic.fontFamily,
              fontStyle: "normal",
              fontSize: F,
              fontVariationSettings: fvs(CTRS_MAX * ctrs),
              transform: `translateY(${dy.toFixed(2)}px)`,
              color: colorFor(i),
            }}
          >
            {ch}
          </span>
        </div>,
      );
      if (serif <= 0.001) return;
      const a = m.adv[ch];
      const scale = lerp(a[0], a[1], ctrs) / Math.max(1e-6, a[1]);
      const th = Math.max(1.5, HAIR * F);
      const boxL = gxPx + F * 0.006;
      const boxR = gxPx + lerp(a[0], a[1], ctrs) * F - F * 0.006;
      m.stems[ch]?.forEach((s, k) => {
        const cx = gxPx + s.cx * scale * F;
        const w = s.w * F;
        const reach = w * REACH * serif;
        const bar = (side: Side, y: number, key: string) => {
          if (side === "none") return;
          const x0 = Math.max(
            Math.min(boxL, cx - w / 2),
            side === "right" ? cx : cx - w / 2 - reach,
          );
          const x1 = Math.min(
            Math.max(boxR, cx + w / 2),
            side === "left" ? cx : cx + w / 2 + reach,
          );
          serifNodes.push(
            <div
              key={key}
              style={{
                position: "absolute",
                left: x0,
                top: y,
                width: x1 - x0,
                height: th,
                background: colorFor(i),
              }}
            />,
          );
        };
        bar(s.foot, baseY - th, `f${r}-${i}-${k}`);
        bar(s.head, baseY - s.top * F, `h${r}-${i}-${k}`);
      });
    });
    gi += chars.length;
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {ruleNodes}
      {glyphNodes}
      {serifNodes}
      {transparent ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
