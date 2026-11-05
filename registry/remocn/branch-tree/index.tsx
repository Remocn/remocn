"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { evolvePath } from "@remotion/paths";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/** gradients.sh "aurora" palette, top to bottom of the leaf column. Light keeps the hues, deeper. */
const AURORA = {
  dark: ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"],
  light: ["#3fae86", "#2a8f84", "#4a3fb0", "#a2468b"],
} as const;

function lerpHex(stops: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const w = x - i;
  const ch = (h: string, o: number) => Number.parseInt(h.slice(o, o + 2), 16);
  const m = (o: number) =>
    Math.round(ch(stops[i], o) + (ch(stops[i + 1], o) - ch(stops[i], o)) * w);
  return `rgb(${m(1)}, ${m(3)}, ${m(5)})`;
}

export interface BranchTreeProps {
  depth?: number;
  branching?: number | number[];
  title?: string;
  rootLabel?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    node: "#8B8A90",
    hair: "rgba(255,255,255,0.3)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    node: "#8E8C86",
    hair: "rgba(18,18,20,0.32)",
    grain: 0.045,
  },
} as const;

const ROOT_IN = 4;
const EDGE = 12;
const LEAD = 2;
const SIB = 2;
const MAX_LEAVES = 96;

interface TreeNode {
  level: number;
  parent: number;
  sib: number;
  sibs: number;
  y: number;
  path: number[];
  children: number[];
  arrive: number;
  start: number;
}

function buildTree(depth: number, fan: number[]) {
  const nodes: TreeNode[] = [
    {
      level: 0,
      parent: -1,
      sib: 0,
      sibs: 1,
      y: 0,
      path: [],
      children: [],
      arrive: ROOT_IN,
      start: ROOT_IN,
    },
  ];
  let frontier = [0];
  for (let l = 1; l <= depth; l++) {
    const next: number[] = [];
    const k = fan[l - 1];
    for (const pi of frontier) {
      const parent = nodes[pi];
      for (let j = 0; j < k; j++) {
        const start = parent.arrive + LEAD + Math.abs(j - (k - 1) / 2) * SIB;
        const idx = nodes.length;
        nodes.push({
          level: l,
          parent: pi,
          sib: j,
          sibs: k,
          y: 0,
          path: [...parent.path, j],
          children: [],
          arrive: start + EDGE,
          start,
        });
        parent.children.push(idx);
        next.push(idx);
      }
    }
    frontier = next;
  }
  return { nodes, leaves: frontier };
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
          seed={43}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function BranchTree({
  depth = 3,
  branching = [3, 4, 4],
  title = "variants",
  rootLabel = "1 component",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BranchTreeProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const D = Math.min(5, Math.max(1, Math.round(depth)));
  const raw = Array.isArray(branching) ? branching : [branching];
  const fan: number[] = [];
  let leafCount = 1;
  for (let l = 0; l < D; l++) {
    const want = Math.min(
      6,
      Math.max(1, Math.round(raw[Math.min(l, raw.length - 1)] ?? 2)),
    );
    const k = Math.max(1, Math.min(want, Math.floor(MAX_LEAVES / leafCount)));
    fan.push(k);
    leafCount *= k;
  }

  const { nodes, leaves } = buildTree(D, fan);

  const rootX = width * 0.19;
  const leafX = width * 0.61;
  const cy = height / 2;
  const treeH = height * 0.76;
  const xOf = (l: number) => rootX + ((leafX - rootX) * l) / D;

  let acc = 0;
  const raws: number[] = [];
  leaves.forEach((li, j) => {
    if (j > 0) {
      const a = nodes[leaves[j - 1]].path;
      const b = nodes[li].path;
      let common = 0;
      while (common < D && a[common] === b[common]) common++;
      acc += 1 + 0.9 * (D - 1 - common);
    }
    raws.push(acc);
  });
  const span = acc || 1;
  leaves.forEach((li, j) => {
    nodes[li].y =
      leaves.length > 1 ? cy - treeH / 2 + (treeH * raws[j]) / span : cy;
  });
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.children.length) {
      n.y =
        (nodes[n.children[0]].y + nodes[n.children[n.children.length - 1]].y) /
        2;
    }
  }

  const lastArrive = Math.max(...leaves.map((i) => nodes[i].arrive));
  const HIT = lastArrive + 6;

  const land = spring({
    frame: t - HIT,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.8 },
  });
  const landO = interpolate(t, [HIT, HIT + 8], [0, 1], CLAMP);
  const blur = interpolate(t, [HIT, HIT + 14], [1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT, HIT + 24], [0.6, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const cap = interpolate(t, [HIT + 10, HIT + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(t, [HIT - 4, HIT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rootIn = spring({
    frame: t - ROOT_IN,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.7 },
  });
  const rootLab = interpolate(t, [ROOT_IN + 2, ROOT_IN + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, 140], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [0, 8], [0.5, 1], CLAMP);

  const stroke = Math.max(1, 1.25 * u);
  const leafR = Math.max(2.4, 3.4 * u);
  const nodeR = Math.max(2.4, 3.4 * u);
  const numSize = 200 * u;
  const aur = AURORA[theme];
  const top = cy - treeH / 2;
  const tint = (y: number) => lerpHex(aur, (y - top) / treeH);
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const drift = interpolate(t, [0, 150], [0, 1], { ...CLAMP, easing: EASE_IO });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "45% 50%",
          opacity: stage,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${gid}e`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={top}
              x2={0}
              y2={top + treeH}
            >
              {aur.map((c, i) => (
                <stop key={c} offset={i / (aur.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          {nodes.map((n, i) => {
            if (n.parent < 0 || t < n.start) return null;
            const par = nodes[n.parent];
            const px = xOf(par.level);
            const cx = xOf(n.level);
            const mx = px + (cx - px) * 0.5;
            const d = `M${px.toFixed(2)} ${par.y.toFixed(2)} C${mx.toFixed(2)} ${par.y.toFixed(2)} ${mx.toFixed(2)} ${n.y.toFixed(2)} ${cx.toFixed(2)} ${n.y.toFixed(2)}`;
            const k = interpolate(t, [n.start, n.arrive], [0, 1], {
              ...CLAMP,
              easing: EASE_GROW,
            });
            const evo = evolvePath(k, d);
            return (
              <path
                key={`e${i}`}
                d={d}
                fill="none"
                stroke={n.level === D ? `url(#${gid}e)` : p.hair}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={evo.strokeDasharray}
                strokeDashoffset={evo.strokeDashoffset}
                opacity={
                  n.level === D
                    ? (theme === "dark" ? 0.5 : 0.6) + 0.25 * settle
                    : 1 - 0.3 * settle
                }
              />
            );
          })}

          {nodes.map((n, i) => {
            if (n.level === 0 || t < n.arrive - 2) return null;
            const isLeaf = n.level === D;
            const s = spring({
              frame: t - n.arrive + 1,
              fps,
              config: isLeaf
                ? { damping: 11, stiffness: 220, mass: 0.6 }
                : { damping: 18, stiffness: 200, mass: 0.6 },
            });
            const o = interpolate(
              t,
              [n.arrive - 2, n.arrive + 3],
              [0, 1],
              CLAMP,
            );
            return (
              <circle
                key={`n${i}`}
                cx={xOf(n.level)}
                cy={n.y}
                r={(isLeaf ? leafR : nodeR) * (0.4 + 0.6 * s)}
                fill={isLeaf ? tint(n.y) : p.node}
                opacity={o}
              />
            );
          })}

          <circle
            cx={rootX}
            cy={nodes[0].y}
            r={14 * u * (0.7 + 0.3 * rootIn)}
            fill="none"
            stroke={accent}
            strokeWidth={stroke * 1.4}
            opacity={interpolate(t, [ROOT_IN, ROOT_IN + 6], [0, 1], CLAMP)}
          />
          <circle
            cx={rootX}
            cy={nodes[0].y}
            r={7 * u * (0.4 + 0.6 * rootIn)}
            fill={p.fg}
            opacity={interpolate(t, [ROOT_IN, ROOT_IN + 5], [0, 1], CLAMP)}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: rootX,
            top: nodes[0].y - 34 * u,
            transform: `translate(-50%, -100%) translateY(${(1 - rootLab) * 6 * u}px)`,
            opacity: rootLab,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 21 * u,
            letterSpacing: "-0.01em",
            color: p.fg,
            whiteSpace: "nowrap",
          }}
        >
          {rootLabel}
        </div>

        <div
          style={{
            position: "absolute",
            left: leafX + 64 * u,
            top: cy,
            transform: `translateY(${-numSize * 0.6}px)`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 500,
              fontSize: numSize,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              paddingRight: 0.06 * numSize,
              backgroundImage: `linear-gradient(${172 - 10 * drift}deg, ${aur[0]} 4%, ${aur[1]} 34%, ${aur[2]} 70%, ${aur[3]} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              opacity: landO,
              filter: blur > 0.01 ? `blur(${blur * 8 * u}px)` : undefined,
              transform: `translateX(${(1 - land) * -24 * u}px)`,
            }}
          >
            {Math.round(leafCount * count)}
          </div>
          <div
            style={{
              marginTop: 18 * u,
              marginLeft: 0.04 * numSize,
              opacity: cap,
              transform: `translateY(${(1 - cap) * 8 * u}px)`,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 28 * u,
              letterSpacing: "-0.015em",
              color: p.muted,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
