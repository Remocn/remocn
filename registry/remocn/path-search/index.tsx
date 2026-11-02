"use client";

import { loadFont } from "@remotion/google-fonts/GeistMono";
import { evolvePath } from "@remotion/paths";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PathSearchWall {
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface PathSearchProps {
  cols?: number;
  rows?: number;
  start?: [number, number];
  goal?: [number, number];
  walls?: PathSearchWall[];
  startLabel?: string;
  goalLabel?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_WALLS: PathSearchWall[] = [
  { col: 4, row: 0, w: 1, h: 6 },
  { col: 8, row: 3, w: 1, h: 6 },
  { col: 12, row: 0, w: 1, h: 5 },
  { col: 9, row: 3, w: 2, h: 1 },
];

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

const MARK_AT = 10;
const FLOOD_AT = 22;
const STEP = 1.45;
const TRACE = 32;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    grid: "rgba(255,255,255,0.075)",
    frame: "rgba(255,255,255,0.16)",
    wall: "#2A2A2F",
    wallEdge: "rgba(255,255,255,0.08)",
    tint: 0.42,
    front: 0.95,
    residue: 0.2,
    grain: 0.055,
    // gradients.sh "beam" (+ limb violet): violet at the start, azure at the front.
    ramp: ["#5a2fe0", "#3d5bff", "#2f7bff", "#3aa0ff"],
    route: ["#3d5bff", "#6f8dff", "#b9cdff"],
    ground: "rgba(61,91,255,0.2)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    grid: "rgba(18,18,20,0.08)",
    frame: "rgba(18,18,20,0.18)",
    wall: "#D2CFC6",
    wallEdge: "rgba(18,18,20,0.1)",
    tint: 0.34,
    front: 0.8,
    residue: 0.36,
    grain: 0.04,
    // gradients.sh "pixel-glass" (light): blue → violet → pink.
    ramp: ["#3d6bff", "#7a3cff", "#b545e0", "#ff4fb8"],
    route: ["#3d6bff", "#7a3cff", "#ff4fb8"],
    ground: "rgba(122,60,255,0.09)",
  },
} as const;

type Cell = [number, number];

function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Sample an evenly spaced colour ramp at k ∈ [0, 1]. */
function sampleRamp(ramp: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexRgb(ramp[i]);
  const b = hexRgb(ramp[i + 1]);
  const c = a.map((v, j) => Math.round(v + (b[j] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const DIRS: Cell[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

function search(
  cols: number,
  rows: number,
  start: Cell,
  goal: Cell,
  walls: PathSearchWall[],
) {
  const blocked = new Set<number>();
  for (const w of walls) {
    for (let c = w.col; c < w.col + w.w; c++) {
      for (let r = w.row; r < w.row + w.h; r++) blocked.add(r * cols + c);
    }
  }
  const idx = (c: number, r: number) => r * cols + c;
  const distArr = new Array<number>(cols * rows).fill(-1);
  const s = idx(start[0], start[1]);
  const g = idx(goal[0], goal[1]);
  blocked.delete(s);
  blocked.delete(g);
  distArr[s] = 0;
  const queue = [s];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    if (cur === g) break;
    const c = cur % cols;
    const r = Math.floor(cur / cols);
    for (const [dc, dr] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const ni = idx(nc, nr);
      if (blocked.has(ni) || distArr[ni] >= 0) continue;
      distArr[ni] = distArr[cur] + 1;
      queue.push(ni);
    }
  }
  const dGoal = distArr[g];
  const path: Cell[] = [];
  if (dGoal > 0) {
    let c = goal[0];
    let r = goal[1];
    let dir: Cell = [0, 0];
    path.push([c, r]);
    while (distArr[idx(c, r)] > 0) {
      const here = distArr[idx(c, r)];
      const options = DIRS.filter(([dc, dr]) => {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) return false;
        return distArr[idx(nc, nr)] === here - 1;
      });
      const keep = options.find(([dc, dr]) => dc === dir[0] && dr === dir[1]);
      dir = keep ?? options[0];
      c += dir[0];
      r += dir[1];
      path.push([c, r]);
    }
  }
  return { blocked, distArr, dGoal, path };
}

function roundedPath(pts: Cell[], radius: number) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(x - px, y - py) || 1;
    const l2 = Math.hypot(nx - x, ny - y) || 1;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const ax = x - ((x - px) / l1) * r;
    const ay = y - ((y - py) / l1) * r;
    const bx = x + ((nx - x) / l2) * r;
    const by = y + ((ny - y) / l2) * r;
    d += ` L${ax.toFixed(2)} ${ay.toFixed(2)} Q${x.toFixed(2)} ${y.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0].toFixed(2)} ${last[1].toFixed(2)}`;
  return d;
}

function simplify(cells: Cell[]) {
  if (cells.length < 3) return cells;
  const out: Cell[] = [cells[0]];
  for (let i = 1; i < cells.length - 1; i++) {
    const [ax, ay] = cells[i - 1];
    const [bx, by] = cells[i];
    const [cx, cy] = cells[i + 1];
    if ((bx - ax) * (cy - by) - (by - ay) * (cx - bx) !== 0) out.push(cells[i]);
  }
  out.push(cells[cells.length - 1]);
  return out;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function PathSearch({
  cols = 17,
  rows = 9,
  start = [1, 4],
  goal = [15, 4],
  walls = DEFAULT_WALLS,
  startLabel = "Start",
  goalLabel = "Goal",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PathSearchProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];
  const routeId = `route${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const { blocked, distArr, dGoal, path } = useMemo(
    () => search(cols, rows, start, goal, walls),
    [cols, rows, start, goal, walls],
  );

  const cell = Math.min((W * 0.76) / cols, (H * 0.7) / rows);
  const gw = cell * cols;
  const gh = cell * rows;
  const x0 = (W - gw) / 2;
  const y0 = (H - gh) / 2;
  const cx = (c: number) => x0 + (c + 0.5) * cell;
  const cy = (r: number) => y0 + (r + 0.5) * cell;

  const reach = FLOOD_AT + Math.max(0, dGoal) * STEP;
  const traceAt = reach + 6;
  const fadeAt = traceAt + TRACE - 6;
  const doneAt = fadeAt + 22;

  const gridIn = interpolate(t, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const trace = interpolate(t, [traceAt, traceAt + TRACE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const goalHit = spring({
    frame: t - reach,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });
  const startHit = spring({
    frame: t - (traceAt + TRACE - 2),
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });

  const pathPts = simplify(path).map(([c, r]): Cell => [cx(c), cy(r)]);
  const pathD = roundedPath(pathPts, cell * 0.5);
  const evo = pathD ? evolvePath(trace, pathD) : null;
  const strokeW = cell * 0.24;

  const tints: React.ReactNode[] = [];
  const inset = 3 * u;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = distArr[r * cols + c];
      if (d < 0 || d > dGoal) continue;
      const at = FLOOD_AT + d * STEP;
      if (t < at) continue;
      const k = t - at;
      const rise = interpolate(k, [0, 4], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const band = Math.floor(d / 3) % 2 === 0 ? 1 : 0.78;
      const decay = interpolate(k, [3, 16], [p.front, p.tint * band], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const fade = interpolate(
        t,
        [fadeAt + d * 0.35, fadeAt + d * 0.35 + 16],
        [1, p.residue],
        CLAMP,
      );
      const o = rise * decay * fade;
      if (o <= 0.002) continue;
      const s = 0.82 + 0.18 * rise;
      const size = (cell - inset * 2) * s;
      tints.push(
        <rect
          key={`${c}-${r}`}
          x={cx(c) - size / 2}
          y={cy(r) - size / 2}
          width={size}
          height={size}
          rx={6 * u}
          fill={sampleRamp(p.ramp, d / Math.max(1, dGoal))}
          opacity={o}
        />,
      );
    }
  }

  const gridLines: React.ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    gridLines.push(
      <line
        key={`v${c}`}
        x1={x0 + c * cell}
        y1={y0}
        x2={x0 + c * cell}
        y2={y0 + gh}
        stroke={p.grid}
        strokeWidth={Math.max(1, u)}
      />,
    );
  }
  for (let r = 1; r < rows; r++) {
    gridLines.push(
      <line
        key={`h${r}`}
        x1={x0}
        y1={y0 + r * cell}
        x2={x0 + gw}
        y2={y0 + r * cell}
        stroke={p.grid}
        strokeWidth={Math.max(1, u)}
      />,
    );
  }

  const labelFor = (cellAt: Cell, text: string, at: number) => {
    const onPath = new Set(path.map(([c, r]) => r * cols + c));
    const options: Cell[] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    const free = options.find(([dc, dr]) => {
      const c = cellAt[0] + dc;
      const r = cellAt[1] + dr;
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      const i = r * cols + c;
      return !blocked.has(i) && !onPath.has(i);
    }) ?? [0, -1];
    const a = interpolate(t, [at, at + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return (
      <div
        key={text}
        style={{
          position: "absolute",
          left: cx(cellAt[0] + free[0]) - cell,
          top: cy(cellAt[1] + free[1]) - cell / 2,
          width: cell * 2,
          height: cell,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 500,
          fontSize: 14 * u,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: p.fg,
          opacity: a,
          transform: `translateY(${(1 - a) * 6 * u}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    );
  };

  const markerR = cell * 0.2;
  const startPop = spring({
    frame: t - MARK_AT,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  const goalPop = spring({
    frame: t - MARK_AT - 3,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  const push = interpolate(t, [0, doneAt + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const drift = interpolate(t, [0, 150], [0, 1], CLAMP);
  const routeX1 = cx(start[0]);
  const routeX2 = cx(goal[0]) === routeX1 ? routeX1 + 1 : cx(goal[0]);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(70% 60% at ${44 + 12 * drift}% 112%, ${p.ground} 0%, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${0.985 + 0.025 * push})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={routeId}
              gradientUnits="userSpaceOnUse"
              x1={routeX1}
              y1={0}
              x2={routeX2}
              y2={0}
            >
              {[accent, ...p.route.slice(1)].map((c, i) => (
                <stop key={c} offset={i / (p.route.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <g opacity={gridIn}>
            {gridLines}
            <rect
              x={x0}
              y={y0}
              width={gw}
              height={gh}
              rx={10 * u}
              fill="none"
              stroke={p.frame}
              strokeWidth={Math.max(1, u)}
            />
          </g>
          {tints}
          {walls.map((w, i) => {
            const at = 3 + i * 3;
            const a = interpolate(t, [at, at + 14], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const wx = x0 + w.col * cell + inset;
            const wy = y0 + w.row * cell + inset;
            const ww = w.w * cell - inset * 2;
            const wh = w.h * cell - inset * 2;
            const grow = 0.9 + 0.1 * a;
            return (
              <rect
                key={`${w.col}-${w.row}-${w.w}-${w.h}`}
                x={wx + (ww * (1 - grow)) / 2}
                y={wy + (wh * (1 - grow)) / 2}
                width={ww * grow}
                height={wh * grow}
                rx={7 * u}
                fill={p.wall}
                stroke={p.wallEdge}
                strokeWidth={Math.max(1, u)}
                opacity={a}
              />
            );
          })}
          {evo ? (
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${routeId})`}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={evo.strokeDasharray}
              strokeDashoffset={evo.strokeDashoffset}
              opacity={trace > 0 ? 1 : 0}
            />
          ) : null}
          <circle
            cx={cx(goal[0])}
            cy={cy(goal[1])}
            r={markerR * (1.2 + 1.6 * goalHit)}
            fill="none"
            stroke={p.route[p.route.length - 1]}
            strokeWidth={1.5 * u}
            opacity={t >= reach ? (1 - goalHit) * 0.8 : 0}
          />
          <circle
            cx={cx(start[0])}
            cy={cy(start[1])}
            r={
              markerR *
              (0.7 + 0.3 * startPop) *
              (1 + 0.12 * Math.sin(Math.PI * Math.min(1, startHit)))
            }
            fill={p.bg}
            stroke={p.fg}
            strokeWidth={3 * u}
            opacity={Math.min(1, startPop * 1.5)}
          />
          <circle
            cx={cx(goal[0])}
            cy={cy(goal[1])}
            r={
              markerR *
              (0.7 + 0.3 * goalPop) *
              (1 + 0.12 * Math.sin(Math.PI * Math.min(1, goalHit)))
            }
            fill={p.bg}
            stroke={p.fg}
            strokeWidth={3 * u}
            opacity={Math.min(1, goalPop * 1.5)}
          />
          <circle
            cx={cx(goal[0])}
            cy={cy(goal[1])}
            r={markerR * 0.42 * goalPop}
            fill={t >= reach ? p.route[p.route.length - 1] : p.fg}
            opacity={Math.min(1, goalPop * 1.5)}
          />
        </svg>
        {labelFor(start, startLabel, MARK_AT + 4)}
        {labelFor(goal, goalLabel, MARK_AT + 7)}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
