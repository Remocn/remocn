"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength, getSubpaths } from "@remotion/paths";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface QuadtreeMarkProps {
  /** SVG path(s) of the mark to subdivide. Defaults to the remocn "R". */
  logo?: string | string[];
  /** Text set after the mark. Defaults to "emocn", so the lockup reads "Remocn". */
  name?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const DEFAULT_MARK = [REMOCN_R_PATH];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SNAP = Easing.bezier(0.3, 1.45, 0.5, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam" palette; the third stop follows `accent`.
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"];

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    cell: "#26262B",
    hair: "rgba(255,255,255,0.12)",
    glow: "rgba(61,91,255,0.13)",
    stops: [
      [0, BEAM[0]],
      [0.34, BEAM[1]],
      [0.72, "accent"],
      [1, "#2a2f9e"],
    ],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    cell: "#DCDAD4",
    hair: "rgba(18,18,20,0.14)",
    glow: "rgba(255,255,255,0.8)",
    stops: [
      [0, BEAM[1]],
      [0.42, "accent"],
      [1, BEAM[3]],
    ],
    grain: 0.045,
  },
} as const;

const DEPTH = 6;
const APPEAR = 10;
const SPLIT_STEPS = [14, 9, 7, 6, 5, 5];
const OPEN = 6;
const RESOLVE = 7;
const PAN_AT = 64;
const PAN_DUR = 30;
const WORD_AT = 74;
const MERGE_AT = 82;
const MERGE_DUR = 16;
const TRACKING = -0.025;

// Manrope 600 advance widths (per 1000 em), lowercase. Measured with HarfBuzz.
const ADVANCE: Record<string, number> = {
  a: 570,
  b: 608,
  c: 568,
  d: 608,
  e: 596,
  f: 370,
  g: 608,
  h: 615,
  i: 264,
  j: 276,
  k: 524,
  l: 264,
  m: 882,
  n: 615,
  o: 610,
  p: 608,
  q: 608,
  r: 386,
  s: 536,
  t: 422,
  u: 615,
  v: 538,
  w: 790,
  x: 545,
  y: 548,
  z: 532,
  " ": 200,
};

function advanceOf(ch: string) {
  const lower = ch.toLowerCase();
  const base = ADVANCE[lower] ?? 610;
  return (ch === lower ? base : base * 1.14) / 1000;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type Poly = [number, number][];

function insideEvenOdd(px: number, py: number, polys: Poly[]) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function flattenLogo(paths: string[]) {
  const parts = paths.map((d) => {
    const polys: Poly[] = [];
    for (const sub of getSubpaths(d)) {
      const len = getLength(sub);
      if (len <= 0) continue;
      const n = Math.max(24, Math.min(600, Math.ceil(len * 4)));
      const poly: Poly = [];
      for (let i = 0; i <= n; i++) {
        const p = getPointAtLength(sub, (len * i) / n);
        if (p) poly.push([p.x, p.y]);
      }
      polys.push(poly);
    }
    return polys;
  });
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const polys of parts) {
    for (const poly of polys) {
      for (const [x, y] of poly) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { parts, minX, minY, w: maxX - minX || 1, h: maxY - minY || 1 };
}

interface QNode {
  c: number;
  r: number;
  size: number;
  depth: number;
  state: 0 | 1 | 2;
  birth: number;
  split: number;
  resolve: number;
  quad: number;
  kids: QNode[];
}

function buildTree(filled: Uint8Array, n: number) {
  const sum = new Int32Array((n + 1) * (n + 1));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      sum[(r + 1) * (n + 1) + c + 1] =
        filled[r * n + c] +
        sum[r * (n + 1) + c + 1] +
        sum[(r + 1) * (n + 1) + c] -
        sum[r * (n + 1) + c];
    }
  }
  const count = (c: number, r: number, s: number) =>
    sum[(r + s) * (n + 1) + c + s] -
    sum[r * (n + 1) + c + s] -
    sum[(r + s) * (n + 1) + c] +
    sum[r * (n + 1) + c];

  const levelAt: number[] = [APPEAR];
  for (const step of SPLIT_STEPS)
    levelAt.push(levelAt[levelAt.length - 1] + step);

  let seq = 0;
  const make = (
    c: number,
    r: number,
    size: number,
    depth: number,
    birth: number,
    quad: number,
  ): QNode => {
    seq += 1;
    const k = count(c, r, size);
    const state: 0 | 1 | 2 = k === 0 ? 0 : k === size * size ? 1 : 2;
    const j = hash(c * 7.13 + r * 3.71 + depth * 19.3);
    const node: QNode = {
      c,
      r,
      size,
      depth,
      state,
      birth,
      split: Number.POSITIVE_INFINITY,
      resolve: birth + 2 + j * 3,
      quad,
      kids: [],
    };
    if (state === 2 && size > 1) {
      node.split = Math.max(levelAt[depth] + j * 3, birth + OPEN);
      const h = size / 2;
      node.kids = [
        make(c, r, h, depth + 1, node.split, 0),
        make(c + h, r, h, depth + 1, node.split, 1),
        make(c, r + h, h, depth + 1, node.split, 2),
        make(c + h, r + h, h, depth + 1, node.split, 3),
      ];
    }
    return node;
  };
  const root = make(0, 0, n, 0, 0, -1);
  return { root, count: seq };
}

export function QuadtreeMark({
  logo,
  name = "emocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: QuadtreeMarkProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];
  const isR = !logo;

  const paths = useMemo(
    () => (logo ? (Array.isArray(logo) ? logo : [logo]) : DEFAULT_MARK),
    [logo],
  );
  const shape = useMemo(() => flattenLogo(paths), [paths]);
  const N = 2 ** DEPTH;

  const tree = useMemo(() => {
    const side = Math.max(shape.w, shape.h);
    const x0 = shape.minX - (side - shape.w) / 2;
    const y0 = shape.minY - (side - shape.h) / 2;
    const filled = new Uint8Array(N * N);
    const S = 3;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let hits = 0;
        for (let i = 0; i < S; i++) {
          for (let j = 0; j < S; j++) {
            const lx = x0 + ((c + (i + 0.5) / S) / N) * side;
            const ly = y0 + ((r + (j + 0.5) / S) / N) * side;
            if (shape.parts.some((polys) => insideEvenOdd(lx, ly, polys)))
              hits++;
          }
        }
        filled[r * N + c] = hits * 2 > S * S ? 1 : 0;
      }
    }
    return { ...buildTree(filled, N), side };
  }, [shape, N]);

  const markH = H * 0.46;
  const pxPerUnit = markH / shape.h;
  const rootPx = tree.side * pxPerUnit;
  const leaf = rootPx / N;
  const markW = shape.w * pxPerUnit;
  const ox = W / 2 - rootPx / 2;
  const oy = H / 2 - rootPx / 2;
  const markLeft = W / 2 - markW / 2;
  const markTop = H / 2 - markH / 2;
  const baseline = markTop + markH;

  // remocn.dev lockup: the R is 0.76em tall and stands on the text baseline.
  const fontSize = isR ? markH / 0.76 : markH * 0.62;
  const letters = name.split("");
  const offsets: number[] = [];
  let run = 0;
  for (const ch of letters) {
    offsets.push(run * fontSize);
    run += advanceOf(ch) + TRACKING;
  }
  const wordW = letters.length ? (run - TRACKING) * fontSize : 0;
  const wordGap = name ? (isR ? 0.04 * fontSize : markH * 0.26) : 0;
  const groupW = markW + wordGap + wordW;
  const fit = name ? Math.min(1, (W * 0.74) / groupW) : 1;

  const panE = EASE_IO(
    interpolate(t, [PAN_AT, PAN_AT + PAN_DUR], [0, 1], CLAMP),
  );
  const focusX = W / 2 + (markLeft + groupW / 2 - W / 2) * panE;
  const sc = 1 + (fit - 1) * panE;
  const appear = EASE_OUT(interpolate(t, [0, APPEAR + 4], [0, 1], CLAMP));
  const cam = (1 - appear) * 0.05 + 1;

  const merge = EASE_IO(
    interpolate(t, [MERGE_AT, MERGE_AT + MERGE_DUR], [0, 1], CLAMP),
  );
  const gapStart = Math.max(1.4 * u, leaf * 0.26);
  const hairline = (1.1 * u) / fit;
  const gap = gapStart + (hairline - gapStart) * merge;

  const drift = interpolate(t, [0, 130], [0, 1], CLAMP);
  const angle = ((58 + 10 * drift) * Math.PI) / 180;
  const gx = markLeft + markW / 2;
  const gy = markTop + markH / 2;
  const gLen = Math.max(markW, markH) * 0.62;
  const gradId = `${uid}-beam`;
  const clipId = `${uid}-r`;
  const markTransform = `translate(${markLeft - shape.minX * pxPerUnit} ${markTop - shape.minY * pxPerUnit}) scale(${pxPerUnit})`;

  const rects: React.ReactNode[] = [];
  const finalRect = (n: QNode) => {
    const x = ox + n.c * leaf;
    const y = oy + n.r * leaf;
    const s = n.size * leaf;
    return { x: x + gap / 2, y: y + gap / 2, s: s - gap };
  };

  const visit = (n: QNode, parent: QNode | null) => {
    if (t < n.birth) return;
    if (n.kids.length && t >= n.split) {
      for (const k of n.kids) visit(k, n);
      return;
    }
    const fin = finalRect(n);
    let { x, y, s } = fin;
    if (parent) {
      const pr = finalRect(parent);
      const half = pr.s / 2;
      const qx = pr.x + (n.quad % 2) * half;
      const qy = pr.y + Math.floor(n.quad / 2) * half;
      const p = SNAP(interpolate(t - n.birth, [0, OPEN], [0, 1], CLAMP));
      const left = qx + (fin.x - qx) * p;
      const right = qx + half + (fin.x + fin.s - qx - half) * p;
      const top = qy + (fin.y - qy) * p;
      x = left;
      y = top;
      s = right - left;
    }
    const key = `${n.depth}-${n.c}-${n.r}`;
    const k = EASE_OUT(interpolate(t - n.resolve, [0, RESOLVE], [0, 1], CLAMP));
    if (n.state === 0) {
      if (k >= 1) return;
      const ss = s * (1 - 0.18 * k);
      rects.push(
        <rect
          key={key}
          x={x + (s - ss) / 2}
          y={y + (s - ss) / 2}
          width={ss}
          height={ss}
          fill={pal.cell}
          opacity={1 - k}
        />,
      );
      return;
    }
    if (n.state === 1) {
      rects.push(
        <g key={key}>
          {k < 1 ? (
            <rect x={x} y={y} width={s} height={s} fill={pal.cell} />
          ) : null}
          <rect
            x={x}
            y={y}
            width={s}
            height={s}
            fill={`url(#${gradId})`}
            opacity={k}
          />
        </g>,
      );
      return;
    }
    rects.push(
      <rect key={key} x={x} y={y} width={s} height={s} fill={pal.cell} />,
    );
  };
  visit(tree.root, null);

  let lattice = "";
  if (merge > 0) {
    const walk = (n: QNode) => {
      if (n.kids.length) {
        for (const k of n.kids) walk(k);
        return;
      }
      const x = ox + n.c * leaf;
      const y = oy + n.r * leaf;
      const s = n.size * leaf;
      lattice += `M${x.toFixed(2)} ${y.toFixed(2)}h${s.toFixed(2)}v${s.toFixed(2)}h${(-s).toFixed(2)}Z`;
    };
    walk(tree.root);
  }

  const frameIn = interpolate(t, [0, 8], [0, 1], CLAMP);
  const frameOut = interpolate(t, [44, 62], [1, 0], CLAMP);
  const guide = frameIn * frameOut;
  const tick = 10 * u;
  const corners = [
    [ox - 8 * u, oy - 8 * u, 1, 1],
    [ox + rootPx + 8 * u, oy - 8 * u, -1, 1],
    [ox - 8 * u, oy + rootPx + 8 * u, 1, -1],
    [ox + rootPx + 8 * u, oy + rootPx + 8 * u, -1, -1],
  ];

  const glowK = interpolate(t, [24, 80], [0, 1], { ...CLAMP, easing: EASE_IO });
  const wordLeft = markLeft + markW + wordGap;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${sc * cam}) translate(${-focusX}px, ${-H / 2}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: markLeft + markW / 2 - markH * 1.3,
            top: H / 2 - markH * 1.1,
            width: markH * 2.6,
            height: markH * 2.2,
            opacity: glowK,
            background: `radial-gradient(closest-side, ${pal.glow}, transparent)`,
          }}
        />
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={gx - Math.cos(angle) * gLen}
              y1={gy - Math.sin(angle) * gLen}
              x2={gx + Math.cos(angle) * gLen}
              y2={gy + Math.sin(angle) * gLen}
            >
              {pal.stops.map(([o, c]) => (
                <stop
                  key={o}
                  offset={o}
                  stopColor={c === "accent" ? accent : c}
                />
              ))}
            </linearGradient>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              {paths.map((d) => (
                <path key={d} d={d} transform={markTransform} />
              ))}
            </clipPath>
          </defs>
          <g opacity={appear * (1 - merge)}>{rects}</g>
          {merge > 0 ? (
            <g clipPath={`url(#${clipId})`} opacity={merge}>
              <rect
                x={ox}
                y={oy}
                width={rootPx}
                height={rootPx}
                fill={`url(#${gradId})`}
              />
              <path
                d={lattice}
                fill="none"
                stroke={pal.bg}
                strokeWidth={gap}
                opacity={0.55 + 0.45 * (1 - merge)}
              />
            </g>
          ) : null}
          <g
            opacity={guide}
            stroke={pal.hair}
            strokeWidth={1.25 * u}
            fill="none"
          >
            {corners.map(([cx, cy, dx, dy]) => (
              <path
                key={`${cx}-${cy}`}
                d={`M${cx} ${cy + dy * tick}V${cy}H${cx + dx * tick}`}
              />
            ))}
          </g>
          {letters.map((ch, i) => {
            const k = interpolate(t - WORD_AT - i * 2.5, [0, 14], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            return (
              <text
                key={`${uid}-${i}`}
                x={wordLeft + offsets[i]}
                y={baseline}
                opacity={k}
                transform={`translate(${(1 - k) * 18 * u} 0)`}
                fill={pal.fg}
                style={{
                  fontFamily: manrope.fontFamily,
                  fontWeight: 600,
                  fontSize,
                  whiteSpace: "pre",
                }}
              >
                {ch}
              </text>
            );
          })}
        </svg>
      </div>
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: pal.grain,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={13}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
      </svg>
    </AbsoluteFill>
  );
}
