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

export interface ChangedMindStep {
  quote: string;
  when: string;
}

export interface ChangedMindProps {
  steps?: ChangedMindStep[];
  name?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_STEPS: ChangedMindStep[] = [
  { quote: "Another tool I won’t use.", when: "on day one" },
  { quote: "Another tool I might use.", when: "in week two" },
  { quote: "The only tool I use now.", when: "two months in" },
];

const THEMES = {
  dark: { bg: "#101828", ink: "#BFE3FF", accent: "#F6C453" },
  light: { bg: "#CFE8FF", ink: "#101828", accent: "#A66E00" },
} as const;

const TRACK = -0.02;
const LH = 1.1;
const OPEN = "“";
const CLOSE = "”";

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Tok {
  text: string;
  attach: boolean;
}

interface Placed {
  x: number;
  line: number;
}

function stripQuotes(s: string) {
  return s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
}

function tokenize(s: string): Tok[] {
  const words = stripQuotes(s).split(/\s+/).filter(Boolean);
  return words.map((word, i) => ({
    text: i === words.length - 1 ? `${word}${CLOSE}` : word,
    attach: false,
  }));
}

function coreOf(s: string) {
  return s.replace(/["“”.,!?;:…]+$/g, "").replace(/^["“”]+/, "");
}

function lcsPairs(a: string[], b: string[]): [number, number][] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

function place(
  toks: Tok[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const pos: Placed[] = [];
  const widths: number[] = [0];
  let line = 0;
  let x = 0;
  toks.forEach((tk, i) => {
    const w = adv(tk.text);
    const gap = i === 0 || tk.attach || x === 0 ? 0 : space;
    if (!tk.attach && x > 0 && x + gap + w > maxEm) {
      line++;
      x = 0;
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
  const [handle] = useState(() => delayRender("changed-mind: measuring"));
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

export function ChangedMind({
  steps = DEFAULT_STEPS,
  name = "Ines Vargas, solo founder",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ChangedMindProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = steps.length > 0 ? steps : DEFAULT_STEPS;
  const rows = list.map((s) => tokenize(s.quote));
  const strings = Array.from(
    new Set([
      " ",
      OPEN,
      `— ${name}`,
      ...list.map((s) => s.when),
      ...rows.flatMap((r) => r.map((tk) => tk.text)),
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

  const ids: string[][] = [];
  const fresh: Set<string>[] = [];
  rows.forEach((row, k) => {
    const rowIds = row.map((_, i) => `s${k}-${i}`);
    const isNew = new Set<string>();
    if (k > 0) {
      const pairs = lcsPairs(
        rows[k - 1].map((tk) => coreOf(tk.text)),
        row.map((tk) => coreOf(tk.text)),
      );
      const matched = new Set<number>();
      for (const [a, b] of pairs) {
        rowIds[b] = ids[k - 1][a];
        matched.add(b);
      }
      row.forEach((_, i) => {
        if (!matched.has(i)) isNew.add(rowIds[i]);
      });
    }
    ids.push(rowIds);
    fresh.push(isNew);
  });

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const marginX = W * (portrait ? 0.1 : 0.085);
  const marginY = H * (portrait ? 0.1 : 0.12);
  const measure = W - marginX * 2;
  const maxLines = portrait ? 4 : 3;
  const budget = H * (portrait ? 0.5 : 0.56);

  let F = portrait ? W * 0.16 : H * 0.235;
  let layouts = rows.map((r) => wrap(r, adv, space, measure / F));
  for (let k = 0; k < 60; k++) {
    const most = Math.max(...layouts.map((l) => l.lines));
    if (most <= maxLines && most * LH * F <= budget) break;
    F *= 0.96;
    layouts = rows.map((r) => wrap(r, adv, space, measure / F));
  }

  const n = rows.length;
  const intro = 18;
  const tail = Math.max(30, T * 0.22);
  const span = Math.max(1, T - tail - intro);
  const gap = n > 1 ? span / (n - 1) : span;
  const TR = Math.min(18, gap * 0.45);
  const startOf = (k: number) => intro + gap * k - TR;

  let cur = 0;
  for (let k = 1; k < n; k++) if (t >= startOf(k)) cur = k;
  const lt = cur > 0 ? t - startOf(cur) : 0;
  const inTransition = cur > 0 && lt < TR + 14;
  const from = inTransition ? cur - 1 : cur;
  const to = cur;

  const mostLines = Math.max(...layouts.map((l) => l.lines));
  const top = portrait
    ? Math.max(
        marginY,
        (H - mostLines * LH * F - F * 0.7 - unit * 0.054 * 1.3 * 3) / 2 -
          H * 0.04,
      )
    : marginY;
  const lineH = LH * F;
  const colorIn = (k: number, id: string) =>
    k > 0 && fresh[k].has(id) ? hi : c.ink;

  const nodes: React.ReactNode[] = [];
  const glyph = (
    key: string,
    text: string,
    x: number,
    y: number,
    opacity: number,
    color: string,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: lineH,
        lineHeight: `${lineH}px`,
        fontFamily: serif.fontFamily,
        fontWeight: 400,
        fontSize: F,
        letterSpacing: `${TRACK}em`,
        whiteSpace: "pre",
        color,
        opacity,
      }}
    >
      {text}
    </div>
  );

  const xy = (k: number, i: number) => {
    const p = layouts[k].pos[i];
    return { x: marginX + p.x * F, y: top + p.line * lineH };
  };

  const enterOf = (i: number) =>
    interpolate(t, [2 + i * 2, 18 + i * 2], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const lift = F * 0.3;

  const openIn = enterOf(0);
  nodes.push(
    glyph(
      "open",
      OPEN,
      marginX - adv(OPEN) * F,
      top + lift * (1 - openIn),
      openIn,
      c.ink,
    ),
  );

  if (!inTransition) {
    rows[to].forEach((tk, i) => {
      const { x, y } = xy(to, i);
      const e = to === 0 ? enterOf(i + 1) : 1;
      nodes.push(
        glyph(
          ids[to][i],
          tk.text,
          x,
          y + lift * (1 - e),
          e,
          colorIn(to, ids[to][i]),
        ),
      );
    });
  } else {
    const idxA = new Map(ids[from].map((id, i) => [id, i]));
    const idxB = new Map(ids[to].map((id, i) => [id, i]));
    const glide = interpolate(lt, [TR * 0.18, TR * 0.82], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    let outOrder = 0;
    ids[from].forEach((id, i) => {
      const a = xy(from, i);
      const j = idxB.get(id);
      if (j !== undefined) {
        const b = xy(to, j);
        const gx = a.x + (b.x - a.x) * glide;
        const gy = a.y + (b.y - a.y) * glide;
        const col = interpolateColors(
          glide,
          [0, 1],
          [colorIn(from, id), colorIn(to, id)],
        );
        const ta = rows[from][i].text;
        const tb = rows[to][j].text;
        if (ta === tb) {
          nodes.push(glyph(id, tb, gx, gy, 1, col));
        } else {
          const swap = interpolate(lt, [TR * 0.1, TR * 0.4], [0, 1], CLAMP);
          if (swap < 1) nodes.push(glyph(`${id}-a`, ta, gx, gy, 1 - swap, col));
          nodes.push(glyph(id, tb, gx, gy, swap, col));
        }
      } else {
        const u = interpolate(lt, [outOrder, outOrder + TR * 0.34], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });
        outOrder++;
        if (u < 1) {
          nodes.push(
            glyph(
              `${id}-out`,
              rows[from][i].text,
              a.x,
              a.y + lift * u,
              1 - u,
              colorIn(from, id),
            ),
          );
        }
      }
    });
    let inOrder = 0;
    ids[to].forEach((id, j) => {
      if (idxA.has(id)) return;
      const b = xy(to, j);
      const s = TR * 0.5 + inOrder * 1.5;
      const v = interpolate(lt, [s, s + TR * 0.5], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      inOrder++;
      if (v > 0) {
        nodes.push(
          glyph(
            id,
            rows[to][j].text,
            b.x,
            b.y + lift * (1 - v),
            v,
            colorIn(to, id),
          ),
        );
      }
    });
  }

  const L = Math.max(16, unit * 0.054);
  const attrIn = interpolate(t, [12, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const whenMix =
    cur > 0
      ? interpolate(lt, [TR * 0.3, TR * 0.85], [0, 1], {
          ...CLAMP,
          easing: EASE_IO,
        })
      : 1;
  const whenPrev = cur > 0 ? list[cur - 1].when : list[0].when;
  const whenNext = list[cur].when;
  const dashW = adv("— ") * L;
  const slotH = L * 1.3;
  const quoteBottom =
    top + Math.max(...layouts.map((l) => l.lines)) * lineH + F * 0.7;

  const whenLine = (text: string, dy: number, opacity: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        lineHeight: `${slotH}px`,
        whiteSpace: "pre",
        transform: `translateY(${dy.toFixed(2)}px)`,
        opacity,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
      <div
        style={{
          position: "absolute",
          left: marginX,
          width: measure,
          ...(portrait ? { top: quoteBottom } : { bottom: marginY }),
          fontFamily: serif.fontFamily,
          fontWeight: 400,
          fontSize: L,
          letterSpacing: "-0.005em",
          opacity: attrIn,
          transform: `translateY(${((1 - attrIn) * L * 0.6).toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            lineHeight: `${slotH}px`,
            paddingLeft: dashW,
            textIndent: -dashW,
            textWrap: "balance",
            color: c.ink,
            opacity: 0.72,
          }}
        >
          {`— ${name}`}
        </div>
        <div
          style={{
            position: "relative",
            marginLeft: dashW,
            height: slotH,
            width: measure - dashW,
            overflow: "hidden",
            color: hi,
          }}
        >
          {whenMix < 1
            ? whenLine(whenPrev, -slotH * whenMix, 1 - whenMix)
            : null}
          {whenMix > 0 && cur > 0
            ? whenLine(whenNext, slotH * (1 - whenMix), whenMix)
            : null}
          {cur === 0 ? whenLine(whenNext, 0, 1) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
