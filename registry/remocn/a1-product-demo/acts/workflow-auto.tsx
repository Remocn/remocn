"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
} from "../foundation";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type NodeSpec = {
  key: string;
  label: string;
  count?: string;
  x: number;
  y: number;
  delay: number;
  yellow?: boolean;
};

const AI_X = 960;
const AI_Y = 560;
const TOP_Y = 384;
const BOTTOM_Y = 744;

const NODES: NodeSpec[] = [
  { key: "todo", label: "To do", count: "8", x: 660, y: TOP_Y, delay: 0 },
  {
    key: "progress",
    label: "In Progress",
    count: "5",
    x: 960,
    y: TOP_Y,
    delay: 5,
  },
  { key: "done", label: "Done", count: "14", x: 1260, y: TOP_Y, delay: 10 },
  { key: "ai", label: "AI Layer", x: AI_X, y: AI_Y, delay: 16, yellow: true },
  { key: "deadlines", label: "Deadlines", x: 792, y: BOTTOM_Y, delay: 22 },
  { key: "deps", label: "Dependencies", x: 1128, y: BOTTOM_Y, delay: 27 },
];

type Connector = { key: string; x1: number; y1: number; x2: number; y2: number; delay: number };

const CONNECTORS: Connector[] = [
  { key: "c-todo", x1: 660, y1: TOP_Y, x2: AI_X, y2: AI_Y, delay: 34 },
  { key: "c-progress", x1: 960, y1: TOP_Y, x2: AI_X, y2: AI_Y, delay: 37 },
  { key: "c-done", x1: 1260, y1: TOP_Y, x2: AI_X, y2: AI_Y, delay: 40 },
  { key: "c-dead", x1: AI_X, y1: AI_Y, x2: 792, y2: BOTTOM_Y, delay: 44 },
  { key: "c-deps", x1: AI_X, y1: AI_Y, x2: 1128, y2: BOTTOM_Y, delay: 47 },
];

function Sparkle({ size = 18, color = FLOW_YELLOW }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2 C12.8 8.4 15.6 11.2 22 12 C15.6 12.8 12.8 15.6 12 22 C11.2 15.6 8.4 12.8 2 12 C8.4 11.2 11.2 8.4 12 2 Z"
        fill={color}
      />
    </svg>
  );
}

function GraphNode({ spec }: { spec: NodeSpec }) {
  return (
    <div
      style={{
        background: spec.yellow ? FLOW_YELLOW : "#FFFFFF",
        border: `1px solid ${spec.yellow ? FLOW_YELLOW : FLOW_BORDER}`,
        borderRadius: 12,
        padding: spec.yellow ? "14px 28px" : "12px 22px",
        boxShadow: spec.yellow
          ? "0 12px 30px rgba(242,210,0,0.28)"
          : "0 8px 22px rgba(30,28,22,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        whiteSpace: "nowrap",
        fontFamily: FONT,
      }}
    >
      {spec.yellow ? <Sparkle size={20} color={FLOW_INK} /> : null}
      <span
        style={{
          color: FLOW_INK,
          fontSize: spec.yellow ? 26 : 24,
          fontWeight: spec.yellow ? 700 : 600,
        }}
      >
        {spec.label}
      </span>
      {spec.count ? (
        <span style={{ color: FLOW_MUTED, fontSize: 20, fontWeight: 500 }}>
          ×{spec.count}
        </span>
      ) : null}
    </div>
  );
}

export function WorkflowAuto({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const headerReveal = interpolate(f, [0, 12], [0, 1], clamp);
  const headerShift = interpolate(headerReveal, [0, 1], [16, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: FLOW_BG, fontFamily: FONT }}>
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: headerReveal,
          transform: `translateY(${headerShift}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkle size={18} />
          <span
            style={{
              color: FLOW_MUTED,
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Workflow AI
          </span>
        </div>
        <h2
          style={{
            margin: 0,
            color: FLOW_INK,
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Work flows automatically, stage by stage
        </h2>
      </div>

      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {CONNECTORS.map((c) => {
          const p = interpolate(f, [c.delay, c.delay + 14], [0, 1], clamp);
          return (
            <line
              key={c.key}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke="rgba(30,28,22,0.16)"
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
          );
        })}
      </svg>

      {NODES.map((spec) => {
        const pop = spring({
          frame: f - spec.delay,
          fps,
          config: { damping: 14, stiffness: 150 },
        });
        const scale = interpolate(pop, [0, 1], [0.6, 1]);
        return (
          <div
            key={spec.key}
            style={{
              position: "absolute",
              left: spec.x,
              top: spec.y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center",
              opacity: pop,
            }}
          >
            <GraphNode spec={spec} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
