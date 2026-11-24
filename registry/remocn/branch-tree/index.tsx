"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { evolvePath } from "@remotion/paths";
import { type ReactNode, useId } from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type BranchTreeElementId,
  branchTreeTimeline,
  buildTree,
  EDGE,
  treeShape,
} from "./timeline";

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
  /** Frames each branch takes to grow to its node. */
  grow?: number;
  /** Weight of the leaf count. */
  fontWeight?: number;
  accent?: string;
  /** Text color of the root label and root node; overrides the theme. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the count and labels. Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Size of the tree and count, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the root, each branch and the count, by the
   * ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<BranchTreeElementId>;
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

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
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

export function BranchTree(props: BranchTreeProps) {
  const {
    depth = 3,
    branching = [3, 4, 4],
    title = "variants",
    rootLabel = "1 component",
    grow = EDGE,
    fontWeight = 500,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = sans,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    branchTreeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const stageEl = tl.get("stage");
  const pushEl = tl.get("push");
  const rootEl = tl.get("root");
  const rootLabelEl = tl.get("root-label");
  const countEl = tl.get("count");
  const titleEl = tl.get("title");
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const bgFill = background ?? p.bg;

  const { D, fan, leafCount } = treeShape(depth, branching);

  const { nodes, leaves } = buildTree(D, fan, grow);

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

  const HIT = countEl.start;

  const land = spring({
    frame: t - HIT,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.8 },
  });
  const landO = interpolate(
    t,
    [HIT, HIT + countEl.beat("fade")],
    [0, 1],
    CLAMP,
  );
  const blur = interpolate(t, [HIT, HIT + countEl.beat("blur")], [1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT, countEl.end], [0.6, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const cap = interpolate(t, [titleEl.start, titleEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(
    t,
    [HIT + countEl.beat("settleFrom"), HIT + countEl.beat("settleTo")],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_IO,
    },
  );
  const rootIn = spring({
    frame: t - rootEl.start,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.7 },
  });
  const rootLab = interpolate(t, [rootLabelEl.start, rootLabelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [pushEl.start, pushEl.end], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [stageEl.start, stageEl.end], [0.5, 1], CLAMP);

  const stroke = Math.max(1, 1.25 * u);
  const leafR = Math.max(2.4, 3.4 * u);
  const nodeR = Math.max(2.4, 3.4 * u);
  const numSize = 200 * u;
  const aur = AURORA[theme];
  const top = cy - treeH / 2;
  const tint = (y: number) => lerpHex(aur, (y - top) / treeH);
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const drift = interpolate(
    t,
    [pushEl.start, pushEl.start + pushEl.beat("drift")],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );

  return (
    <AbsoluteFill style={{ background: bgFill, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            // The push covers the labels inside it, which ride it all along.
            transform: `scale(${push})${glide(t > pushEl.start && t < pushEl.end)}`,
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
              if (n.parent < 0) return null;
              const e = tl.get(`branch:${i}`);
              if (t < e.start) return null;
              const par = nodes[n.parent];
              const px = xOf(par.level);
              const cx = xOf(n.level);
              const mx = px + (cx - px) * 0.5;
              const d = `M${px.toFixed(2)} ${par.y.toFixed(2)} C${mx.toFixed(2)} ${par.y.toFixed(2)} ${mx.toFixed(2)} ${n.y.toFixed(2)} ${cx.toFixed(2)} ${n.y.toFixed(2)}`;
              const k = interpolate(t, [e.start, e.end], [0, 1], {
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
              if (n.level === 0) return null;
              const arrive = tl.get(`branch:${i}`).end;
              if (t < arrive - 2) return null;
              const isLeaf = n.level === D;
              const s = spring({
                frame: t - arrive + 1,
                fps,
                config: isLeaf
                  ? { damping: 11, stiffness: 220, mass: 0.6 }
                  : { damping: 18, stiffness: 200, mass: 0.6 },
              });
              const o = interpolate(t, [arrive - 2, arrive + 3], [0, 1], CLAMP);
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
              opacity={interpolate(
                t,
                [rootEl.start, rootEl.start + rootEl.beat("ring")],
                [0, 1],
                CLAMP,
              )}
            />
            <circle
              cx={rootX}
              cy={nodes[0].y}
              r={7 * u * (0.4 + 0.6 * rootIn)}
              fill={fg}
              opacity={interpolate(
                t,
                [rootEl.start, rootEl.start + rootEl.beat("dot")],
                [0, 1],
                CLAMP,
              )}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: rootX,
              top: nodes[0].y - 34 * u,
              transform: `translate(-50%, -100%) translateY(${(1 - rootLab) * 6 * u}px)`,
              opacity: rootLab,
              fontFamily,
              fontWeight: 400,
              fontSize: 21 * u,
              letterSpacing: "-0.01em",
              color: fg,
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
                fontFamily,
                fontWeight,
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
                fontFamily,
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
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${bgFill} 100%)`,
          opacity: 0.6,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
