"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength } from "@remotion/paths";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;
const R_LEN = getLength(REMOCN_R_PATH);
/** Manrope 600 advance of "emocn" at -0.025em tracking, in em. */
const EMOCN_EM = 3.146;

export interface NeuralPulseProps {
  /** The prompt that enters the network. Split on spaces into tokens (max 5). */
  input?: string;
  /** What the network resolves to: a product name or a short answer. */
  output?: string;
  /** Replaces the remocn R mark next to the output. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const HIDDEN = [6, 7, 5];
const T_SPLIT = 16;
const T_FLY = 30;
const T_FIRE = 54;
const T_HOP0 = 62;
const HOP = 15;
const TRAVEL = 13;
const T_RESOLVE = T_HOP0 + 4 * HOP;

// gradients.sh "beam" palette: bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660]
const PALETTES = {
  dark: {
    bg: "#02030a",
    fg: [243, 244, 250],
    muted: "#8B8A90",
    token: "rgba(143,180,255,0.05)",
    grain: 0.06,
    beam: [
      [26, 22, 96, 0.55],
      [61, 91, 255, 0.3],
      [143, 180, 255, 0.16],
    ],
    rFill: ["#f4f7ff", "#8fb4ff", "#3d5bff"],
  },
  light: {
    bg: "#F5F4F0",
    fg: [18, 18, 24],
    muted: "#6E6C67",
    token: "rgba(255,255,255,0.75)",
    grain: 0.04,
    beam: [
      [143, 180, 255, 0.22],
      [61, 91, 255, 0.1],
      [244, 247, 255, 0.9],
    ],
    rFill: ["#1a1660", "#3d5bff", "#8fb4ff"],
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const rgba = (c: readonly number[], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;

interface Node3 {
  x: number;
  y: number;
  z: number;
  act: number;
}

interface Edge {
  k: number;
  i: number;
  j: number;
  w: number;
  start: number;
  primary: boolean;
}

/** Deterministic layered net: positions, attention weights, activations, path. */
function buildNet(tokenLengths: number[], u: number) {
  const tokens = tokenLengths.length;
  const longest = Math.max(...tokenLengths);
  const sizes = [tokens, ...HIDDEN, 1];
  const layers: Node3[][] = sizes.map((n, k) => {
    const spacing = Math.min(86, 440 / Math.max(1, n - 1)) * u;
    return Array.from({ length: n }, (_, i) => {
      const edge = k === 0 || k === sizes.length - 1;
      return {
        x: (-330 + k * 165) * u,
        y:
          (i - (n - 1) / 2) * spacing +
          (edge ? 0 : (hash(k * 31 + i) - 0.5) * 18 * u),
        z: edge ? 0 : (hash(k * 17 + i * 7 + 3) - 0.5) * 420 * u,
        act: k === 0 ? 0.35 + (0.65 * tokenLengths[i]) / longest : 0,
      };
    });
  });
  const weight = (k: number, i: number, j: number) =>
    hash(k * 1000 + i * 37 + j * 101 + 7) ** 2.2;
  for (let k = 1; k < sizes.length; k++) {
    let max = 0;
    for (const [j, node] of layers[k].entries()) {
      node.act = layers[k - 1].reduce(
        (s, prev, i) => s + prev.act * weight(k - 1, i, j),
        0,
      );
      max = Math.max(max, node.act);
    }
    for (const node of layers[k]) node.act = max > 0 ? node.act / max : 0;
  }
  // attention path: forward from the heaviest token, strongest weight * activation
  const path = new Set<string>();
  const primaryToken = tokenLengths.indexOf(longest);
  let at = primaryToken;
  for (let k = 0; k < sizes.length - 1; k++) {
    let best = -1;
    let bestJ = 0;
    for (const [j, node] of layers[k + 1].entries()) {
      const s = node.act * weight(k, at, j);
      if (s > best) {
        best = s;
        bestJ = j;
      }
    }
    path.add(`${k}-${at}-${bestJ}`);
    at = bestJ;
  }
  const edges: Edge[] = [];
  for (let k = 0; k < sizes.length - 1; k++) {
    for (let i = 0; i < sizes[k]; i++) {
      for (let jj = 0; jj < sizes[k + 1]; jj++) {
        edges.push({
          k,
          i,
          j: jj,
          w: weight(k, i, jj),
          start: T_HOP0 + k * HOP + Math.round(hash(k * 7 + i * 13 + jj) * 3),
          primary: path.has(`${k}-${i}-${jj}`),
        });
      }
    }
  }
  return { layers, edges, primaryToken };
}

function arrival(k: number) {
  return k === 0 ? T_HOP0 : T_HOP0 + (k - 1) * HOP + TRAVEL + 2;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function NeuralPulse({
  input = "Make a launch film",
  output = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: NeuralPulseProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = PALETTES[theme];
  const fg = p.fg;

  const tokens = input.split(/\s+/).filter(Boolean).slice(0, 5);
  const { layers, edges, primaryToken } = buildNet(
    tokens.map((tk) => tk.length),
    u,
  );
  const outK = layers.length - 1;

  // ---- camera: slow yaw drift, gentle pitch, then truck + push at resolve
  const drift = interpolate(t, [0, 200], [0, 1], { ...CLAMP, easing: EASE_IO });
  const yaw = ((-26 + drift * 30) * Math.PI) / 180;
  const pitch = ((7 - drift * 4) * Math.PI) / 180;
  const resolveP = interpolate(t, [T_RESOLVE + 2, T_RESOLVE + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const dolly = -resolveP * 160 * u;
  const f = 1500 * u;

  const rawProject = (n: { x: number; y: number; z: number }) => {
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const x = n.x * cyw + n.z * syw;
    let z = -n.x * syw + n.z * cyw;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const y = n.y * cp - z * sp;
    z = n.y * sp + z * cp + dolly;
    const s = f / (f - z);
    return { x: width / 2 + x * s, y: height / 2 + y * s, s, z };
  };

  // final lockup: the real logo (R mark + "emocn" in Manrope), centered.
  // The output node lands on the R's first anchor and traces its outline.
  const brand = !logo && output.trim().toLowerCase() === "remocn";
  const word = brand ? "emocn" : output;
  const wordEm = brand ? EMOCN_EM : word.length * 0.63;
  const nameSize = Math.min(height * 0.175, (width * 0.6) / (0.74 + wordEm));
  const markH = nameSize * 0.76;
  const markW = logo ? markH : (markH * R_W) / R_H;
  const gap = nameSize * (brand ? 0.04 : 0.24);
  const groupW = markW + gap + wordEm * nameSize;
  const markLeft = width / 2 - groupW / 2;
  const baselineY = height / 2 + nameSize * 0.36;
  const markTop = baselineY - markH;
  const rk = markH / R_H;
  const toScreen = (pt: { x: number; y: number }) => ({
    x: markLeft + pt.x * rk,
    y: markTop + pt.y * rk,
  });
  const dotTarget = logo
    ? { x: markLeft + markW / 2, y: markTop + markH / 2 }
    : toScreen({ x: 0.01, y: 0.81 });
  const outRaw = rawProject(layers[outK][0]);
  const panX = (dotTarget.x - outRaw.x) * resolveP;
  const panY = (dotTarget.y - outRaw.y) * resolveP;
  const project = (n: { x: number; y: number; z: number }) => {
    const r = rawProject(n);
    return { ...r, x: r.x + panX, y: r.y + panY };
  };

  const proj = layers.map((layer) => layer.map(project));

  // network focus: soft at the open, sharp while firing, defocused behind the title
  const netBlur =
    interpolate(t, [0, 44], [3.2, 0], { ...CLAMP, easing: EASE_IO }) +
    resolveP * 5;
  const netOpacity = 1 - resolveP * 0.7;

  const intro = (k: number, i: number) =>
    interpolate(t, [2 + k * 4 + i * 1.5, 22 + k * 4 + i * 1.5], [0, 1], CLAMP);

  const nodeLit = (k: number, i: number) => {
    const a = arrival(k);
    const act = k === 0 ? 1 : layers[k][i].act;
    const env = interpolate(t, [a, a + 4, a + 26], [0, 1, 0.4], CLAMP);
    const bloom = interpolate(t, [a, a + 5, a + 18], [0, 1, 0], CLAMP);
    return { lit: env * act, bloom: bloom * act };
  };

  const onPath = (k: number, i: number) => {
    if (k === outK) return true;
    if (k === 0) return i === primaryToken;
    return edges.some((e) => e.primary && e.k === k && e.i === i);
  };

  // ---- edges + pulses (SVG)
  const edgeEls: React.ReactNode[] = [];
  const pulseEls: React.ReactNode[] = [];
  for (const e of edges) {
    const a = proj[e.k][e.i];
    const b = proj[e.k + 1][e.j];
    const depth = interpolate(
      (a.s + b.s) / 2,
      [0.85, 1.15],
      [0.55, 1.1],
      CLAMP,
    );
    const on = Math.min(intro(e.k, e.i), intro(e.k + 1, e.j));
    const env = interpolate(
      t,
      [e.start, e.start + TRAVEL * 0.6, e.start + TRAVEL + 22],
      [0, 1, e.primary ? 0.7 : 0.18],
      CLAMP,
    );
    const strength = e.primary ? 1 : e.w ** 1.4;
    const base = 0.06 * depth * on;
    const lit = env * strength * (e.primary ? 0.95 : 0.5) * depth;
    edgeEls.push(
      <line
        key={`e${e.k}-${e.i}-${e.j}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={e.primary && env > 0 ? accent : rgba(fg, 1)}
        strokeOpacity={e.primary && env > 0 ? lit : base + lit}
        strokeWidth={(e.primary ? 1.6 : 1) * u * depth}
      />,
    );
    if (e.primary || e.w > 0.38) {
      const raw = (t - e.start) / TRAVEL;
      for (let g = 0; g < 4; g++) {
        const q = raw - g * 0.06;
        if (q <= 0 || q >= 1) continue;
        const qe = EASE_IO(q);
        const fade = Math.min(1, (1 - q) * 6) * Math.min(1, q * 8);
        pulseEls.push(
          <circle
            key={`p${e.k}-${e.i}-${e.j}-${g}`}
            cx={a.x + (b.x - a.x) * qe}
            cy={a.y + (b.y - a.y) * qe}
            r={(e.primary ? 3 : 2.2) * u * depth * (1 - g * 0.18)}
            fill={e.primary ? accent : rgba(fg, 1)}
            opacity={
              fade *
              (g === 0 ? 1 : 0.42 / g) *
              (e.primary ? 1 : 0.4 + e.w * 0.6)
            }
          />,
        );
      }
    }
  }

  // ---- tokens: sentence -> tokenized -> column at the input nodes -> fired
  const tokSize = 25 * u;
  const pad = 13 * u;
  const tokW = tokens.map((tk) => tk.length * tokSize * 0.6 + pad * 2);
  const split = interpolate(t, [T_SPLIT, T_SPLIT + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const gapX = (4 + split * 10) * u;
  const rowW = tokW.reduce((s, w) => s + w, 0) + gapX * (tokens.length - 1);
  let cursor = width / 2 - rowW / 2;
  const colScale = 0.66;
  const tokenEls = tokens.map((tk, i) => {
    const fly = interpolate(t, [T_FLY + i * 3, T_FLY + i * 3 + 22], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const node = proj[0][i];
    const startX = cursor;
    cursor += tokW[i] + gapX;
    const endX = node.x - 26 * u - tokW[i] * colScale;
    const x = startX + (endX - startX) * fly;
    const y = height / 2 + (node.y - height / 2) * fly;
    const sc = 1 + (colScale - 1) * fly;
    const appear = interpolate(t, [i * 2, i * 2 + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const fire = interpolate(
      t,
      [T_FIRE + i * 2, T_FIRE + i * 2 + 6],
      [0, 1],
      CLAMP,
    );
    const primary = i === primaryToken;
    const border =
      primary && fire > 0
        ? accent
        : rgba(fg, (0.08 + 0.14 * split) * (1 - fire * 0.3));
    const line = interpolate(t, [T_FIRE + i * 2, T_FIRE + i * 2 + 8], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return (
      <div key={`t${i}`}>
        <div
          style={{
            position: "absolute",
            left: x,
            top: y - (tokSize * 1.5) / 2,
            width: tokW[i],
            height: tokSize * 1.5,
            transformOrigin: "0% 50%",
            transform: `scale(${sc}) translateY(${(1 - appear) * 10 * u}px)`,
            opacity: appear,
            borderRadius: 8 * u,
            border: `${Math.max(1, u)}px solid ${border}`,
            background: split > 0 ? p.token : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: mono,
            fontWeight: 400,
            fontSize: tokSize,
            letterSpacing: "0em",
            color: rgba(fg, 0.92),
            whiteSpace: "nowrap",
          }}
        >
          {tk}
        </div>
        <div
          style={{
            position: "absolute",
            left: endX + tokW[i] * colScale + 6 * u,
            top: node.y - 0.5 * u,
            width: Math.max(0, node.x - endX - tokW[i] * colScale - 12 * u),
            height: Math.max(1, u),
            transformOrigin: "0% 50%",
            transform: `scaleX(${line})`,
            background: primary ? accent : rgba(fg, 0.3),
            opacity:
              fly >= 1
                ? 1 -
                  interpolate(t, [T_FIRE + 20, T_FIRE + 40], [0, 0.6], CLAMP)
                : 0,
          }}
        />
      </div>
    );
  });

  // ---- nodes (HTML for real depth-of-field blur)
  const nodeEls: React.ReactNode[] = [];
  for (const [k, layer] of layers.entries()) {
    if (k === outK) continue;
    for (const [i] of layer.entries()) {
      const pr = proj[k][i];
      const { lit, bloom } = nodeLit(k, i);
      const path = onPath(k, i) && lit > 0;
      const r = 5.2 * u * pr.s * (1 + bloom * 0.45);
      const dof = Math.abs(pr.s - 1) * 15 * u;
      const col = path ? accent : rgba(fg, 0.26 + 0.74 * lit ** 1.5);
      nodeEls.push(
        <div
          key={`n${k}-${i}`}
          style={{
            position: "absolute",
            left: pr.x - r,
            top: pr.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: col,
            opacity: intro(k, i),
            filter: dof > 0.4 ? `blur(${dof}px)` : undefined,
            boxShadow: `0 0 0 ${r * 1.4 * bloom}px ${path ? `${accent}22` : rgba(fg, 0.07 * bloom)}`,
          }}
        />,
      );
    }
  }

  // ---- output node: fires, blooms, settles into the mark's dot
  const outP = proj[outK][0];
  const outFire = arrival(outK);
  const outIn = intro(outK, 0);
  const outBloom = interpolate(
    t,
    [outFire, outFire + 6, outFire + 22],
    [0, 1, 0],
    CLAMP,
  );
  const outLit = interpolate(t, [outFire, outFire + 4], [0, 1], CLAMP);
  const dotR = 5.5 * u;
  const outR =
    interpolate(resolveP, [0, 1], [7 * u * outP.s, dotR]) *
    (1 + outBloom * 0.5);
  const ringP = interpolate(t, [outFire, outFire + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // the node rides round the R's outline, then the mark fills behind it
  const T_TRACE = T_RESOLVE + 32;
  const traceP = interpolate(t, [T_TRACE, T_TRACE + 34], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const headPt =
    !logo && traceP > 0
      ? getPointAtLength(REMOCN_R_PATH, traceP * R_LEN)
      : null;
  const head = headPt ? toScreen(headPt) : null;
  const nodeX = head ? head.x : outP.x;
  const nodeY = head ? head.y : outP.y;
  const fillP = interpolate(t, [T_TRACE + 18, T_TRACE + 42], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const nodeFade = logo
    ? 1 - interpolate(t, [T_TRACE, T_TRACE + 12], [0, 1], CLAMP)
    : 1 - interpolate(t, [T_TRACE + 32, T_TRACE + 44], [0, 1], CLAMP);
  const strokeO =
    interpolate(t, [T_TRACE, T_TRACE + 4], [0, 1], CLAMP) *
    (1 - interpolate(t, [T_TRACE + 34, T_TRACE + 50], [0, 1], CLAMP));
  const nameP = interpolate(t, [T_TRACE + 20, T_TRACE + 52], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const fgSolid = rgba(fg, 1);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `rfill${uid}`;

  // beam ground: rises behind the lockup as the network resolves
  const beamUp = 0.45 + 0.55 * resolveP;
  const beamY = 104 - resolveP * 8 + Math.sin(t / 40) * 1.2;
  const [b0, b1, b2] = p.beam;
  const beamBg = [
    `radial-gradient(40% 24% at 50% ${56 + (1 - resolveP) * 4}%, rgba(${b1[0]},${b1[1]},${b1[2]},${b1[3] * resolveP * 0.8}) 0%, transparent 75%)`,
    `radial-gradient(24% 62% at ${50 + Math.sin(t / 55) * 1.2}% ${beamY}%, rgba(${b2[0]},${b2[1]},${b2[2]},${b2[3] * beamUp}) 0%, transparent 72%)`,
    `radial-gradient(60% 70% at 50% ${beamY + 6}%, rgba(${b1[0]},${b1[1]},${b1[2]},${b1[3] * beamUp * 0.7}) 0%, transparent 72%)`,
    `radial-gradient(90% 80% at 50% 38%, rgba(${b0[0]},${b0[1]},${b0[2]},${b0[3]}) 0%, transparent 78%)`,
  ].join(", ");

  const rTransform = `translate(${markLeft} ${markTop}) scale(${rk})`;
  const wordX = markLeft + markW + gap;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: beamBg }} />

      <AbsoluteFill
        style={{
          filter: netBlur > 0.2 ? `blur(${netBlur * u}px)` : undefined,
          opacity: netOpacity,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {edgeEls}
          {pulseEls}
        </svg>
        {nodeEls}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: resolveP > 0.01 ? `blur(${resolveP * 5 * u}px)` : undefined,
          opacity: netOpacity,
        }}
      >
        {tokenEls}
      </AbsoluteFill>

      {/* lockup: R outline traced by the node, gradient fill, then "emocn" */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={R_W * (0.2 + 0.06 * Math.sin(t / 45))}
            y1={0}
            x2={R_W * 0.55}
            y2={R_H}
          >
            <stop offset="0%" stopColor={p.rFill[0]} />
            <stop offset="58%" stopColor={p.rFill[1]} />
            <stop offset="100%" stopColor={p.rFill[2]} />
          </linearGradient>
        </defs>
        {!logo && (
          <g transform={rTransform}>
            <path d={REMOCN_R_PATH} fill={`url(#${gradId})`} opacity={fillP} />
            {strokeO > 0 && (
              <path
                d={REMOCN_R_PATH}
                fill="none"
                stroke={rgba(fg, 1)}
                strokeWidth={(1 * u) / rk}
                opacity={strokeO * 0.16 * (1 - fillP)}
              />
            )}
            {strokeO > 0 && (
              <path
                d={REMOCN_R_PATH}
                fill="none"
                stroke={accent}
                strokeWidth={(2.2 * u) / rk}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={`${traceP} 2`}
                opacity={strokeO}
              />
            )}
          </g>
        )}
      </svg>
      {logo ? (
        <div
          style={{
            position: "absolute",
            left: markLeft,
            top: markTop,
            width: markW,
            height: markH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(t, [T_TRACE, T_TRACE + 14], [0, 1], CLAMP),
          }}
        >
          {logo}
        </div>
      ) : null}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          opacity: nameP,
          filter: nameP < 0.98 ? `blur(${(1 - nameP) * 8 * u}px)` : undefined,
          transform: `translateX(${(1 - nameP) * -14 * u}px)`,
        }}
        aria-hidden
      >
        <text
          x={wordX}
          y={baselineY}
          fill={fgSolid}
          style={{
            fontFamily: manrope.fontFamily,
            fontWeight: brand ? 600 : 500,
            fontSize: nameSize,
            letterSpacing: `${0.05 - nameP * 0.075}em`,
          }}
        >
          {word}
        </text>
      </svg>

      {/* output node: stays sharp, it is where focus lands */}
      <div
        style={{
          position: "absolute",
          left: outP.x - outR * 4,
          top: outP.y - outR * 4,
          width: outR * 8,
          height: outR * 8,
          borderRadius: "50%",
          border: `${Math.max(1, u)}px solid ${accent}`,
          transform: `scale(${0.25 + ringP * 0.75})`,
          opacity: (1 - ringP) * 0.5 * outLit,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: nodeX - outR,
          top: nodeY - outR,
          width: outR * 2,
          height: outR * 2,
          borderRadius: "50%",
          background: outLit > 0 ? accent : rgba(fg, 0.35),
          opacity: outIn * nodeFade,
          boxShadow: `0 0 0 ${outR * 0.9 * Math.max(outBloom, head ? 0.6 : 0)}px ${accent}2E`,
        }}
      />

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
