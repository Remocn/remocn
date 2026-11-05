"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const barlow = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

export interface HookUncurlProps {
  question?: string;
  answer?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    accent: "#D4FF00",
  },
  light: {
    bg: "#D4FF00",
    ink: "#000000",
    accent: "#000000",
  },
} as const;

const TRACK = 0;
const PITCH = 0.9;
const CURL_SX = 0.74;

const ENTER_LEN = 16;
const ENTER_STAGGER = 3;
const ENTER_SPREAD = 18;
const UNCURL_AT = 40;
const UNCURL_LEN = 15;
const SWAP_AT = 45;
const SWAP_STAGGER = 2;
const SWAP_SPREAD = 6;
const SINK_LEN = 6;
const ROLL_LEN = 12;
const RETRACT_AT = 63;
const RETRACT_LEN = 7;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_UNCURL = Easing.bezier(0.5, 0, 0.18, 1);
const EASE_SINK = Easing.bezier(0.5, 0, 0.75, 0);
const EASE_SNAP = Easing.bezier(0.6, 0, 0.9, 0.5);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SEGS = [
  { len: 0.18, turn: 0 },
  { len: 0.28, turn: 70 },
  { len: 1.87, turn: -255 },
];
const SEG_TOTAL = SEGS.reduce((s, g) => s + g.len, 0);
const STEPS = 120;

type Terminal = "." | "!" | "";

function words(s: string) {
  return s
    .trim()
    .replace(/[?.!…]+$/u, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
}

function terminalOf(s: string): Terminal {
  const m = s.trim().match(/([.!])$/);
  return m ? (m[1] as Terminal) : "";
}

function curl(u: number) {
  const ds = SEG_TOTAL / STEPS;
  const pts: [number, number][] = [[0, 0]];
  let x = 0;
  let y = 0;
  let phi = 0;
  let segEnd = SEGS[0].len;
  let si = 0;
  for (let i = 0; i < STEPS; i++) {
    const s = (i + 0.5) * ds;
    while (s > segEnd && si < SEGS.length - 1) {
      si++;
      segEnd += SEGS[si].len;
    }
    const g = SEGS[si];
    const k = (((g.turn * Math.PI) / 180) * (1 - u)) / g.len;
    phi += (k * ds) / 2;
    x += Math.sin(phi) * ds;
    y -= Math.cos(phi) * ds;
    phi += (k * ds) / 2;
    pts.push([x, y]);
  }
  return pts;
}

const REST = curl(0);
const REST_BOX = REST.reduce(
  (b, [x, y]) => ({
    minX: Math.min(b.minX, x),
    maxX: Math.max(b.maxX, x),
    minY: Math.min(b.minY, y),
  }),
  { minX: 0, maxX: 0, minY: 0 },
);

interface Glyph {
  adv: number;
  inkL: number;
  inkR: number;
}

interface Metrics {
  key: string;
  w: Map<string, number>;
  space: number;
  baseline: number;
  capH: number;
  asc: number;
  desc: number;
  stem: number;
  dotD: number;
  q: Glyph;
  dot: Glyph;
  bang: Glyph;
}

function useMetrics(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("hook-uncurl: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      barlow.waitUntilDone(),
      document.fonts.load(`500 100px "${barlow.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const probe = document.createElement("span");
        Object.assign(probe.style, {
          position: "absolute",
          left: "-99999px",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: `"${barlow.fontFamily}"`,
          fontWeight: "500",
          fontSize: "100px",
          lineHeight: "1",
          letterSpacing: `${TRACK}em`,
        });
        document.body.appendChild(probe);
        const w = new Map<string, number>();
        for (const s of key.split("\u0001")) {
          if (!s) continue;
          probe.textContent = s;
          w.set(s, probe.getBoundingClientRect().width / 100);
        }
        probe.textContent = "a a";
        const aa = probe.getBoundingClientRect().width;
        probe.textContent = "aa";
        const space = Math.max(
          0.18,
          (aa - probe.getBoundingClientRect().width) / 100,
        );
        probe.remove();

        const m: Metrics = {
          key,
          w,
          space,
          baseline: 0.8,
          capH: 0.7,
          asc: 0.76,
          desc: 0.22,
          stem: 0.1,
          dotD: 0.12,
          q: { adv: 0.42, inkL: 0.04, inkR: 0.38 },
          dot: { adv: 0.24, inkL: 0.06, inkR: 0.18 },
          bang: { adv: 0.24, inkL: 0.06, inkR: 0.18 },
        };
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) {
          const S = 400;
          ctx.font = `500 ${S}px "${barlow.fontFamily}"`;
          const fm = ctx.measureText("H");
          const a = fm.fontBoundingBoxAscent / S;
          const d = fm.fontBoundingBoxDescent / S;
          m.baseline = (1 - (a + d)) / 2 + a;
          m.capH = fm.actualBoundingBoxAscent / S;
          m.asc = ctx.measureText("HDLJ").actualBoundingBoxAscent / S;
          m.desc = ctx.measureText("Q,").actualBoundingBoxDescent / S;
          const l = ctx.measureText("I");
          m.stem = (l.actualBoundingBoxLeft + l.actualBoundingBoxRight) / S;
          const glyph = (ch: string): Glyph => {
            const g = ctx.measureText(ch);
            return {
              adv: g.width / S + TRACK,
              inkL: -g.actualBoundingBoxLeft / S,
              inkR: g.actualBoundingBoxRight / S,
            };
          };
          m.q = glyph("?");
          m.dot = glyph(".");
          m.bang = glyph("!");
          m.dotD = m.dot.inkR - m.dot.inkL;
        }
        setState(m);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state : null;
}

interface Placed {
  line: number;
  x: number;
}

function place(
  lines: number[][],
  list: string[],
  wOf: (s: string) => number,
  space: number,
  F: number,
  left: number,
) {
  const out: Placed[] = [];
  let anchor = { line: 0, x: left };
  lines.forEach((ids, li) => {
    const isLast = li === lines.length - 1;
    let x = left;
    ids.forEach((id, k) => {
      if (k > 0) x += space * F;
      out[id] = { line: li, x };
      x += wOf(list[id]) * F;
    });
    if (isLast) anchor = { line: li, x };
  });
  return { out, anchor, count: lines.length };
}

export function HookUncurl({
  question = "Why make the video?",
  answer = "Just make the video.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: HookUncurlProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const clipId = `huc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const A = useMemo(() => words(question), [question]);
  const B = useMemo(() => words(answer), [answer]);
  const term = terminalOf(answer);
  const m = useMetrics(useMemo(() => [...new Set([...A, ...B])], [A, B]));

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const wOf = (s: string) => m.w.get(s) ?? 0;
  const tailA = m.q.adv;
  const tailB = term === "!" ? m.bang.adv : m.dot.adv;

  const margin = portrait ? W * 0.08 : W * 0.06;
  const maxW = W * (portrait ? 0.84 : 0.62);
  const maxBlock = H - margin * 2;
  const widest = (list: string[], tail: number) =>
    Math.max(
      0.2,
      ...list.map((w, i) => wOf(w) + (i === list.length - 1 ? tail : 0)),
    );
  const nLines = Math.max(A.length, B.length, 1);
  const F = Math.min(
    maxW / Math.max(widest(A, tailA), widest(B, tailB)),
    maxBlock / ((nLines - 1) * PITCH + m.capH),
  );
  const linesA = A.map((_, i) => [i]);
  const linesB = B.map((_, i) => [i]);
  const pa = place(linesA, A, wOf, m.space, F, margin);
  const pb = place(linesB, B, wOf, m.space, F, margin);
  const baseOf = (count: number) => (line: number) =>
    H - margin - (count - 1 - line) * PITCH * F;
  const baseA = baseOf(pa.count);
  const baseB = baseOf(pb.count);

  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (
    suf < Math.min(A.length, B.length) - pre &&
    A[A.length - 1 - suf] === B[B.length - 1 - suf]
  )
    suf++;

  const glide = spring({
    frame: t - SWAP_AT - 2,
    fps,
    config: { damping: 17, stiffness: 120, mass: 0.9 },
  });
  const es = Math.min(ENTER_STAGGER, ENTER_SPREAD / Math.max(1, A.length));
  const enterAt = (i: number) => i * es - 2;
  const nOut = Math.max(1, A.length - pre - suf);
  const nIn = Math.max(1, B.length - pre - suf);
  const xs = Math.min(SWAP_STAGGER, SWAP_SPREAD / nOut);
  const ns = Math.min(SWAP_STAGGER, SWAP_SPREAD / nIn);
  const inAt = SWAP_AT + SINK_LEN - 1;
  const floor = 0.03 * F;
  const enterK = (i: number) =>
    interpolate(t, [enterAt(i), enterAt(i) + ENTER_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const clipTopOff = (m.asc + 0.08) * F;
  const clipBotOff = (Math.max(0.04, m.desc) + 0.06) * F;
  const clipH = clipTopOff + clipBotOff;
  const pad = 0.12 * F;

  type Item = {
    key: string;
    text: string;
    x: number;
    base: number;
    shift: number;
    bot: number;
    lit: boolean;
  };
  const items: Item[] = [];
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

  A.forEach((word, i) => {
    const shared = i < pre || i >= A.length - suf;
    const e = enterK(i);
    const a = pa.out[i];
    if (shared) {
      const j = i < pre ? i : B.length - (A.length - i);
      const b = pb.out[j];
      items.push({
        key: `s${i}`,
        text: word,
        x: lerp(a.x, b.x, glide),
        base: lerp(baseA(a.line), baseB(b.line), glide),
        shift: (1 - e) * clipH,
        bot: lerp(floor, clipBotOff, e * e),
        lit: false,
      });
    } else {
      const k = i - pre;
      const out = interpolate(
        t,
        [SWAP_AT + k * xs, SWAP_AT + k * xs + SINK_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_SINK },
      );
      if (out >= 1) return;
      const cut = interpolate(
        t,
        [SWAP_AT + k * xs, SWAP_AT + k * xs + 2],
        [0, 1],
        CLAMP,
      );
      items.push({
        key: `a${i}`,
        text: word,
        x: a.x,
        base: baseA(a.line),
        shift: (1 - e + out) * clipH,
        bot: lerp(lerp(floor, clipBotOff, e * e), floor, cut),
        lit: false,
      });
    }
  });
  B.forEach((word, j) => {
    if (j < pre || j >= B.length - suf) return;
    const k = j - pre;
    const b = pb.out[j];
    const inK = interpolate(
      t,
      [inAt + k * ns, inAt + k * ns + ROLL_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    if (inK <= 0) return;
    items.push({
      key: `b${j}`,
      text: word,
      x: b.x,
      base: baseB(b.line),
      shift: (1 - inK) * clipH,
      bot: lerp(floor, clipBotOff, inK * inK),
      lit: true,
    });
  });

  const qInkC = (m.q.inkL + m.q.inkR) / 2;
  const endGlyph = term === "!" ? m.bang : m.dot;
  const endInkC = (endGlyph.inkL + endGlyph.inkR) / 2;
  const dotR = (m.dotD / 2) * F;
  const gap = m.dotD * 0.62;
  const footEm = m.dotD + gap;
  const sQ = (m.capH - m.stem / 2 - footEm) / -REST_BOX.minY;
  const shapeC = ((REST_BOX.minX + REST_BOX.maxX) / 2) * sQ * CURL_SX;
  const footShift = qInkC - shapeC;

  const dotX = lerp(
    pa.anchor.x + footShift * F,
    pb.anchor.x + endInkC * F,
    glide,
  );
  const footX = dotX;
  const baseP = lerp(baseA(pa.anchor.line), baseB(pb.anchor.line), glide);

  const u = interpolate(t, [UNCURL_AT, UNCURL_AT + UNCURL_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_UNCURL,
  });
  const r = interpolate(t, [RETRACT_AT, RETRACT_AT + RETRACT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_SNAP,
  });
  const fullLen = SEG_TOTAL * sQ;
  const stacked = pa.anchor.line > 0 || pb.anchor.line > 0;
  const topLen = stacked
    ? Math.min(fullLen, m.asc + 0.02 - footEm - m.stem / 2)
    : fullLen;
  const sCurl = sQ * lerp(1, topLen / fullLen, u);
  const bangLen = m.capH - m.stem / 2 - footEm;
  const endLen = term === "!" ? bangLen : 0;
  const lenEm = lerp(topLen, endLen, r);
  const footYem = term === "!" ? -footEm : lerp(-footEm, -m.dotD / 2, r);
  const footY = baseP + footYem * F;

  let d = "";
  if (r <= 0) {
    const pts = u > 0 ? curl(u) : REST;
    d = pts
      .map(
        ([px, py], i) =>
          `${i === 0 ? "M" : "L"}${(footX + px * sCurl * CURL_SX * F).toFixed(2)} ${(footY + py * sCurl * F).toFixed(2)}`,
      )
      .join(" ");
  } else if (lenEm * F > 0.5) {
    d = `M${footX.toFixed(2)} ${footY.toFixed(2)} L${footX.toFixed(2)} ${(footY - lenEm * F).toFixed(2)}`;
  }

  const landed = r >= 1;
  const pop = landed
    ? spring({
        frame: t - RETRACT_AT - RETRACT_LEN,
        fps,
        config: { damping: 11, stiffness: 220, mass: 0.6 },
      })
    : 0;
  const popScale = 1 + Math.sin(Math.min(1, pop) * Math.PI) * 0.16;
  const dotFade = term === "" ? 1 - r : 1;
  const dotColor = interpolate(
    t,
    [RETRACT_AT + RETRACT_LEN - 2, RETRACT_AT + RETRACT_LEN + 6],
    [0, 1],
    CLAMP,
  );
  const lastE = enterK(Math.max(0, A.length - 1) + 1);
  const pShift = (1 - lastE) * clipH;
  const pClip = baseA(pa.anchor.line) + clipBotOff;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {items.map((it) => (
        <div
          key={it.key}
          style={{
            position: "absolute",
            left: it.x - pad,
            top: it.base - clipTopOff,
            width: wOf(it.text) * F + pad * 2,
            height: clipTopOff + it.bot,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: pad,
              top: clipTopOff - m.baseline * F,
              height: F,
              lineHeight: `${F}px`,
              whiteSpace: "pre",
              fontFamily: barlow.fontFamily,
              fontWeight: 500,
              fontSize: F,
              letterSpacing: `${TRACK}em`,
              color: it.lit ? spot : c.ink,
              transform: `translateY(${it.shift.toFixed(2)}px)`,
            }}
          >
            {it.text}
          </span>
        </div>
      ))}

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={W} height={pClip} />
          </clipPath>
        </defs>
        <g clipPath={lastE < 1 ? `url(#${clipId})` : undefined}>
          <g transform={`translate(0 ${pShift.toFixed(2)})`}>
            {d ? (
              <path
                d={d}
                fill="none"
                stroke={c.ink}
                strokeWidth={m.stem * F}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            <circle
              cx={dotX}
              cy={baseP - dotR}
              r={dotR * popScale}
              fill={interpolateHex(c.ink, spot, dotColor)}
              opacity={dotFade}
            />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
}

function interpolateHex(a: string, b: string, k: number) {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return k < 0.5 ? a : b;
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function hex(s: string) {
  const mm = s.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!mm) return null;
  const n = Number.parseInt(mm[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
