"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export type FlowIcon = "bolt" | "kite" | "split" | "mail" | "hash" | "sheet";

export interface FlowNode {
  id: string;
  title: string;
  subtitle: string;
  icon: FlowIcon;
  /** Icon tint. */
  color: string;
  /** Run time shown once the packet passes, e.g. "0.4s". */
  duration: string;
  width?: number;
  /** Ids of the nodes this one connects to. */
  next?: string[];
}

export interface FlowBuilderProps {
  nodes?: FlowNode[];
  title?: string;
  workspace?: string;
  toast?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_NODES: FlowNode[] = [
  {
    id: "signup",
    title: "New signup",
    subtitle: "Webhook · /signup",
    icon: "bolt",
    color: "#E8590C",
    duration: "0.1s",
    next: ["enrich"],
  },
  {
    id: "enrich",
    title: "Enrich lead",
    subtitle: "Company and role",
    icon: "kite",
    color: "#0E9F9A",
    duration: "1.2s",
    next: ["paths"],
  },
  {
    id: "paths",
    title: "Split by plan",
    subtitle: "2 paths",
    icon: "split",
    color: "#7A7F8C",
    duration: "12ms",
    width: 176,
    next: ["email", "notify"],
  },
  {
    id: "email",
    title: "Welcome email",
    subtitle: "Free plan · Day 0",
    icon: "mail",
    color: "#D6455D",
    duration: "0.4s",
  },
  {
    id: "notify",
    title: "Notify #growth",
    subtitle: "Pro plan · post",
    icon: "hash",
    color: "#3B82C4",
    duration: "0.3s",
  },
];

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const PRESS = { mass: 0.4, damping: 14, stiffness: 420 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const NODE_H = 68;
const BAR = 56;
const B = {
  node: 10,
  nodeStep: 6,
  cursor: 46,
  run: 72,
  level: 18,
  travel: 10,
};

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const ICON_PATHS: Record<FlowIcon, string> = {
  bolt: "M9 1.8 3.6 9h4l-.9 5.2L12.4 7h-4z",
  kite: "M8 1.8 12.6 7 8 12.2 3.4 7zM8 1.8v10.4M3.4 7h9.2",
  split:
    "M2.5 8h3.2M5.7 8c2.2 0 2.6-4.2 5.4-4.2h2.4M5.7 8c2.2 0 2.6 4.2 5.4 4.2h2.4",
  mail: "M2.6 4.2h10.8v7.6H2.6zM2.8 4.6 8 8.6l5.2-4",
  hash: "M6 2.5 4.8 13.5M11.2 2.5 10 13.5M2.8 6h11M2.2 10h11",
  sheet: "M3 2.5h10v11H3zM3 6.2h10M3 9.8h10M7.4 2.5v11",
};

function palette(theme: "light" | "dark") {
  const dark = theme === "dark";
  return {
    dark,
    window: dark ? "#0F1116" : "#FCFCFB",
    canvas: dark ? "#0B0D11" : "#F5F4F1",
    dot: dark ? "rgba(255,255,255,0.07)" : "rgba(30,28,24,0.11)",
    card: dark ? "#161920" : "#FFFFFF",
    edge: dark ? "rgba(255,255,255,0.22)" : "rgba(30,28,24,0.26)",
    text: dark ? "#ECEDEF" : "#1B1A18",
    muted: dark ? "#989BA4" : "#6B6862",
    faint: dark ? "#62666F" : "#A3A09A",
    rule: dark ? "rgba(255,255,255,0.07)" : "rgba(30,28,24,0.08)",
    success: dark ? "#43D18C" : "#17914F",
    depth: dark
      ? "0 0 0 1px rgba(255,255,255,0.09), 0 12px 24px -12px rgba(0,0,0,0.6), 0 40px 90px -24px rgba(0,0,0,0.75)"
      : "0 0 0 1px rgba(20,22,30,0.06), 0 2px 4px rgba(20,22,30,0.04), 0 40px 90px -24px rgba(20,30,80,0.3)",
    cardDepth: dark
      ? "0 0 0 1px rgba(255,255,255,0.08)"
      : "0 0 0 1px rgba(30,28,24,0.07), 0 1px 2px rgba(30,28,24,0.05), 0 6px 14px -6px rgba(30,28,24,0.1)",
    pill: dark ? "rgba(255,255,255,0.06)" : "rgba(30,28,24,0.05)",
  };
}
type Pal = ReturnType<typeof palette>;

interface Pt {
  x: number;
  y: number;
}
interface Key extends Pt {
  t: number;
}

function Cursor({ press }: { press: number }) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.1 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#16171A"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({
  color,
  track,
  frame,
  size = 14,
}: {
  color: string;
  track: string;
  frame: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ transform: `rotate(${frame * 18}deg)`, flexShrink: 0 }}
    >
      <circle
        cx={8}
        cy={8}
        r={6}
        fill="none"
        stroke={track}
        strokeWidth={1.5}
      />
      <path
        d="M8 2 A6 6 0 0 1 14 8"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Check({
  color,
  size,
  draw,
}: {
  color: string;
  size: number;
  draw: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3.5 8.4 6.6 11.4 12.5 5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw}
      />
    </svg>
  );
}

function NodeCard({
  node,
  pal,
  accent,
  active,
}: {
  node: FlowNode;
  pal: Pal;
  accent: string;
  active: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        background: pal.card,
        boxShadow: `0 0 0 ${1.5 * active}px ${withAlpha(accent, active)}, 0 0 0 ${5 * active}px ${withAlpha(accent, 0.14 * active)}, ${pal.cardDepth}`,
        padding: "0 14px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: withAlpha(node.color, pal.dark ? 0.18 : 0.11),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 16 16">
          <path
            d={ICON_PATHS[node.icon]}
            fill="none"
            stroke={node.color}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            lineHeight: "20px",
            color: pal.text,
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {node.title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: "18px",
            marginTop: 2,
            color: pal.muted,
            whiteSpace: "nowrap",
          }}
        >
          {node.subtitle}
        </div>
      </div>
    </div>
  );
}

export function FlowBuilder({
  nodes = DEFAULT_NODES,
  title = "Welcome new signups",
  workspace = "remocn",
  toast = "Live · runs on every signup",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: FlowBuilderProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 720 : 1280;
  const SH = tall ? 1280 : 720;
  const u = Math.min(width / SW, height / SH);
  const pal = palette(theme);
  const sp = (at: number, config: typeof CARD, dur?: number) =>
    spring({ frame: frame - at, fps, config, durationInFrames: dur });

  const WIN = tall
    ? { x: 80, y: 290, w: 560, h: 860 }
    : { x: 150, y: 110, w: 980, h: 500 };
  const CW = WIN.w;
  const CH = WIN.h - BAR;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parents = new Map<string, string>();
  for (const n of nodes)
    for (const id of n.next ?? []) if (!parents.has(id)) parents.set(id, n.id);
  const depth = new Map<string, number>();
  const queue = nodes.filter((n) => !parents.has(n.id)).map((n) => n.id);
  for (const id of queue) depth.set(id, 0);
  while (queue.length) {
    const id = queue.shift() as string;
    for (const nx of byId.get(id)?.next ?? []) {
      if (!depth.has(nx)) {
        depth.set(nx, (depth.get(id) ?? 0) + 1);
        queue.push(nx);
      }
    }
  }
  const maxDepth = Math.max(0, ...depth.values());
  const levels = Array.from({ length: maxDepth + 1 }, (_, d) =>
    nodes.filter((n) => (depth.get(n.id) ?? 0) === d),
  );

  const box = new Map<string, { x: number; y: number; w: number }>();
  if (tall) {
    const pitch = 150;
    const top = (CH - (maxDepth * pitch + NODE_H)) / 2 + 8;
    levels.forEach((row, d) => {
      const gap = 28;
      const w =
        row.length === 1
          ? 264
          : Math.min(240, (CW - 64 - gap * (row.length - 1)) / row.length);
      const total = row.length * w + (row.length - 1) * gap;
      row.forEach((n, k) => {
        box.set(n.id, {
          x: (CW - total) / 2 + k * (w + gap),
          y: top + d * pitch,
          w,
        });
      });
    });
  } else {
    const colW = levels.map((row) =>
      Math.max(...row.map((n) => n.width ?? 196)),
    );
    const gaps = levels
      .slice(1)
      .map((_, i) => (i === levels.length - 2 ? 66 : 42));
    const total =
      colW.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
    let x = (CW - total) / 2;
    levels.forEach((row, d) => {
      const pitch = NODE_H + 76;
      const top = CH / 2 - NODE_H / 2 - ((row.length - 1) * pitch) / 2 + 6;
      row.forEach((n, k) => {
        const w = n.width ?? 196;
        box.set(n.id, { x: x + (colW[d] - w) / 2, y: top + k * pitch, w });
      });
      x += colW[d] + (gaps[d] ?? 0);
    });
  }

  const edges = nodes.flatMap((n) =>
    (n.next ?? []).flatMap((id) => {
      const to = byId.get(id);
      const fb = box.get(n.id);
      const tb = to ? box.get(id) : undefined;
      if (!to || !fb || !tb) return [];
      const a = tall
        ? { x: fb.x + fb.w / 2, y: fb.y + NODE_H }
        : { x: fb.x + fb.w, y: fb.y + NODE_H / 2 };
      const b = tall
        ? { x: tb.x + tb.w / 2, y: tb.y }
        : { x: tb.x, y: tb.y + NODE_H / 2 };
      const c1 = tall
        ? { x: a.x, y: lerp(a.y, b.y, 0.55) }
        : { x: lerp(a.x, b.x, 0.55), y: a.y };
      const c2 = tall
        ? { x: b.x, y: lerp(a.y, b.y, 0.45) }
        : { x: lerp(a.x, b.x, 0.45), y: b.y };
      return [{ from: n, to, a, c1, c2, b }];
    }),
  );
  type Edge = (typeof edges)[number];
  const bez = (e: Edge, t: number): Pt => {
    const m = 1 - t;
    const k = (p: keyof Pt) =>
      m * m * m * e.a[p] +
      3 * m * m * t * e.c1[p] +
      3 * m * t * t * e.c2[p] +
      t * t * t * e.b[p];
    return { x: k("x"), y: k("y") };
  };

  const dropAt = (i: number) => B.node + i * B.nodeStep;
  const arriveAt = (d: number) => B.run + 4 + d * B.level;
  const checkAt = (d: number) => arriveAt(d) + 8;
  const runEnd = checkAt(maxDepth);
  const PUBLISH = runEnd + 12;

  const RUN_W = 88;
  const PUB_W = 112;
  const pubX = CW - 12 - PUB_W;
  const runX = pubX - 8 - RUN_W;
  const runPt = { x: runX + RUN_W / 2 + 4, y: BAR / 2 + 4 };
  const pubPt = { x: pubX + PUB_W / 2 + 8, y: BAR / 2 + 4 };
  const keys: Key[] = [
    { t: B.cursor, x: CW + 70, y: WIN.h * 0.62 },
    { t: B.run - 2, ...runPt },
    { t: runEnd, ...runPt },
    { t: PUBLISH - 2, ...pubPt },
    { t: PUBLISH + 18, ...pubPt },
    { t: PUBLISH + 42, x: pubPt.x - 70, y: pubPt.y + 120 },
  ];
  let cur: Pt = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame < a.t) break;
    const p = spring({
      frame: frame - a.t,
      fps,
      config: { mass: 0.9, damping: 22, stiffness: 140 },
      durationInFrames: b.t - a.t,
    });
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const arc = Math.sin(clamp(p) * Math.PI) * Math.min(42, d * 0.14);
    cur = {
      x: lerp(a.x, b.x, p) + (dy / d) * arc,
      y: lerp(a.y, b.y, p) - (dx / d) * arc,
    };
  }
  const pressAt = (at: number) => sp(at - 2, PRESS) - sp(at + 3, PRESS);
  const runPress = pressAt(B.run);
  const pubPress = pressAt(PUBLISH);
  const press = Math.max(runPress, pubPress);
  const cursorIn = interpolate(frame, [B.cursor, B.cursor + 8], [0, 1], {
    ...CL,
    easing: ENTER,
  });

  const win = sp(0, HEAVY);
  const winFade = interpolate(frame, [0, 12], [0, 1], { ...CL, easing: ENTER });
  const running = frame >= B.run && frame < runEnd + 2;
  const published = frame >= PUBLISH + 2;
  const pubS = sp(PUBLISH + 2, CARD);
  const toastS = sp(PUBLISH + 8, HEAVY);
  const toastFade = interpolate(frame, [PUBLISH + 8, PUBLISH + 18], [0, 1], {
    ...CL,
    easing: ENTER,
  });
  const cam = interpolate(frame, [0, 205], [1, 1.035], {
    ...CL,
    easing: CAMERA,
  });
  const headIn = interpolate(frame, [4, 20], [0, 1], { ...CL, easing: ENTER });

  const nodeEls = nodes.map((n, i) => {
    const bx = box.get(n.id);
    if (!bx) return null;
    const s = sp(dropAt(i), CARD);
    const o = interpolate(frame, [dropAt(i), dropAt(i) + 8], [0, 1], {
      ...CL,
      easing: ENTER,
    });
    const d = depth.get(n.id) ?? 0;
    const active = interpolate(
      frame,
      [arriveAt(d) - 1, arriveAt(d) + 4, checkAt(d), checkAt(d) + 6],
      [0, 1, 1, 0],
      { ...CL, easing: MOVE },
    );
    const chipOn = frame >= arriveAt(d);
    const done = frame >= checkAt(d);
    const chipS = sp(done ? checkAt(d) : arriveAt(d), CHIP);
    const draw = interpolate(frame, [checkAt(d) + 2, checkAt(d) + 10], [0, 1], {
      ...CL,
      easing: ENTER,
    });
    return (
      <div key={n.id}>
        <div
          style={{
            position: "absolute",
            left: bx.x,
            top: bx.y,
            width: bx.w,
            height: NODE_H,
            opacity: o,
            transform: `translateY(${(1 - s) * 18}px) scale(${0.94 + 0.06 * s})`,
            zIndex: 3,
          }}
        >
          <NodeCard node={n} pal={pal} accent={accent} active={active} />
        </div>
        {chipOn ? (
          <div
            style={{
              position: "absolute",
              left: bx.x + bx.w - 4,
              top: bx.y - 28,
              transform: `translateX(-100%) scale(${0.7 + 0.3 * chipS})`,
              transformOrigin: "100% 100%",
              opacity: clamp(chipS * 2),
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: mono.fontFamily,
              fontSize: 13,
              color: done ? pal.success : pal.muted,
              whiteSpace: "nowrap",
              zIndex: 3,
            }}
          >
            {done ? (
              <Check color={pal.success} size={14} draw={draw} />
            ) : (
              <Spinner
                color={accent}
                track={pal.rule}
                frame={frame}
                size={13}
              />
            )}
            {done ? n.duration : "running"}
          </div>
        ) : null}
      </div>
    );
  });

  const edgeEls = edges.map((e) => {
    const ti = nodes.indexOf(e.to);
    const fi = nodes.indexOf(e.from);
    const start = Math.max(dropAt(ti), dropAt(fi)) + 6;
    const draw = interpolate(frame, [start, start + 12], [0, 1], {
      ...CL,
      easing: MOVE,
    });
    const d0 = depth.get(e.from.id) ?? 0;
    const lit = interpolate(
      frame,
      [checkAt(d0), checkAt(d0) + B.travel],
      [0, 1],
      { ...CL, easing: MOVE },
    );
    const p = `M ${e.a.x} ${e.a.y} C ${e.c1.x} ${e.c1.y} ${e.c2.x} ${e.c2.y} ${e.b.x} ${e.b.y}`;
    return (
      <g key={`${e.from.id}-${e.to.id}`}>
        <path
          d={p}
          fill="none"
          stroke={pal.edge}
          strokeWidth={1.25}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - draw}
        />
        {lit > 0 ? (
          <path
            d={p}
            fill="none"
            stroke={accent}
            strokeWidth={1.75}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - lit}
          />
        ) : null}
        <circle
          cx={e.b.x}
          cy={e.b.y}
          r={3}
          fill={lit >= 1 ? accent : pal.card}
          stroke={lit >= 1 ? accent : pal.edge}
          strokeWidth={1.25}
          opacity={clamp((draw - 0.8) / 0.2)}
        />
      </g>
    );
  });

  const packets = edges.map((e) => {
    const d0 = depth.get(e.from.id) ?? 0;
    const t = (frame - checkAt(d0)) / B.travel;
    if (t < 0 || t > 1.25) return null;
    const pt = bez(e, MOVE(clamp(t)));
    const fade = interpolate(t, [0, 0.12, 1, 1.25], [0, 1, 1, 0], CL);
    return (
      <div
        key={`k-${e.to.id}`}
        style={{
          position: "absolute",
          left: pt.x - 5,
          top: pt.y - 5,
          width: 10,
          height: 10,
          borderRadius: 999,
          background: accent,
          boxShadow: `0 0 0 3px ${withAlpha(accent, 0.2)}, 0 0 14px ${withAlpha(accent, 0.6)}`,
          opacity: fade,
          zIndex: 4,
        }}
      />
    );
  });

  const btn: React.CSSProperties = {
    position: "absolute",
    top: (BAR - 34) / 2,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 15,
    boxSizing: "border-box",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill
      style={{
        fontFamily: hanken.fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "earthshine" : "glasswork")}
        params={
          groundParams ??
          (pal.dark || ground
            ? undefined
            : { colors: ["#b9c8ff", "#3552ff", "#1d2f9e", "#8fb0ff"] })
        }
        timeOffset={pal.dark ? 7 : 6}
        timeScale={0.4}
      />
      <div
        style={{
          position: "absolute",
          left: (width - SW * u) / 2,
          top: (height - SH * u) / 2,
          width: SW,
          height: SH,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
        }}
      >
        {tall ? (
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: 150,
              width: WIN.w,
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 18}px)`,
              color: pal.dark ? "#F2F3F5" : "#16181D",
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 300,
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
              }}
            >
              {title}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            opacity: winFade,
            transformOrigin: "50% 45%",
            transform: `translateY(${(1 - win) * 60}px) scale(${(0.96 + 0.04 * win) * cam})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              overflow: "hidden",
              background: pal.window,
              boxShadow: pal.depth,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                height: BAR,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 18px",
                boxShadow: `inset 0 -1px 0 ${pal.rule}`,
                fontSize: 15,
              }}
            >
              <span style={{ color: pal.muted }}>{workspace}</span>
              <span style={{ color: pal.faint }}>/</span>
              <span style={{ color: pal.text }}>
                {tall ? "Workflows" : title}
              </span>
              <div
                style={{
                  position: "relative",
                  height: 24,
                  padding: "0 9px",
                  borderRadius: 7,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: published
                    ? withAlpha(pal.success, 0.12)
                    : pal.pill,
                  color: published ? pal.success : pal.muted,
                  transform: `scale(${published ? 0.9 + 0.1 * pubS : 1})`,
                }}
              >
                {published ? (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: pal.success,
                    }}
                  />
                ) : null}
                {published ? "Live" : "Draft"}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: BAR,
                right: 0,
                bottom: 0,
                background: pal.canvas,
                backgroundImage: `radial-gradient(circle, ${pal.dot} 1px, transparent 1.4px)`,
                backgroundSize: "22px 22px",
              }}
            >
              <svg
                width={CW}
                height={CH}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  overflow: "visible",
                }}
              >
                {edgeEls}
              </svg>
              {packets}
              {nodeEls}
              {frame >= PUBLISH + 8 ? (
                <div
                  style={{
                    position: "absolute",
                    left: CW / 2,
                    top: CH - 64,
                    transform: `translateX(-50%) translateY(${(1 - toastS) * 26}px)`,
                    opacity: toastFade,
                    height: 40,
                    padding: "0 16px 0 12px",
                    borderRadius: 12,
                    background: pal.dark ? "#1E2128" : "#1B1A18",
                    color: "#F4F3F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontSize: 15,
                    boxShadow: pal.dark
                      ? "0 0 0 1px rgba(255,255,255,0.1), 0 16px 32px -12px rgba(0,0,0,0.6)"
                      : "0 16px 32px -12px rgba(20,18,14,0.35), 0 4px 10px -4px rgba(20,18,14,0.2)",
                    whiteSpace: "nowrap",
                    zIndex: 10,
                  }}
                >
                  <Check
                    color="#5BE39B"
                    size={16}
                    draw={interpolate(
                      frame,
                      [PUBLISH + 14, PUBLISH + 24],
                      [0, 1],
                      { ...CL, easing: ENTER },
                    )}
                  />
                  {toast}
                </div>
              ) : null}
            </div>
          </div>
          <div
            style={{
              ...btn,
              left: runX,
              width: RUN_W,
              background: pal.card,
              boxShadow: pal.cardDepth,
              color: pal.text,
              transform: `scale(${1 - 0.04 * runPress})`,
            }}
          >
            {running ? (
              <Spinner color={accent} track={pal.rule} frame={frame} />
            ) : (
              <svg width={11} height={11} viewBox="0 0 12 12">
                <path
                  d="M3 1.8v8.4L10 6z"
                  fill="none"
                  stroke={pal.text}
                  strokeWidth={1.3}
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {running ? "Running" : "Run"}
          </div>
          <div
            style={{
              ...btn,
              left: pubX,
              width: PUB_W,
              background: accent,
              color: "#fff",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px ${withAlpha(accent, 0.4)}, 0 6px 14px -6px ${withAlpha(accent, 0.6)}`,
              transform: `scale(${1 - 0.04 * pubPress})`,
            }}
          >
            {published ? (
              <Check color="#fff" size={14} draw={clamp(pubS * 1.4)} />
            ) : null}
            {published ? "Published" : "Publish"}
          </div>
          <div
            style={{
              position: "absolute",
              left: cur.x - 2,
              top: cur.y - 2,
              opacity: cursorIn,
              zIndex: 50,
            }}
          >
            <Cursor press={press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
