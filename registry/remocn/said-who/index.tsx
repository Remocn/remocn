"use client";

import { loadFont } from "@remotion/google-fonts/YoungSerif";
import type React from "react";
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

const serif = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface SaidWhoProps {
  quote?: string;
  highlight?: string;
  name?: string;
  details?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#101828", ink: "#BFE3FF", accent: "#F6C453" },
  light: { bg: "#CFE8FF", ink: "#101828", accent: "#A66E00" },
} as const;

const TRACK = -0.02;
const LH = 1.1;
const STEP_SCALE = 0.035;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Tok {
  text: string;
  attach: boolean;
  hot?: boolean;
}

function stripQuotes(s: string) {
  return s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
}

function quoteTokens(quote: string, highlight: string): Tok[] {
  const body = stripQuotes(quote);
  const at = highlight ? body.indexOf(highlight) : -1;
  const out: Tok[] = [];
  const words = body.split(" ").filter(Boolean);
  let cursor = 0;
  words.forEach((word, i) => {
    const s = body.indexOf(word, cursor);
    const e = s + word.length;
    cursor = e;
    const hot = at >= 0 && s < at + highlight.length && e > at;
    let text = word;
    if (i === 0) text = `“${text}`;
    if (i === words.length - 1) text = `${text}”`;
    out.push({ text, attach: false, hot });
  });
  return out;
}

function wordTokens(s: string): Tok[] {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, attach: false }));
}

function place(
  toks: Tok[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [0];
  let line = 0;
  let x = 0;
  toks.forEach((tk) => {
    const w = adv(tk.text);
    const gap = tk.attach || x === 0 ? 0 : space;
    if (!tk.attach && x > 0 && x + gap + w > maxEm) {
      line++;
      widths.push(0);
      pos.push({ x: 0, line });
      x = w;
    } else {
      pos.push({ x: x + gap, line });
      x += gap + w;
    }
    widths[line] = x;
  });
  return { pos, lines: line + 1, widths };
}

function wrap(
  toks: Tok[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const greedy = place(toks, adv, space, maxEm);
  const L = greedy.lines;
  if (L <= 1) return greedy;
  const n = toks.length;
  const ws = toks.map((tk) => adv(tk.text));
  const glued = (k: number) => toks[k].attach;
  const lineW = (i: number, j: number) => {
    let x = 0;
    for (let k = i; k < j; k++) x += (k === i || glued(k) ? 0 : space) + ws[k];
    return x;
  };
  const avg = lineW(0, n) / L;
  const INF = 1e12;
  const dp = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(INF),
  );
  const back = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  dp[0][0] = 0;
  for (let l = 1; l <= L; l++) {
    for (let j = 1; j <= n; j++) {
      if (j < n && glued(j)) continue;
      for (let i = l - 1; i < j; i++) {
        if (dp[l - 1][i] >= INF) continue;
        const lw = lineW(i, j);
        if (lw > maxEm + 1e-6) continue;
        let cost = (lw - avg) ** 2;
        if (j < n) {
          const end = toks[j - 1].text;
          if (/[.?!…]["”’]?$/.test(end)) cost -= avg * avg * 0.5;
          else if (/[,;:—–]["”’]?$/.test(end)) cost -= avg * avg * 0.15;
        }
        if (dp[l - 1][i] + cost < dp[l][j]) {
          dp[l][j] = dp[l - 1][i] + cost;
          back[l][j] = i;
        }
      }
    }
  }
  if (dp[L][n] >= INF) return greedy;
  const starts: number[] = [];
  let j = n;
  for (let l = L; l > 0; l--) {
    const i = back[l][j];
    starts.unshift(i);
    j = i;
  }
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [];
  starts.forEach((s, l) => {
    const e = l + 1 < starts.length ? starts[l + 1] : n;
    let x = 0;
    for (let k = s; k < e; k++) {
      const gap = k === s || glued(k) ? 0 : space;
      pos.push({ x: x + gap, line: l });
      x += gap + ws[k];
    }
    widths.push(x);
  });
  return { pos, lines: L, widths };
}

function useWidths(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("said-who: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      serif.waitUntilDone(),
      document.fonts.load(`400 100px "${serif.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `400 100px "${serif.fontFamily}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / 100 : s.length * 0.5;
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

export function SaidWho({
  quote = "Took me one evening.",
  highlight = "one evening",
  name = "Tobias Lind",
  details = ["backend engineer", "never edited a video before"],
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SaidWhoProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const qToks = quoteTokens(quote, highlight);
  const nameToks: Tok[] = [{ text: "—", attach: false }, ...wordTokens(name)];
  const groups: Tok[][] = [nameToks];
  for (const d of details) {
    const words = wordTokens(d);
    if (words.length === 0) continue;
    groups.push(words);
  }
  const attrToks: Tok[] = [];
  const groupOf: number[] = [];
  groups.forEach((g, k) => {
    g.forEach((tk, i) => {
      attrToks.push(tk);
      groupOf.push(k);
      const last = i === g.length - 1;
      if (last && k < groups.length - 1) {
        attrToks.push({ text: ",", attach: true });
        groupOf.push(k + 1);
      }
    });
  });
  const m = groups.length - 1;
  const stateLen = (k: number) => {
    let n = 0;
    while (n < groupOf.length && groupOf[n] <= k) n++;
    return n;
  };
  const visibleLen = (k: number) => {
    const n = stateLen(k);
    return k < m && attrToks[n - 1]?.text === "," ? n - 1 : n;
  };

  const strings = Array.from(
    new Set([
      " ",
      ...qToks.map((tk) => tk.text),
      ...attrToks.map((tk) => tk.text),
    ]),
  );
  const w = useWidths(strings);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) => (w[s] ?? 0) + TRACK * Array.from(s).length;
  const space = w[" "] ?? 0.25;

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const measure = W * (portrait ? 0.84 : 0.8);
  const maxScale = 1 + STEP_SCALE * m;

  let Fq = portrait ? W * 0.15 : H * 0.17;
  let qLay = wrap(qToks, adv, space, measure / maxScale / Fq);
  for (let k = 0; k < 60; k++) {
    if (
      qLay.lines <= (portrait ? 4 : 2) &&
      qLay.lines * LH * Fq * maxScale <= H * 0.46
    )
      break;
    Fq *= 0.96;
    qLay = wrap(qToks, adv, space, measure / maxScale / Fq);
  }

  let Fa = Math.max(16, unit * 0.058);
  const attrLay = (k: number, size: number) =>
    wrap(attrToks.slice(0, visibleLen(k)), adv, space, measure / size);
  for (let k = 0; k < 60; k++) {
    if (attrLay(m, Fa).lines <= (portrait ? 3 : 2) || Fa <= 16) break;
    Fa *= 0.96;
  }
  const aLays = Array.from({ length: m + 1 }, (_, k) => attrLay(k, Fa));

  const intro = 34;
  const tail = Math.max(36, T * 0.25);
  const gapC = m > 0 ? Math.max(20, (T - tail - intro) / m) : 1;
  const TR = Math.min(20, gapC * 0.6);
  const startOf = (k: number) => intro + gapC * k - TR;

  let cur = 0;
  for (let k = 1; k <= m; k++) if (t >= startOf(k)) cur = k;
  const lt = cur > 0 ? t - startOf(cur) : 0;
  const glide =
    cur > 0
      ? interpolate(lt, [0, TR], [0, 1], { ...CLAMP, easing: EASE_IO })
      : 1;
  const from = cur > 0 ? cur - 1 : 0;

  const qLineH = LH * Fq;
  const aLineH = LH * Fa;
  const gapQA = Fq * 0.62;
  const qH = qLay.lines * qLineH;
  const scaleOf = (k: number) => 1 + STEP_SCALE * k;
  const scale = scaleOf(from) + (scaleOf(cur) - scaleOf(from)) * glide;
  const aH = (k: number) => aLays[k].lines * aLineH;
  const attrH = aH(from) + (aH(cur) - aH(from)) * glide;
  const blockH = qH * scale + gapQA + attrH;
  const blockTop = H / 2 - blockH / 2;
  const qTop = blockTop + (qH * scale - qH) / 2;
  const aTop = blockTop + qH * scale + gapQA;

  const hotAt = m > 0 ? startOf(m) + TR * 0.7 : intro;
  const hot = interpolate(t, [hotAt, hotAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const quoteNodes = qToks.map((tk, i) => {
    const p = qLay.pos[i];
    const lineW = qLay.widths[p.line];
    const x = W / 2 + (p.x - lineW / 2) * Fq;
    const y = qTop + p.line * qLineH;
    const e = interpolate(t, [2 + i * 3, 20 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return (
      <div
        key={`q${i}`}
        style={{
          position: "absolute",
          left: x,
          top: y,
          height: qLineH,
          lineHeight: `${qLineH}px`,
          fontSize: Fq,
          whiteSpace: "pre",
          letterSpacing: `${TRACK}em`,
          color: tk.hot ? interpolateColors(hot, [0, 1], [c.ink, hi]) : c.ink,
          opacity: e,
          transform: `translateY(${((1 - e) * Fq * 0.3).toFixed(2)}px)`,
        }}
      >
        {tk.text}
      </div>
    );
  });

  const aXY = (k: number, i: number) => {
    const p = aLays[k].pos[i];
    const lineW = aLays[k].widths[p.line];
    return {
      x: W / 2 + (p.x - lineW / 2) * Fa,
      y: p.line * aLineH,
    };
  };

  const nameIn = interpolate(t, [18, 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const attrNodes: React.ReactNode[] = [];
  const nTo = visibleLen(cur);
  const nFrom = visibleLen(from);
  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < nTo; i++) {
    const tk = attrToks[i];
    const b = aXY(cur, i);
    let x = b.x;
    let y = b.y;
    let opacity = nameIn;
    let dy = (1 - nameIn) * Fa * 0.5;
    if (i < nFrom) {
      const a = aXY(from, i);
      x = a.x + (b.x - a.x) * glide;
      y = a.y + (b.y - a.y) * glide;
      placed.push({ x, y });
    } else if (tk.attach && i > 0) {
      const prev = placed[i - 1];
      x = prev.x + adv(attrToks[i - 1].text) * Fa;
      y = prev.y;
      placed.push({ x, y });
      opacity = interpolate(lt, [TR * 0.4, TR * 0.4 + 10], [0, 1], CLAMP);
      dy = 0;
    } else {
      placed.push({ x, y });
      const order = i - nFrom;
      const s = TR * 0.55 + order * 2;
      const v = interpolate(lt, [s, s + 16], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      opacity = v;
      dy = (1 - v) * Fa * 0.6;
    }
    const strong = groupOf[i] === m && m > 0 && tk.text !== ",";
    attrNodes.push(
      <div
        key={`a${i}`}
        style={{
          position: "absolute",
          left: x,
          top: y,
          height: aLineH,
          lineHeight: `${aLineH}px`,
          fontSize: Fa,
          whiteSpace: "pre",
          letterSpacing: "-0.005em",
          color: c.ink,
          opacity: opacity * (strong ? 1 : 0.7),
          transform: `translateY(${dy.toFixed(2)}px)`,
        }}
      >
        {tk.text}
      </div>,
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: serif.fontFamily,
        fontWeight: 400,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale.toFixed(4)})`,
          transformOrigin: `${W / 2}px ${(qTop + qH / 2).toFixed(2)}px`,
        }}
      >
        {quoteNodes}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: aTop }}>
        {attrNodes}
      </div>
    </AbsoluteFill>
  );
}
