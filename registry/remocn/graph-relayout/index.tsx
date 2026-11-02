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
  | "square"
  | "upload";

export type NodeTint =
  | "blue"
  | "violet"
  | "cyan"
  | "green"
  | "pink"
  | "amber"
  | "coral";

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

function NodeGlyph({
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
  } else if (icon === "upload") {
    body = <path d="M12 15.5V4M7 8.5L12 4l5 4.5M5 20h14" {...common} />;
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

type Pt = { x: number; y: number };

export type GraphNodeSpec = {
  label: string;
  icons?: NodeIcon[];
  tint?: NodeTint;
  cols?: number;
  input?: string;
};

export type GraphLayout = {
  title: string;
  nodes: Record<string, [number, number]>;
  edges: [string, string][];
  note?: { node: string; text: string };
};

export type GraphRelayoutProps = {
  theme?: "dark" | "light";
  accent?: string;
  catalog?: Record<string, GraphNodeSpec>;
  layouts?: GraphLayout[];
  kicker?: string;
  cursorName?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
};

const DEFAULT_CATALOG: Record<string, GraphNodeSpec> = {
  prompt: { label: "Prompt", input: "New launch" },
  brand: { label: "Brand kit", icons: ["palette"], tint: "amber" },
  script: { label: "Script", icons: ["doc"], tint: "violet" },
  scenes: { label: "Scenes", icons: ["frame", "image"], tint: "cyan", cols: 2 },
  voice: { label: "Voice", icons: ["wave"], tint: "green" },
  music: { label: "Music", icons: ["music"], tint: "coral" },
  captions: { label: "Captions", icons: ["captions"], tint: "violet" },
  render: { label: "Render", icons: ["spark", "play"], tint: "green", cols: 2 },
  wide: { label: "16:9", icons: ["wide"], tint: "pink" },
  tall: { label: "9:16", icons: ["tall"], tint: "pink" },
  square: { label: "1:1", icons: ["square"], tint: "pink" },
  publish: { label: "Publish", icons: ["upload"], tint: "blue" },
};

const DEFAULT_LAYOUTS: GraphLayout[] = [
  {
    title: "A launch film",
    nodes: {
      prompt: [0.08, 0.5],
      script: [0.3, 0.5],
      scenes: [0.5, 0.5],
      render: [0.7, 0.5],
      wide: [0.9, 0.5],
    },
    edges: [
      ["prompt", "script"],
      ["script", "scenes"],
      ["scenes", "render"],
      ["render", "wide"],
    ],
  },
  {
    title: "Social cutdowns",
    nodes: {
      prompt: [0.08, 0.26],
      brand: [0.08, 0.74],
      script: [0.29, 0.5],
      scenes: [0.5, 0.26],
      voice: [0.5, 0.74],
      render: [0.71, 0.5],
      wide: [0.91, 0.26],
      tall: [0.91, 0.74],
    },
    edges: [
      ["prompt", "script"],
      ["brand", "script"],
      ["script", "scenes"],
      ["script", "voice"],
      ["scenes", "render"],
      ["voice", "render"],
      ["render", "wide"],
      ["render", "tall"],
    ],
  },
  {
    title: "Captions in every language",
    nodes: {
      prompt: [0.08, 0.3],
      script: [0.28, 0.3],
      scenes: [0.49, 0.3],
      captions: [0.49, 0.78],
      render: [0.7, 0.3],
      wide: [0.9, 0.3],
    },
    edges: [
      ["prompt", "script"],
      ["script", "scenes"],
      ["script", "captions"],
      ["scenes", "render"],
      ["captions", "render"],
      ["render", "wide"],
    ],
    note: { node: "captions", text: "12 languages, synced to voice" },
  },
  {
    title: "Every format at once",
    nodes: {
      prompt: [0.07, 0.5],
      scenes: [0.28, 0.16],
      voice: [0.28, 0.5],
      music: [0.28, 0.84],
      render: [0.5, 0.5],
      wide: [0.72, 0.16],
      tall: [0.72, 0.5],
      square: [0.72, 0.84],
      publish: [0.93, 0.5],
    },
    edges: [
      ["prompt", "scenes"],
      ["prompt", "voice"],
      ["prompt", "music"],
      ["scenes", "render"],
      ["voice", "render"],
      ["music", "render"],
      ["render", "wide"],
      ["render", "tall"],
      ["render", "square"],
      ["wide", "publish"],
      ["tall", "publish"],
      ["square", "publish"],
    ],
  },
];

const FIRST_HOLD = 36;
const STEP_GAPS = [34, 30, 28, 26];
const FINAL_HOLD = 58;

export function graphRelayoutTimeline(count: number) {
  const starts: number[] = [];
  let t = FIRST_HOLD;
  for (let i = 1; i < count; i++) {
    starts.push(t);
    t += STEP_GAPS[Math.min(i - 1, STEP_GAPS.length - 1)];
  }
  const last = starts.length ? starts[starts.length - 1] : 0;
  return { starts, end: last + FINAL_HOLD };
}

export const GRAPH_RELAYOUT_DURATION = graphRelayoutTimeline(
  DEFAULT_LAYOUTS.length,
).end;

function sizeOf(spec: GraphNodeSpec) {
  if (spec.input !== undefined) {
    return {
      w: 14 + spec.input.length * 0.6 * FIELD_TEXT + 12 + 30 + 9,
      h: 48,
    };
  }
  const n = Math.max(1, spec.icons?.length ?? 1);
  const c = Math.max(1, Math.min(spec.cols ?? n, n));
  const r = Math.ceil(n / c);
  return {
    w: c * TILE + (c - 1) * TILE_GAP + PAD * 2,
    h: r * TILE + (r - 1) * TILE_GAP + PAD * 2,
  };
}

function curve(p0: Pt, p3: Pt, tall: boolean, k: number) {
  if (tall) {
    const d = Math.max(30 * k, Math.abs(p3.y - p0.y) * 0.5);
    return [p0, { x: p0.x, y: p0.y + d }, { x: p3.x, y: p3.y - d }, p3];
  }
  const d = Math.max(30 * k, Math.abs(p3.x - p0.x) * 0.5);
  return [p0, { x: p0.x + d, y: p0.y }, { x: p3.x - d, y: p3.y }, p3];
}

function sampleCurve(c: Pt[], frac: number) {
  const N = 36;
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const m = 1 - t;
    pts.push({
      x:
        m * m * m * c[0].x +
        3 * m * m * t * c[1].x +
        3 * m * t * t * c[2].x +
        t * t * t * c[3].x,
      y:
        m * m * m * c[0].y +
        3 * m * m * t * c[1].y +
        3 * m * t * t * c[2].y +
        t * t * t * c[3].y,
    });
  }
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
    );
  }
  const target = cum[N] * clamp01(frac);
  if (target < 0.5) return "";
  let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i <= N; i++) {
    if (cum[i] <= target) {
      d += `L${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    } else {
      const seg = cum[i] - cum[i - 1];
      const t = seg > 0 ? (target - cum[i - 1]) / seg : 0;
      d += `L${lerp(pts[i - 1].x, pts[i].x, t).toFixed(2)} ${lerp(pts[i - 1].y, pts[i].y, t).toFixed(2)}`;
      break;
    }
  }
  return d;
}

function Cursor({
  x,
  y,
  s,
  name,
  color,
  ink,
  edge,
  u,
}: {
  x: number;
  y: number;
  s: number;
  name: string;
  color: string;
  ink: string;
  edge: string;
  u: number;
}) {
  const size = 22 * u;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${s})`,
        transformOrigin: "0 0",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ display: "block" }}
        aria-hidden
      >
        <path
          d="M3 2.5l7.2 18.2 2.6-7.6 7.7-2.7z"
          fill={ink}
          stroke={edge}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: size * 0.75,
          top: size * 0.85,
          background: color,
          color: "#ffffff",
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: 15 * u,
          lineHeight: 1,
          padding: `${4 * u}px ${7 * u}px`,
          borderRadius: 6 * u,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    </div>
  );
}

export function GraphRelayout({
  theme = "dark",
  accent,
  catalog = DEFAULT_CATALOG,
  layouts = DEFAULT_LAYOUTS,
  kicker = "Use case",
  cursorName = "Mia",
  ground,
  groundParams,
}: GraphRelayoutProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/:/g, "");
  const c = THEMES[theme];
  const tints = TINTS[theme];
  const acc = accent ?? (theme === "dark" ? tints.blue : c.accent);
  const btn = accent ?? c.accent;
  const tall = H > W * 1.1;
  const u = Math.min(W, H) / 720;
  const k = tall ? 1.42 * u : 1.34 * u;
  const labelU = tall ? 17 : LABEL;
  const { starts } = graphRelayoutTimeline(layouts.length);

  const rect = tall
    ? { x: 0.1 * W, y: 0.27 * H, w: 0.8 * W, h: 0.65 * H }
    : { x: 0.075 * W, y: 0.335 * H, w: 0.85 * W, h: 0.6 * H };
  const toPx = (p: [number, number]): Pt =>
    tall
      ? { x: rect.x + p[1] * rect.w, y: rect.y + p[0] * rect.h }
      : { x: rect.x + p[0] * rect.w, y: rect.y + p[1] * rect.h };

  const ids = Object.keys(catalog).filter((id) =>
    layouts.some((l) => l.nodes[id]),
  );
  const filled: Record<string, Pt[]> = {};
  for (const id of ids) {
    const arr: (Pt | null)[] = layouts.map((l) =>
      l.nodes[id] ? toPx(l.nodes[id]) : null,
    );
    let lastSeen: Pt | null = null;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]) lastSeen = arr[i];
      else if (lastSeen) arr[i] = lastSeen;
    }
    let nextSeen: Pt | null = null;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] && layouts[i].nodes[id]) nextSeen = arr[i];
      else if (!arr[i] && nextSeen) arr[i] = nextSeen;
    }
    filled[id] = arr.map((p) => p ?? { x: W / 2, y: H / 2 });
  }

  const dragged = starts.map((_, i) => {
    let best = "";
    let bestD = -1;
    for (const id of ids) {
      if (!layouts[i].nodes[id] || !layouts[i + 1].nodes[id]) continue;
      const a = filled[id][i];
      const b = filled[id][i + 1];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > bestD) {
        bestD = d;
        best = id;
      }
    }
    return best;
  });

  const order = (id: string) => {
    const p = layouts[0].nodes[id];
    return p ? p[0] : 0.5;
  };

  const nodeState = (id: string, f: number) => {
    const pts = filled[id];
    let x = pts[0].x;
    let y = pts[0].y;
    const firstIn = layouts[0].nodes[id] !== undefined;
    let vis = firstIn
      ? spring({
          frame: f + 5 - Math.round(order(id) * 12),
          fps,
          config: CARD,
        })
      : 0;
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const lead = dragged[i] === id ? 0 : 1 + (ids.indexOf(id) % 3);
      const p = spring({
        frame: f - s - lead,
        fps,
        config: { mass: 0.8, damping: 15, stiffness: 150 },
      });
      x += (pts[i + 1].x - pts[i].x) * p;
      y += (pts[i + 1].y - pts[i].y) * p;
      const was = layouts[i].nodes[id] !== undefined;
      const is = layouts[i + 1].nodes[id] !== undefined;
      if (was && !is) vis -= EXIT(clamp01((f - s) / 8));
      if (!was && is) vis += spring({ frame: f - s - 6, fps, config: CHIP });
    }
    return { x, y, vis: Math.max(0, vis) };
  };

  const states: Record<string, { x: number; y: number; vis: number }> = {};
  for (const id of ids) states[id] = nodeState(id, frame);

  const specs: Record<
    string,
    Omit<GraphNodeSpec, "tint"> & { w: number; h: number; tint: string }
  > = {};
  for (const id of ids) {
    const sp = catalog[id];
    const sz = sizeOf(sp);
    specs[id] = {
      ...sp,
      ...sz,
      tint: sp.input !== undefined ? acc : tints[sp.tint ?? "blue"],
    };
  }

  const edgeKeys = new Map<string, [string, string]>();
  for (const l of layouts)
    for (const e of l.edges) edgeKeys.set(`${e[0]}>${e[1]}`, e);
  const edgeDraw = (key: string, f: number) => {
    const inL = (i: number) =>
      layouts[i].edges.some((e) => `${e[0]}>${e[1]}` === key);
    let v = 0;
    if (inL(0)) {
      const [a, b] = edgeKeys.get(key) ?? ["", ""];
      const t0 = 3 + Math.round(Math.max(order(a), order(b)) * 12);
      v = MOVE(clamp01((f - t0) / 10));
    }
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const was = inL(i);
      const is = inL(i + 1);
      if (was && !is) v -= MOVE(clamp01((f - s) / 7));
      if (!was && is) v += MOVE(clamp01((f - s - 9) / 11));
    }
    return clamp01(v);
  };

  const port = (id: string, out: boolean): Pt => {
    const st = states[id];
    const sp = specs[id];
    const sc = 0.5 + 0.5 * Math.min(1, st.vis);
    if (tall)
      return { x: st.x, y: st.y + ((out ? 1 : -1) * sp.h * k * sc) / 2 };
    return { x: st.x + ((out ? 1 : -1) * sp.w * k * sc) / 2, y: st.y };
  };

  const restOf = (i: number): Pt => {
    const id = dragged[i];
    const p = filled[id][i + 1];
    const sp = specs[id];
    return { x: p.x + sp.w * k * 0.18, y: p.y + sp.h * k * 0.2 };
  };
  const grabOf = (i: number): Pt => {
    const id = dragged[i];
    const p = filled[id][i];
    const sp = specs[id];
    return { x: p.x + sp.w * k * 0.18, y: p.y + sp.h * k * 0.2 };
  };
  const cursorAt = (f: number) => {
    let pos: Pt = { x: W * 1.06, y: H * 1.08 };
    let press = 0;
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const approach = ENTER(
        clamp01((f - (s - (i === 0 ? 18 : 12))) / (i === 0 ? 16 : 11)),
      );
      const g = grabOf(i);
      pos = { x: lerp(pos.x, g.x, approach), y: lerp(pos.y, g.y, approach) };
      if (f >= s) {
        const id = dragged[i];
        const st = nodeState(id, f);
        const sp = specs[id];
        const live = { x: st.x + sp.w * k * 0.18, y: st.y + sp.h * k * 0.2 };
        const rel = clamp01((f - s - 18) / 6);
        const r = restOf(i);
        pos = { x: lerp(live.x, r.x, rel), y: lerp(live.y, r.y, rel) };
      }
      press += clamp01((f - s + 3) / 3) - clamp01((f - s - 16) / 4);
    }
    const last = starts.length - 1;
    if (last >= 0) {
      const drift = ENTER(clamp01((f - starts[last] - 24) / 30));
      pos = { x: pos.x + drift * 70 * u, y: pos.y + drift * 46 * u };
    }
    return { ...pos, press: clamp01(press) };
  };
  const cursor = cursorAt(frame);

  const push = 1 + 0.03 * clamp01(frame / (GRAPH_RELAYOUT_DURATION + 10));
  const titleSize = tall ? 0.074 * W : 0.066 * H;
  const kickSize = (tall ? 18 : 16) * u;

  return (
    <AbsoluteFill style={{ background: c.ground.background }}>
      <GshGround
        preset={ground}
        params={
          ground && !groundParams ? undefined : (groundParams ?? c.ground)
        }
        timeOffset={7}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "50% 60%",
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
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
          </defs>
          <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-dots)`} />
          {[...edgeKeys.entries()].map(([key, [a, b]], ei) => {
            const v = edgeDraw(key, frame);
            if (v <= 0.001 || !states[a] || !states[b]) return null;
            const p0 = port(a, true);
            const p3 = port(b, false);
            const d = sampleCurve(curve(p0, p3, tall, k), v);
            if (!d) return null;
            const gid = `${uid}-g${ei}`;
            return (
              <g key={key}>
                <defs>
                  <linearGradient
                    id={gid}
                    gradientUnits="userSpaceOnUse"
                    x1={p0.x}
                    y1={p0.y}
                    x2={p3.x + 0.01}
                    y2={p3.y + 0.01}
                  >
                    <stop offset="0" stopColor={specs[a].tint} />
                    <stop offset="1" stopColor={specs[b].tint} />
                  </linearGradient>
                </defs>
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#${gid})`}
                  strokeWidth={1.6 * k}
                  strokeDasharray={`${5 * k} ${5 * k}`}
                  strokeDashoffset={-frame * 0.4 * k}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {ids.map((id) => {
          const st = states[id];
          if (st.vis <= 0.005) return null;
          const sp = specs[id];
          const pw = sp.w * k;
          const ph = sp.h * k;
          const scale = 0.5 + 0.5 * st.vis;
          const isDrag = starts.some(
            (s, i) => dragged[i] === id && frame >= s - 3 && frame < s + 20,
          );
          const dragT = starts.reduce((acc, s, i) => {
            if (dragged[i] !== id) return acc;
            return Math.max(
              acc,
              spring({ frame: frame - s + 3, fps, config: CHIP }) -
                EXIT(clamp01((frame - s - 18) / 6)),
            );
          }, 0);
          const labelSize = labelU * k;
          const ins = [...edgeKeys.entries()].some(
            ([key, [, b]]) => b === id && edgeDraw(key, frame) > 0,
          );
          const outs = [...edgeKeys.entries()].some(
            ([key, [a]]) => a === id && edgeDraw(key, frame) > 0,
          );
          const portR = 3.4 * k;
          const portStyle = (x: number, y: number): React.CSSProperties => ({
            position: "absolute",
            left: x - portR,
            top: y - portR,
            width: portR * 2,
            height: portR * 2,
            borderRadius: portR,
            background: c.handle,
            border: `${1.4 * k}px solid ${sp.tint}`,
            boxSizing: "border-box",
          });
          const labelBox: React.CSSProperties = tall
            ? {
                left: -80 * k,
                width: pw + 160 * k,
                bottom: ph + 6 * k,
                justifyContent: "center",
              }
            : {
                left: -60 * k,
                width: pw + 120 * k,
                bottom: ph + 8 * k,
                justifyContent: "center",
              };
          return (
            <div
              key={id}
              style={{
                position: "absolute",
                left: st.x - pw / 2,
                top: st.y - ph / 2,
                width: pw,
                height: ph,
                opacity: clamp01(st.vis * 1.6),
                transform: `scale(${scale * (1 + 0.04 * (isDrag ? dragT : 0))})`,
                zIndex: isDrag ? 2 : 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  whiteSpace: "nowrap",
                  fontFamily: mono.fontFamily,
                  fontWeight: 400,
                  fontSize: labelSize,
                  lineHeight: 1,
                  color: sp.tint,
                  ...labelBox,
                }}
              >
                <span
                  style={
                    tall
                      ? {
                          background: c.handle,
                          padding: `${3 * k}px ${6 * k}px`,
                          borderRadius: 4 * k,
                        }
                      : undefined
                  }
                >
                  {sp.label}
                </span>
              </div>
              {sp.input !== undefined ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 10 * k,
                    background: c.field,
                    border: `${1.5 * k}px solid ${sp.tint}`,
                    boxShadow: c.shadow,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 14 * k,
                    boxSizing: "border-box",
                    fontFamily: mono.fontFamily,
                    fontWeight: 400,
                    fontSize: FIELD_TEXT * k,
                    color: c.ink,
                    whiteSpace: "pre",
                  }}
                >
                  {sp.input}
                  <div
                    style={{
                      position: "absolute",
                      right: 8 * k,
                      top: ph / 2 - 15 * k,
                      width: 30 * k,
                      height: 30 * k,
                      borderRadius: 15 * k,
                      background: btn,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={16 * k}
                      height={16 * k}
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
                    background: `linear-gradient(${alpha(sp.tint, theme === "dark" ? 0.12 : 0.09)}, ${alpha(sp.tint, theme === "dark" ? 0.12 : 0.09)}), ${c.nodeBase}`,
                    border: `${1.5 * k}px solid ${sp.tint}`,
                    boxShadow: c.shadow,
                    boxSizing: "border-box",
                    padding: (PAD - 1.5) * k,
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(1, Math.min(sp.cols ?? sp.icons?.length ?? 1, sp.icons?.length ?? 1))}, ${TILE * k}px)`,
                    gridAutoRows: TILE * k,
                    gap: TILE_GAP * k,
                  }}
                >
                  {(sp.icons ?? []).map((ic, j) => (
                    <div
                      key={`${id}-${ic}-${j}`}
                      style={{
                        width: TILE * k,
                        height: TILE * k,
                        borderRadius: 7 * k,
                        border: `${1.2 * k}px dashed ${alpha(sp.tint, 0.6)}`,
                        background: alpha(
                          sp.tint,
                          theme === "dark" ? 0.08 : 0.07,
                        ),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                      }}
                    >
                      <NodeGlyph
                        icon={ic}
                        size={21 * k}
                        color={sp.tint}
                        frame={frame}
                      />
                    </div>
                  ))}
                </div>
              )}
              {ins ? (
                <div
                  style={tall ? portStyle(pw / 2, 0) : portStyle(0, ph / 2)}
                />
              ) : null}
              {outs ? (
                <div
                  style={tall ? portStyle(pw / 2, ph) : portStyle(pw, ph / 2)}
                />
              ) : null}
              <Handles
                w={pw}
                h={ph}
                k={k}
                color={sp.tint}
                fill={c.handle}
                t={isDrag ? dragT : 0}
              />
            </div>
          );
        })}

        {layouts.map((l, li) => {
          if (!l.note || !states[l.note.node]) return null;
          const s0 = li === 0 ? 0 : starts[li - 1];
          const s1 = li < starts.length ? starts[li] : 1e9;
          const inT = ENTER(clamp01((frame - s0 - 16) / 12));
          const outT = EXIT(clamp01((frame - s1) / 7));
          const v = inT * (1 - outT);
          if (v <= 0.001) return null;
          const st = states[l.note.node];
          const sp = specs[l.note.node];
          const size = (tall ? 20 : 17) * u;
          const textW = l.note.text.length * 0.6 * size;
          const pos: React.CSSProperties = tall
            ? {
                left: Math.min(
                  Math.max(st.x - textW / 2, rect.x),
                  rect.x + rect.w - textW,
                ),
                top: st.y + (sp.h * k) / 2 + 22 * k,
              }
            : {
                left: st.x + (sp.w * k) / 2 + 22 * k,
                top: st.y - size / 2,
              };
          return (
            <div
              key={`note-${l.title}`}
              style={{
                position: "absolute",
                ...pos,
                display: "flex",
                alignItems: "center",
                gap: 10 * k,
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: size,
                lineHeight: 1,
                color: c.ink,
                whiteSpace: "nowrap",
                opacity: v,
                transform: `translate${tall ? "Y" : "X"}(${(1 - inT) * 14 * k}px)`,
              }}
            >
              {tall ? null : (
                <span
                  style={{
                    width: 26 * k * inT,
                    height: Math.max(1, 1.25 * k),
                    background: c.boardStroke,
                  }}
                />
              )}
              {l.note.text}
            </div>
          );
        })}

        <Cursor
          x={cursor.x}
          y={cursor.y}
          s={1 - 0.12 * cursor.press}
          name={cursorName}
          color={btn}
          ink={theme === "dark" ? "#ffffff" : "#16181d"}
          edge={theme === "dark" ? "#16181d" : "#ffffff"}
          u={tall ? 1.4 * u : u}
        />

        <div
          style={{
            position: "absolute",
            left: tall ? 0.08 * W : 0.075 * W,
            top: tall ? 0.075 * H : 0.1 * H,
            width: tall ? 0.84 * W : 0.85 * W,
          }}
        >
          {layouts.map((l, li) => {
            const s0 = li === 0 ? -14 : starts[li - 1];
            const s1 = li < starts.length ? starts[li] : 1e9;
            const inT = ENTER(clamp01((frame - s0 - 6) / 12));
            const outT = EXIT(clamp01((frame - s1) / 7));
            if (inT <= 0 || outT >= 1) return null;
            return (
              <div
                key={`t-${l.title}`}
                style={{ position: "absolute", left: 0, top: 0, width: "100%" }}
              >
                <div style={{ overflow: "hidden", paddingBottom: 4 * u }}>
                  <div
                    style={{
                      fontFamily: mono.fontFamily,
                      fontWeight: 400,
                      fontSize: kickSize,
                      lineHeight: 1.2,
                      color: c.muted,
                      transform: `translateY(${((1 - inT) * 1.2 - outT * 1.2) * kickSize}px)`,
                    }}
                  >
                    {`${kicker} ${String(li + 1).padStart(2, "0")} / ${String(layouts.length).padStart(2, "0")}`}
                  </div>
                </div>
                <div
                  style={{
                    overflow: "hidden",
                    marginTop: 10 * u,
                    paddingBottom: titleSize * 0.2,
                  }}
                >
                  <div
                    style={{
                      fontFamily: geist.fontFamily,
                      fontWeight: 300,
                      fontSize: titleSize,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.06,
                      color: c.ink,
                      textWrap: "balance",
                      transform: `translateY(${((1 - inT) * 1.15 - outT * 1.15) * titleSize * (tall ? 2.2 : 1)}px)`,
                      filter: `blur(${(1 - inT + outT) * 4}px)`,
                    }}
                  >
                    {l.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
