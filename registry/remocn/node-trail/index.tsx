"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export type NodeIcon =
  | "doc"
  | "captions"
  | "frame"
  | "image"
  | "play"
  | "spark"
  | "wave"
  | "music"
  | "palette"
  | "wide"
  | "tall"
  | "square";

export type NodeTint =
  | "blue"
  | "violet"
  | "cyan"
  | "green"
  | "pink"
  | "amber"
  | "coral";

export type NodeTrailStep = {
  label: string;
  icons: NodeIcon[];
  tint?: NodeTint;
  cols?: number;
};

export type NodeTrailProps = {
  theme?: "dark" | "light";
  accent?: string;
  prompt?: string;
  placeholder?: string;
  promptLabel?: string;
  steps?: NodeTrailStep[];
  headline?: string;
  boardName?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
};

const DEFAULT_STEPS: NodeTrailStep[] = [
  { label: "Script", icons: ["doc", "captions"], tint: "violet", cols: 1 },
  {
    label: "Scenes",
    icons: ["frame", "image", "play", "frame"],
    tint: "cyan",
    cols: 2,
  },
  { label: "Render", icons: ["spark"], tint: "green", cols: 1 },
  {
    label: "Publish",
    icons: ["wide", "tall", "square"],
    tint: "pink",
    cols: 3,
  },
];

const TINTS: Record<"dark" | "light", Record<NodeTint, string>> = {
  dark: {
    blue: "#7b95ff",
    violet: "#b39bff",
    cyan: "#62c9ff",
    green: "#5fdc8f",
    pink: "#f27ad3",
    amber: "#ffbc62",
    coral: "#ff8a6b",
  },
  light: {
    blue: "#3b5bfd",
    violet: "#7a4df0",
    cyan: "#1b86d6",
    green: "#18a058",
    pink: "#d23a9f",
    amber: "#d6801f",
    coral: "#e0553a",
  },
};

type Palette = {
  ink: string;
  muted: string;
  dot: string;
  boardFill: string;
  boardStroke: string;
  nodeBase: string;
  field: string;
  handle: string;
  shadow: string;
  accent: string;
  onAccent: string;
  ground: Partial<GradientParams>;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    ink: "#eef1fa",
    muted: "rgba(226,232,248,0.5)",
    dot: "rgba(255,255,255,0.085)",
    boardFill: "rgba(255,255,255,0.025)",
    boardStroke: "rgba(255,255,255,0.18)",
    nodeBase: "rgba(13,17,29,0.86)",
    field: "rgba(255,255,255,0.035)",
    handle: "#0b0e17",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3), 0 14px 32px rgba(0,0,0,0.35)",
    accent: "#3b5bfd",
    onAccent: "#ffffff",
    ground: {
      kind: "mist",
      colors: ["#3557f0", "#1a2a8c", "#0b1240", "#04060f"],
      background: "#03050c",
      speed: 0.5,
      loopSeconds: 18,
      scale: 0.75,
      warp: 0.35,
      blur: 0.8,
      grain: 0.1,
      seed: 9,
    },
  },
  light: {
    ink: "#16181d",
    muted: "rgba(22,24,29,0.5)",
    dot: "rgba(30,34,52,0.14)",
    boardFill: "rgba(255,255,255,0.5)",
    boardStroke: "rgba(30,34,52,0.18)",
    nodeBase: "rgba(255,255,255,0.92)",
    field: "#ffffff",
    handle: "#ffffff",
    shadow:
      "0 1px 2px rgba(30,40,80,0.06), 0 6px 18px rgba(30,40,80,0.07), 0 20px 40px rgba(30,40,80,0.05)",
    accent: "#3b5bfd",
    onAccent: "#ffffff",
    ground: {
      kind: "mist",
      colors: ["#c9d3ff", "#e6e9fb", "#f6efe4", "#9fb0f5"],
      background: "#f4f1ea",
      speed: 0.5,
      loopSeconds: 18,
      scale: 0.8,
      warp: 0.35,
      blur: 0.75,
      grain: 0.22,
      seed: 4,
    },
  },
};

const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const TILE = 40;
const TILE_GAP = 8;
const PAD = 12;
const LABEL = 15;
const FIELD_TEXT = 15;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const n = Number.parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function NodeGlyph({
  icon,
  size,
  color,
  frame = 0,
}: {
  icon: NodeIcon;
  size: number;
  color: string;
  frame?: number;
}) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let body: React.ReactNode = null;
  if (icon === "doc") {
    body = (
      <>
        <rect x={5} y={3} width={14} height={18} rx={2.5} {...common} />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" {...common} />
      </>
    );
  } else if (icon === "captions") {
    body = (
      <>
        <rect x={3} y={5} width={18} height={14} rx={3} {...common} />
        <path d="M7 11h4M13 11h4M7 15h7" {...common} />
      </>
    );
  } else if (icon === "frame") {
    body = (
      <>
        <rect x={3} y={5} width={18} height={14} rx={2.5} {...common} />
        <path d="M7.5 5v14M16.5 5v14M3 12h4.5M16.5 12H21" {...common} />
      </>
    );
  } else if (icon === "image") {
    body = (
      <>
        <rect x={3} y={4} width={18} height={16} rx={3} {...common} />
        <circle cx={9} cy={10} r={1.8} {...common} />
        <path d="M21 16l-5-5-9 9" {...common} />
      </>
    );
  } else if (icon === "play") {
    body = (
      <>
        <circle cx={12} cy={12} r={9} {...common} />
        <path d="M10 8.6l5.2 3.4-5.2 3.4z" {...common} />
      </>
    );
  } else if (icon === "spark") {
    const step = Math.floor(frame / 3) % 8;
    body = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      const o = 0.25 + 0.75 * (((i - step + 8) % 8) / 7);
      return (
        <path
          key={`r${i}`}
          d={`M${12 + Math.cos(a) * 4} ${12 + Math.sin(a) * 4}L${12 + Math.cos(a) * 8.5} ${12 + Math.sin(a) * 8.5}`}
          {...common}
          strokeOpacity={o}
        />
      );
    });
  } else if (icon === "wave") {
    body = <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3" {...common} />;
  } else if (icon === "music") {
    body = (
      <>
        <path d="M9 18V6l10-2v12" {...common} />
        <circle cx={6.5} cy={18} r={2.5} {...common} />
        <circle cx={16.5} cy={16} r={2.5} {...common} />
      </>
    );
  } else if (icon === "palette") {
    body = (
      <>
        <path
          d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"
          {...common}
        />
        <circle cx={7.5} cy={11} r={1.2} {...common} />
        <circle cx={10.5} cy={7.2} r={1.2} {...common} />
        <circle cx={15} cy={7.6} r={1.2} {...common} />
      </>
    );
  } else if (icon === "wide") {
    body = <rect x={2.5} y={7} width={19} height={10.5} rx={2} {...common} />;
  } else if (icon === "tall") {
    body = <rect x={7} y={2.5} width={10} height={19} rx={2} {...common} />;
  } else if (icon === "square") {
    body = <rect x={5} y={5} width={14} height={14} rx={2} {...common} />;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      {body}
    </svg>
  );
}

type Pt = { x: number; y: number };

type LaidNode = {
  label: string;
  tint: string;
  kind: "input" | "tiles";
  icons: NodeIcon[];
  cols: number;
  x: number;
  y: number;
  w: number;
  h: number;
  labelSide: "top" | "left" | "right";
};

type Edge = { pts: Pt[]; cum: number[]; len: number; from: Pt; to: Pt };

function tilesSize(n: number, cols: number) {
  const c = Math.max(1, Math.min(cols, n));
  const r = Math.ceil(n / c);
  return {
    w: c * TILE + (c - 1) * TILE_GAP + PAD * 2,
    h: r * TILE + (r - 1) * TILE_GAP + PAD * 2,
  };
}

function buildEdge(a: LaidNode, b: LaidNode, k: number, tall: boolean): Edge {
  let p0: Pt;
  let p3: Pt;
  let c1: Pt;
  let c2: Pt;
  if (tall) {
    p0 = { x: a.x, y: a.y + (a.h * k) / 2 };
    p3 = { x: b.x, y: b.y - (b.h * k) / 2 };
    const d = Math.max(40 * k, (p3.y - p0.y) * 0.55);
    c1 = { x: p0.x, y: p0.y + d };
    c2 = { x: p3.x, y: p3.y - d };
  } else {
    p0 = { x: a.x + (a.w * k) / 2, y: a.y };
    p3 = { x: b.x - (b.w * k) / 2, y: b.y };
    const d = Math.max(40 * k, (p3.x - p0.x) * 0.55);
    c1 = { x: p0.x + d, y: p0.y };
    c2 = { x: p3.x - d, y: p3.y };
  }
  const pts: Pt[] = [];
  const cum: number[] = [];
  const N = 48;
  let len = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const m = 1 - t;
    const p = {
      x:
        m * m * m * p0.x +
        3 * m * m * t * c1.x +
        3 * m * t * t * c2.x +
        t * t * t * p3.x,
      y:
        m * m * m * p0.y +
        3 * m * m * t * c1.y +
        3 * m * t * t * c2.y +
        t * t * t * p3.y,
    };
    if (i > 0) {
      const q = pts[i - 1];
      len += Math.hypot(p.x - q.x, p.y - q.y);
    }
    pts.push(p);
    cum.push(len);
  }
  return { pts, cum, len, from: p0, to: p3 };
}

function partialPath(e: Edge, frac: number) {
  const target = e.len * clamp01(frac);
  if (target <= 0.01) return { d: "", tip: e.from };
  let d = `M${e.pts[0].x.toFixed(2)} ${e.pts[0].y.toFixed(2)}`;
  let tip = e.pts[0];
  for (let i = 1; i < e.pts.length; i++) {
    if (e.cum[i] <= target) {
      d += `L${e.pts[i].x.toFixed(2)} ${e.pts[i].y.toFixed(2)}`;
      tip = e.pts[i];
    } else {
      const seg = e.cum[i] - e.cum[i - 1];
      const t = seg > 0 ? (target - e.cum[i - 1]) / seg : 0;
      tip = {
        x: lerp(e.pts[i - 1].x, e.pts[i].x, t),
        y: lerp(e.pts[i - 1].y, e.pts[i].y, t),
      };
      d += `L${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`;
      break;
    }
  }
  return { d, tip };
}

export function nodeTrailTimeline(stepCount: number, promptLength: number) {
  const edges: { start: number; dur: number; arrive: number }[] = [];
  let start = Math.max(30, promptLength + 9);
  let dur = 22;
  let hold = 10;
  for (let i = 0; i < stepCount; i++) {
    edges.push({ start, dur, arrive: start + dur - 3 });
    start = start + dur + hold;
    dur = Math.max(10, Math.round(dur * 0.8));
    hold = Math.max(5, Math.round(hold * 0.8));
  }
  const last = edges[edges.length - 1];
  const pull = last ? last.start + last.dur + 8 : 40;
  const pullDur = 24;
  return {
    typeStart: 3,
    press: (edges[0]?.start ?? 30) - 4,
    edges,
    pull,
    pullDur,
    board: pull + 10,
    headline: pull + 13,
    end: pull + pullDur + 42,
  };
}

const DEFAULT_PROMPT = "A launch film for v2";

export const NODE_TRAIL_DURATION = nodeTrailTimeline(
  DEFAULT_STEPS.length,
  DEFAULT_PROMPT.length,
).end;

function layoutNodes(
  W: number,
  H: number,
  promptW: number,
  promptLabel: string,
  steps: NodeTrailStep[],
  tints: Record<NodeTint, string>,
  accent: string,
) {
  const tall = H > W * 1.1;
  const u = Math.min(W, H) / 720;
  const raw: Omit<LaidNode, "x" | "y" | "labelSide">[] = [
    {
      label: promptLabel,
      tint: accent,
      kind: "input",
      icons: [],
      cols: 1,
      w: promptW,
      h: 52,
    },
    ...steps.map((s, i) => {
      const cols = s.cols ?? Math.min(2, s.icons.length);
      const sz = tilesSize(s.icons.length, cols);
      const order: NodeTint[] = ["violet", "cyan", "green", "pink", "amber"];
      return {
        label: s.label,
        tint: tints[s.tint ?? order[i % order.length]],
        kind: "tiles" as const,
        icons: s.icons,
        cols,
        w: sz.w,
        h: sz.h,
      };
    }),
  ];
  const nodes: LaidNode[] = [];
  let k: number;
  if (!tall) {
    const gap = 62;
    const total =
      raw.reduce((a, n) => a + n.w, 0) + gap * Math.max(0, raw.length - 1);
    k = Math.min(1.32 * u, (0.82 * W) / total);
    const yo = [-34, 22, -10, 28, -4, 18, -18];
    let x = W / 2 - (total * k) / 2;
    const rowY = 0;
    raw.forEach((n, i) => {
      nodes.push({
        ...n,
        x: x + (n.w * k) / 2,
        y: rowY + yo[i % yo.length] * k,
        labelSide: "top",
      });
      x += (n.w + gap) * k;
    });
  } else {
    const gap = 40;
    const total =
      raw.reduce((a, n) => a + n.h, 0) + gap * Math.max(0, raw.length - 1);
    k = Math.min(1.6 * u, (0.64 * H) / total, (0.8 * W) / raw[0].w);
    let y = -(total * k) / 2;
    raw.forEach((n, i) => {
      const s = i === 0 ? 0 : i % 2 === 1 ? -1 : 1;
      const labelW = (n.label.length * 0.6 * 17 + 16) * k;
      const room = 0.08 * W + labelW + (n.w * k) / 2;
      const x =
        s === 0
          ? W / 2
          : s < 0
            ? Math.max(W / 2 - 0.2 * W, room)
            : Math.min(W / 2 + 0.2 * W, W - room);
      nodes.push({
        ...n,
        x,
        y: y + (n.h * k) / 2,
        labelSide: i === 0 ? "top" : s < 0 ? "left" : "right",
      });
      y += (n.h + gap) * k;
    });
  }
  return { nodes, k, tall, u };
}

function Handles({
  w,
  h,
  k,
  color,
  fill,
  t,
}: {
  w: number;
  h: number;
  k: number;
  color: string;
  fill: string;
  t: number;
}) {
  if (t <= 0.001) return null;
  const s = 7 * k;
  const corners = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ];
  return (
    <>
      {corners.map(([cx, cy], i) => (
        <div
          key={`h${cx}-${cy}`}
          style={{
            position: "absolute",
            left: cx - s / 2,
            top: cy - s / 2,
            width: s,
            height: s,
            background: fill,
            border: `${1.25 * k}px solid ${color}`,
            borderRadius: 1.5 * k,
            transform: `scale(${Math.max(0, t - i * 0.04)})`,
            boxSizing: "border-box",
          }}
        />
      ))}
    </>
  );
}

function TypedLabel({
  text,
  shown,
  color,
  size,
  typing,
}: {
  text: string;
  shown: number;
  color: string;
  size: number;
  typing: boolean;
}) {
  const n = Math.max(0, Math.min(text.length, Math.floor(shown)));
  return (
    <span
      style={{
        fontFamily: mono.fontFamily,
        fontWeight: 400,
        fontSize: size,
        color,
        whiteSpace: "pre",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text.slice(0, n)}
      {typing ? (
        <span
          style={{
            display: "inline-block",
            width: size * 0.09,
            height: size * 1.05,
            marginLeft: size * 0.06,
            background: color,
          }}
        />
      ) : null}
    </span>
  );
}

export function NodeTrail({
  theme = "dark",
  accent,
  prompt = DEFAULT_PROMPT,
  placeholder = "Describe your launch",
  promptLabel = "Prompt",
  steps = DEFAULT_STEPS,
  headline = "From one prompt to every screen.",
  boardName = "launch-film.flow",
  ground,
  groundParams,
}: NodeTrailProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/:/g, "");
  const c = THEMES[theme];
  const tints = TINTS[theme];
  const acc = accent ?? (theme === "dark" ? tints.blue : c.accent);
  const btn = accent ?? c.accent;
  const T = nodeTrailTimeline(steps.length, prompt.length);

  const chars = Math.max(prompt.length, placeholder.length);
  const promptW = 14 + chars * 0.6 * FIELD_TEXT + 12 + 32 + 10;
  const laid = layoutNodes(W, H, promptW, promptLabel, steps, tints, acc);
  const { k, tall, u } = laid;
  const headSize = tall ? 0.076 * W : 0.068 * H;
  const labelU = tall ? 17 : LABEL;
  const headLines = tall ? 2 : 1;
  const top0 = Math.min(
    ...laid.nodes.map(
      (n) =>
        n.y - (n.h * k) / 2 - (n.labelSide === "top" ? (labelU + 12) * k : 0),
    ),
  );
  const bot0 = Math.max(...laid.nodes.map((n) => n.y + (n.h * k) / 2));
  const boardPad = (tall ? 56 : 52) * u;
  const boardH = Math.max(
    bot0 - top0 + boardPad * 2,
    tall ? 0.62 * H : 0.5 * H,
  );
  const headBlock = headSize * 1.08 * headLines + 62 * u;
  const groupTop = (H - (headBlock + boardH)) / 2 + (tall ? 0 : 0.01 * H);
  const margin = 0.07 * W;
  const board = {
    x: margin,
    y: groupTop + headBlock,
    w: W - margin * 2,
    h: boardH,
  };
  const dy = board.y + board.h / 2 - (top0 + bot0) / 2;
  const nodes = laid.nodes.map((n) => ({ ...n, y: n.y + dy }));
  const headTop = groupTop;
  const edges = nodes
    .slice(0, -1)
    .map((n, i) => buildEdge(n, nodes[i + 1], k, tall));

  const Z = tall ? 1.6 : 2.0;
  const cam = (f: number) => {
    const first = T.edges[0];
    const n0 = nodes[0];
    if (!first || f < first.start + 2) {
      const lim = first ? first.start + 2 : 30;
      return { x: n0.x, y: n0.y, z: Z * (1 + 0.025 * clamp01(f / lim)) };
    }
    if (f >= T.pull) {
      const ln = nodes[nodes.length - 1];
      const t = clamp01((f - T.pull) / T.pullDur);
      const e = CAM(t);
      const zEnd = 1 + 0.025 * ENTER(clamp01((f - T.pull - T.pullDur) / 48));
      return {
        x: lerp(ln.x, W / 2, e),
        y: lerp(ln.y, H / 2, e),
        z: Math.exp(lerp(Math.log(Z), Math.log(zEnd), e)),
      };
    }
    for (let i = T.edges.length - 1; i >= 0; i--) {
      const ed = T.edges[i];
      const s0 = ed.start + 2;
      if (f >= s0) {
        const t = clamp01((f - s0) / ed.dur);
        const e = MOVE(t);
        const a = nodes[i];
        const b = nodes[i + 1];
        const next = T.edges[i + 1];
        const settle = next ? next.start + 2 : T.pull;
        const push =
          t >= 1
            ? 0.02 * clamp01((f - s0 - ed.dur) / (settle - s0 - ed.dur))
            : 0;
        return {
          x: lerp(a.x, b.x, e),
          y: lerp(a.y, b.y, e),
          z: Z * (1 - 0.1 * Math.sin(Math.PI * e)) * (1 + push),
        };
      }
    }
    return { x: n0.x, y: n0.y, z: Z };
  };

  const cNow = cam(frame);
  const cPrev = cam(Math.max(0, frame - 1));
  const vx = (cNow.x - cPrev.x) * cNow.z;
  const vy = (cNow.y - cPrev.y) * cNow.z;
  const bx = Math.min(10, Math.abs(vx) * 0.07);
  const by = Math.min(10, Math.abs(vy) * 0.07);
  const blurOn = bx > 0.35 || by > 0.35;

  const nodeArrive = (i: number) => (i === 0 ? -100 : T.edges[i - 1].arrive);
  const selectedUntil = (i: number) => {
    if (i === nodes.length - 1) return T.pull;
    return T.edges[i].start + 4;
  };
  const dash = 5 * k;
  const march = -frame * 0.35 * k;

  const worldExt = { x: -W, y: -H, w: W * 3, h: H * 3 };

  const boardT = clamp01((frame - T.board) / 12);
  const boardE = ENTER(boardT);
  const headT = frame - T.headline;
  const headE = ENTER(clamp01(headT / 14));

  const typed = Math.floor(
    clamp01((frame - T.typeStart) / prompt.length) * prompt.length,
  );
  const pressS =
    frame >= T.press
      ? 1 -
        0.12 * Math.sin(Math.PI * clamp01((frame - T.press) / 6)) +
        0.05 *
          (spring({ frame: frame - T.press - 5, fps, config: CHIP }) -
            spring({ frame: frame - T.press - 9, fps, config: CHIP }))
      : 1;

  return (
    <AbsoluteFill style={{ background: c.ground.background }}>
      <GshGround
        preset={ground}
        params={
          ground && !groundParams ? undefined : (groundParams ?? c.ground)
        }
        timeOffset={4}
        timeScale={0.6}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={`${uid}-mb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur
            stdDeviation={`${(bx / cNow.z).toFixed(2)} ${(by / cNow.z).toFixed(2)}`}
          />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${cNow.z}) translate(${-cNow.x}px, ${-cNow.y}px)`,
          filter: blurOn ? `url(#${uid}-mb)` : undefined,
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <pattern
              id={`${uid}-dots`}
              width={24 * k}
              height={24 * k}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={12 * k} cy={12 * k} r={1.1 * k} fill={c.dot} />
            </pattern>
            {edges.map((e, i) => (
              <linearGradient
                key={`g${e.from.x}-${e.from.y}`}
                id={`${uid}-eg${i}`}
                gradientUnits="userSpaceOnUse"
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
              >
                <stop offset="0" stopColor={nodes[i].tint} />
                <stop offset="1" stopColor={nodes[i + 1].tint} />
              </linearGradient>
            ))}
          </defs>
          <rect
            x={worldExt.x}
            y={worldExt.y}
            width={worldExt.w}
            height={worldExt.h}
            fill={`url(#${uid}-dots)`}
          />
          {boardE > 0 ? (
            <rect
              x={board.x}
              y={board.y}
              width={board.w}
              height={board.h}
              fill={c.boardFill}
              stroke={c.boardStroke}
              strokeWidth={1.25 * u}
              opacity={boardE}
              strokeDasharray={`${(board.w + board.h) * 2 * boardE} ${(board.w + board.h) * 2}`}
            />
          ) : null}
          {edges.map((e, i) => {
            const ed = T.edges[i];
            const p = MOVE(clamp01((frame - ed.start) / ed.dur));
            const { d, tip } = partialPath(e, p);
            if (!d) return null;
            const drawing = p > 0 && p < 1;
            return (
              <g key={`e${e.from.x}-${e.from.y}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#${uid}-eg${i})`}
                  strokeWidth={1.6 * k}
                  strokeDasharray={`${dash} ${dash}`}
                  strokeDashoffset={march}
                  strokeLinecap="round"
                />
                {drawing ? (
                  <circle
                    cx={tip.x}
                    cy={tip.y}
                    r={3.6 * k}
                    fill={nodes[i + 1].tint}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {nodes.map((n, i) => {
          const arrive = nodeArrive(i);
          const local = frame - arrive;
          if (i > 0 && local < 0) return null;
          const pop = i === 0 ? 1 : spring({ frame: local, fps, config: CARD });
          const appear = i === 0 ? 1 : clamp01(local / 4);
          const scale = i === 0 ? 1 : lerp(1.14, 1, pop);
          const selOn =
            i === 0 ? 1 : spring({ frame: local, fps, config: CHIP });
          const selOff = 1 - EXIT(clamp01((frame - selectedUntil(i)) / 6));
          const sel = Math.max(0, Math.min(selOn, selOff));
          const pw = n.w * k;
          const ph = n.h * k;
          const labelShown = i === 0 ? n.label.length : (local - 2) * 1;
          const typing =
            i > 0 && labelShown >= 0 && labelShown < n.label.length + 3;
          const labelSize = labelU * k;
          const outPort = i < nodes.length - 1 && frame >= T.edges[i].start;
          const inPort = i > 0;
          const portR = 3.4 * k;
          const portStyle = (x: number, y: number): React.CSSProperties => ({
            position: "absolute",
            left: x - portR,
            top: y - portR,
            width: portR * 2,
            height: portR * 2,
            borderRadius: portR,
            background: c.handle,
            border: `${1.4 * k}px solid ${n.tint}`,
            boxSizing: "border-box",
          });
          const labelBox: React.CSSProperties =
            n.labelSide === "top"
              ? {
                  left: 0,
                  width: pw,
                  bottom: ph + 9 * k,
                  justifyContent: "center",
                }
              : n.labelSide === "left"
                ? {
                    right: pw + 14 * k,
                    top: ph / 2 - labelSize / 2,
                    justifyContent: "flex-end",
                  }
                : {
                    left: pw + 14 * k,
                    top: ph / 2 - labelSize / 2,
                    justifyContent: "flex-start",
                  };
          return (
            <div
              key={`n${n.label}-${i}`}
              style={{
                position: "absolute",
                left: n.x - pw / 2,
                top: n.y - ph / 2,
                width: pw,
                height: ph,
                opacity: appear,
                transform: `scale(${scale})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  whiteSpace: "nowrap",
                  ...labelBox,
                }}
              >
                <TypedLabel
                  text={n.label}
                  shown={labelShown}
                  color={n.tint}
                  size={labelSize}
                  typing={typing && Math.floor(frame / 4) % 2 === 0}
                />
              </div>
              {n.kind === "input" ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 10 * k,
                    background: c.field,
                    border: `${1.5 * k}px solid ${n.tint}`,
                    boxShadow: c.shadow,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 14 * k,
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      fontFamily: mono.fontFamily,
                      fontWeight: 400,
                      fontSize: FIELD_TEXT * k,
                      color: typed > 0 ? c.ink : c.muted,
                      whiteSpace: "pre",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {typed > 0 ? prompt.slice(0, typed) : placeholder}
                    {frame < T.press + 2 && Math.floor(frame / 5) % 2 === 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: 1.5 * k,
                          height: FIELD_TEXT * 1.15 * k,
                          marginLeft: 2 * k,
                          background: n.tint,
                        }}
                      />
                    ) : null}
                  </span>
                  <div
                    style={{
                      position: "absolute",
                      right: 9 * k,
                      top: ph / 2 - 16 * k,
                      width: 32 * k,
                      height: 32 * k,
                      borderRadius: 16 * k,
                      background: btn,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${pressS})`,
                      boxShadow: `0 ${2 * k}px ${8 * k}px ${alpha(btn, 0.35)}`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={17 * k}
                      height={17 * k}
                      aria-hidden
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        fill="none"
                        stroke={c.onAccent}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 6 * k,
                    background: `linear-gradient(${alpha(n.tint, theme === "dark" ? 0.12 : 0.09)}, ${alpha(n.tint, theme === "dark" ? 0.12 : 0.09)}), ${c.nodeBase}`,
                    border: `${1.5 * k}px solid ${n.tint}`,
                    boxShadow: c.shadow,
                    boxSizing: "border-box",
                    padding: (PAD - 1.5) * k,
                    display: "grid",
                    gridTemplateColumns: `repeat(${n.cols}, ${TILE * k}px)`,
                    gridAutoRows: TILE * k,
                    gap: TILE_GAP * k,
                  }}
                >
                  {n.icons.map((ic, j) => {
                    const tp = spring({
                      frame: local - 4 - j * 2,
                      fps,
                      config: CHIP,
                    });
                    return (
                      <div
                        key={`t${ic}-${j}`}
                        style={{
                          width: TILE * k,
                          height: TILE * k,
                          borderRadius: 7 * k,
                          border: `${1.2 * k}px dashed ${alpha(n.tint, 0.6)}`,
                          background: alpha(
                            n.tint,
                            theme === "dark" ? 0.08 : 0.07,
                          ),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box",
                          transform: `scale(${Math.max(0, tp)})`,
                        }}
                      >
                        <NodeGlyph
                          icon={ic}
                          size={21 * k}
                          color={n.tint}
                          frame={frame}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {inPort ? (
                <div
                  style={tall ? portStyle(pw / 2, 0) : portStyle(0, ph / 2)}
                />
              ) : null}
              {outPort ? (
                <div
                  style={tall ? portStyle(pw / 2, ph) : portStyle(pw, ph / 2)}
                />
              ) : null}
              <Handles
                w={pw}
                h={ph}
                k={k}
                color={n.tint}
                fill={c.handle}
                t={sel}
              />
            </div>
          );
        })}

        {boardE > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: board.x,
                top: board.y,
                width: board.w,
                height: board.h,
              }}
            >
              <Handles
                w={board.w}
                h={board.h}
                k={u * 1.1}
                color={c.boardStroke.replace(/[\d.]+\)$/, "0.55)")}
                fill={c.handle}
                t={spring({ frame: frame - T.board - 4, fps, config: CHIP })}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: board.x,
                top: board.y - (tall ? 34 : 30) * u,
                width: board.w,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: (tall ? 18 : 16) * u,
                lineHeight: 1,
                color: c.muted,
                opacity: boardE,
                transform: `translateY(${(1 - boardE) * 8 * u}px)`,
              }}
            >
              <span>{boardName}</span>
              <span>{`${nodes.length} nodes`}</span>
            </div>
          </>
        ) : null}

        {headT > -1 ? (
          <div
            style={{
              position: "absolute",
              left: board.x,
              top: headTop,
              width: board.w,
              overflow: "hidden",
              paddingBottom: headSize * 0.18,
            }}
          >
            <div
              style={{
                fontFamily: geist.fontFamily,
                fontWeight: 300,
                fontSize: headSize,
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                textWrap: "balance",
                color: c.ink,
                transform: `translateY(${(1 - headE) * headSize * 1.2}px)`,
                filter: `blur(${(1 - headE) * 5}px)`,
                opacity: 0.2 + 0.8 * headE,
              }}
            >
              {headline}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
