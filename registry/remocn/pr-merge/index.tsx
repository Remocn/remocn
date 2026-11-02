"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PrCheck {
  name: string;
  workflow?: string;
  /** Run time shown once the check passes, in seconds. */
  seconds?: number;
}

export interface PrMergeProps {
  repo?: string;
  title?: string;
  number?: number;
  author?: string;
  reviewer?: string;
  branch?: string;
  base?: string;
  commits?: number;
  checks?: (string | PrCheck)[];
  additions?: number;
  deletions?: number;
  mergeSha?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_CHECKS: PrCheck[] = [
  { name: "lint", workflow: "ci", seconds: 18 },
  { name: "typecheck", workflow: "ci", seconds: 41 },
  { name: "build", workflow: "ci", seconds: 72 },
  { name: "e2e", workflow: "playwright", seconds: 128 },
];

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const ramp = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number = ENTER,
) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing });
const flex = (gap: number, x?: React.CSSProperties): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap,
  ...x,
});

function rgb(color: string) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function withAlpha(color: string, alpha: number) {
  const c = rgb(color);
  return c ? `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})` : color;
}

const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ICONS: Record<string, string> = {
  pr: `${circ(6, 6, 2.4)}${circ(6, 18, 2.4)}${circ(18, 18, 2.4)}M6 8.4v7.2M18 15.6V9a2 2 0 00-2-2h-4M14 4.6L11.6 7 14 9.4`,
  merge: `${circ(6, 6, 2.4)}${circ(6, 18, 2.4)}${circ(18, 12, 2.4)}M6 8.4v7.2M6 8.4c0 2 1.6 3.6 3.6 3.6h6`,
  check: "M5.5 12.5l4 4L18.5 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  branch: `${circ(6, 6, 2.4)}${circ(6, 18, 2.4)}${circ(18, 7, 2.4)}M6 8.4v7.2M18 9.4c0 4-6 3-11 6.4`,
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12",
};

function Icon({
  name,
  size = 18,
  color,
  sw = 1.5,
}: {
  name: string;
  size?: number;
  color: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const PAL = {
  dark: {
    dark: true,
    card: "rgba(12,14,19,0.9)",
    text: "#ECEFF4",
    muted: "rgba(236,239,244,0.62)",
    faint: "rgba(236,239,244,0.32)",
    rule: "rgba(255,255,255,0.07)",
    green: "#45C08A",
    solid: "#ECEFF4",
    onSolid: "#0C0E13",
    ghost: "rgba(255,255,255,0.06)",
    ring: "rgba(255,255,255,0.1)",
    depth:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.09), 0 40px 90px -30px rgba(0,0,0,0.8)",
    scrim:
      "radial-gradient(80% 90% at 50% 40%, rgba(2,4,10,0.55), rgba(2,4,10,0.15))",
  },
  light: {
    dark: false,
    card: "#FFFFFF",
    text: "#15171C",
    muted: "rgba(21,23,28,0.6)",
    faint: "rgba(21,23,28,0.3)",
    rule: "rgba(0,0,0,0.07)",
    green: "#1F8A5B",
    solid: "#15171C",
    onSolid: "#FFFFFF",
    ghost: "rgba(0,0,0,0.04)",
    ring: "rgba(0,0,0,0.1)",
    depth:
      "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.06), 0 30px 60px -24px rgba(20,26,60,0.28)",
    scrim:
      "radial-gradient(80% 90% at 50% 40%, rgba(240,242,248,0.5), rgba(240,242,248,0.1))",
  },
};
type Pal = (typeof PAL)["dark"];

function Spinner({
  color,
  track,
  frame,
  size = 20,
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
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${frame * 14}deg)`, flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle
        cx={12}
        cy={12}
        r={8.5}
        fill="none"
        stroke={track}
        strokeWidth={1.75}
      />
      <path
        d="M12 3.5a8.5 8.5 0 018.5 8.5"
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={24}
      height={28}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        left: x - 2.4,
        top: y - 2.4,
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
      aria-hidden="true"
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

type Key = { t: number; x: number; y: number };
function pathAt(keys: Key[], f: number) {
  if (f <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.t) {
      const p = ENTER(clamp((f - a.t) / Math.max(1, b.t - a.t)));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(p * Math.PI) * Math.min(44, d * 0.16);
      return {
        x: lerp(a.x, b.x, p) + (-dy / d) * arc,
        y: lerp(a.y, b.y, p) + (dx / d) * arc,
      };
    }
  }
  return keys[keys.length - 1];
}

function Monogram({ name, c }: { name: string; c: Pal }) {
  return (
    <div
      style={flex(0, {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        flexShrink: 0,
        background: c.ghost,
        boxShadow: `inset 0 0 0 1px ${c.ring}`,
        fontSize: 16,
        color: c.muted,
      })}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function StatusGlyph({
  state,
  pop,
  frame,
  c,
}: {
  state: "queued" | "running" | "done";
  pop: number;
  frame: number;
  c: Pal;
}) {
  if (state === "running")
    return <Spinner color={c.text} track={c.rule} frame={frame} />;
  if (state === "queued")
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          boxShadow: `inset 0 0 0 1.5px ${c.faint}`,
          flexShrink: 0,
        }}
      />
    );
  return (
    <div
      style={flex(0, {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        background: c.green,
        flexShrink: 0,
        transform: `scale(${0.6 + 0.4 * pop})`,
      })}
    >
      <Icon name="check" size={14} color={c.onSolid} sw={2} />
    </div>
  );
}

export function PrMerge({
  repo = "remocn/remocn",
  title = "Add launch pack",
  number = 312,
  author = "maya-chen",
  reviewer = "leo-park",
  branch = "feat/launch-pack",
  base = "main",
  commits = 14,
  checks = DEFAULT_CHECKS,
  additions = 1248,
  deletions = 96,
  mergeSha = "3f2a9c1",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: PrMergeProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width * 1.2;
  const u = tall ? width / 640 : Math.min(width / 1280, height / 720);
  const dw = width / u;
  const dh = height / u;
  const c = theme === "dark" ? PAL.dark : PAL.light;
  const sp = (f: number, config: typeof CARD | typeof MORPH) =>
    spring({ frame: f, fps, config });
  const list = checks.map((k) => (typeof k === "string" ? { name: k } : k));
  const n = list.length;

  const starts = list.map((_, i) => 10 + i * 3);
  const dones = list.map((_, i) => 46 + i * 12);
  const allDone = (dones[n - 1] ?? 46) + 6;
  const T = {
    mergeClick: allDone + 22,
    confirmClick: allDone + 46,
    merged: allDone + 56,
  };
  const passed = dones.filter((d) => frame >= d).length;
  const ok = frame >= allDone;
  const enable = sp(frame - allDone, CHIP);
  const confirmP = sp(frame - T.mergeClick - 1, CARD);
  const merging = frame >= T.confirmClick + 1 && frame < T.merged;
  const isMerged = frame >= T.merged;
  const collapse = spring({
    frame: frame - T.merged,
    fps,
    config: MORPH,
    durationInFrames: 22,
  });
  const mergedIn = sp(frame - T.merged - 6, CARD);
  const statusP = sp(frame - T.merged - 2, CHIP);

  const ROW = 54;
  const HEAD = 72;
  const SUM = 58;
  const FOOT = 92;
  const rowsH = n * ROW + 8;
  const cardW = tall ? 576 : 588;
  const cardH = HEAD + SUM + rowsH * (1 - collapse) + FOOT;

  const leftW = tall ? 576 : 440;
  const leftH = 300;
  const cardX = tall ? (dw - cardW) / 2 : dw - 96 - cardW;
  const cardY = tall
    ? (dh - leftH - 40 - cardH) / 2 + leftH + 40
    : (dh - cardH) / 2;
  const leftX = tall ? cardX : 96;
  const leftY = tall ? cardY - leftH - 40 : (dh - leftH) / 2;

  const enterCard = sp(frame - 4, HEAVY);
  const L = (k: number) => ramp(frame, k * 3, 16);

  const footY = cardY + HEAD + SUM + rowsH;
  const mergeBtn = { x: cardX + cardW - 24 - 62, y: footY + FOOT / 2 };
  const confirmBtn = { x: cardX + cardW - 24 - 82, y: footY + FOOT / 2 };
  const deleteBtn = { x: cardX + cardW - 24 - 70, y: footY + FOOT / 2 };
  const keys: Key[] = [
    { t: allDone - 14, x: dw * 0.92, y: dh * 0.98 },
    { t: T.mergeClick - 4, ...mergeBtn },
    { t: T.mergeClick + 8, ...mergeBtn },
    { t: T.confirmClick - 4, ...confirmBtn },
    { t: T.merged + 8, ...confirmBtn },
    { t: T.merged + 34, x: deleteBtn.x + 40, y: deleteBtn.y + 70 },
  ];
  const cur = pathAt(keys, frame);
  const curOpacity = ramp(frame, allDone - 14, 8);
  const pressAt = (k: number) => {
    if (frame < k - 4) return 0;
    if (frame < k) return ramp(frame, k - 4, 4, MOVE);
    return clamp(1 - sp(frame - k, CHIP), -0.3, 1);
  };
  const press = Math.max(pressAt(T.mergeClick), pressAt(T.confirmClick));
  const push = interpolate(frame, [0, 210], [1, 1.03], CL);

  const footA = 1 - ramp(frame, T.mergeClick + 1, 7, EXIT);
  const footB = confirmP * (1 - ramp(frame, T.merged, 7, EXIT));
  const btn = (solid: boolean): React.CSSProperties =>
    flex(8, {
      height: 44,
      padding: "0 18px",
      borderRadius: 12,
      fontSize: 17,
      background: solid ? c.solid : c.ghost,
      color: solid ? c.onSolid : c.text,
      boxShadow: solid ? undefined : `inset 0 0 0 1px ${c.ring}`,
      whiteSpace: "nowrap",
    });
  const summary = isMerged
    ? `${n} checks passed`
    : ok
      ? `All ${n} checks passed`
      : `${passed} of ${n} checks passed`;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (c.dark ? "earthshine" : "glasswork")}
        params={groundParams}
        timeOffset={c.dark ? 2 : 4}
        timeScale={0.35}
      />
      <AbsoluteFill style={{ background: c.scrim }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dw,
          height: dh,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
          color: c.text,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: leftX,
              top: leftY,
              width: leftW,
            }}
          >
            <div
              style={flex(10, {
                fontFamily: monoFamily,
                fontSize: 17,
                color: c.muted,
                opacity: L(0),
                transform: `translateY(${(1 - L(0)) * 14}px)`,
              })}
            >
              <span>{repo}</span>
              <span style={{ color: c.faint }}>#{number}</span>
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: tall ? 64 : 58,
                fontWeight: 300,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                opacity: L(1),
                transform: `translateY(${(1 - L(1)) * 22}px)`,
              }}
            >
              {title}
            </div>
            <div
              style={{
                position: "relative",
                marginTop: 22,
                height: 28,
                opacity: L(2),
                transform: `translateY(${(1 - L(2)) * 14}px)`,
              }}
            >
              {[false, true].map((m) => {
                const on = m ? statusP : 1 - ramp(frame, T.merged, 6, EXIT);
                if (on <= 0.001) return null;
                return (
                  <div
                    key={String(m)}
                    style={flex(10, {
                      position: "absolute",
                      left: 0,
                      top: 0,
                      fontSize: 19,
                      whiteSpace: "nowrap",
                      opacity: clamp(on),
                      transform: `translateY(${(1 - on) * (m ? 12 : -8)}px)`,
                    })}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        background: m ? accent : c.green,
                        boxShadow: `0 0 0 4px ${withAlpha(m ? accent : c.green, 0.18)}`,
                        transform: `scale(${m ? 0.5 + 0.5 * statusP : 1})`,
                      }}
                    />
                    <span style={{ color: c.text }}>
                      {m ? "Merged" : "Open"}
                    </span>
                    <span style={{ color: c.muted }}>
                      {m
                        ? `${author} merged ${commits} commits`
                        : `${author} wants to merge ${commits} commits`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              style={flex(10, {
                marginTop: 14,
                fontFamily: monoFamily,
                fontSize: 17,
                color: c.muted,
                opacity: L(3),
                transform: `translateY(${(1 - L(3)) * 14}px)`,
              })}
            >
              <Icon name="branch" size={18} color={c.muted} />
              <span>{branch}</span>
              <Icon name="arrow" size={16} color={c.faint} />
              <span style={{ color: c.text }}>{base}</span>
            </div>
            <div
              style={flex(16, {
                marginTop: 28,
                paddingTop: 18,
                boxShadow: `inset 0 1px 0 ${c.rule}`,
                fontFamily: monoFamily,
                fontSize: 17,
                fontVariantNumeric: "tabular-nums",
                color: c.muted,
                opacity: L(4),
                transform: `translateY(${(1 - L(4)) * 14}px)`,
              })}
            >
              <span style={{ color: c.green }}>+{fmt(additions)}</span>
              <span style={{ color: c.muted }}>−{fmt(deletions)}</span>
              <span style={{ color: c.faint }}>·</span>
              <span>23 files</span>
              <span style={{ color: c.faint }}>·</span>
              <span>{commits} commits</span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              borderRadius: 22,
              background: c.card,
              backdropFilter: c.dark ? "blur(28px)" : undefined,
              boxShadow: c.depth,
              overflow: "hidden",
              opacity: ramp(frame, 4, 10),
              transform: `translateY(${(1 - enterCard) * 48}px) scale(${0.97 + 0.03 * enterCard})`,
              transformOrigin: "50% 0%",
            }}
          >
            <div
              style={flex(14, {
                height: HEAD,
                padding: "0 24px",
                boxShadow: `inset 0 -1px 0 ${c.rule}`,
                fontSize: 17,
              })}
            >
              <Monogram name={reviewer} c={c} />
              <span>{reviewer}</span>
              <span style={{ color: c.muted }}>approved these changes</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: monoFamily,
                  fontSize: 16,
                  color: c.faint,
                }}
              >
                18m
              </span>
            </div>
            <div
              style={flex(14, {
                height: SUM,
                padding: "0 24px",
                fontSize: 17,
              })}
            >
              <StatusGlyph
                state={ok ? "done" : "running"}
                pop={enable}
                frame={frame}
                c={c}
              />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {summary}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 16,
                  color: c.muted,
                }}
              >
                No conflicts with {base}
              </span>
            </div>
            <div
              style={{
                height: rowsH * (1 - collapse),
                overflow: "hidden",
                opacity: 1 - ramp(frame, T.merged, 8, EXIT),
              }}
            >
              {list.map((k, i) => {
                const state =
                  frame >= dones[i]
                    ? "done"
                    : frame >= starts[i]
                      ? "running"
                      : "queued";
                const rowIn = ramp(frame, 8 + i * 3, 14);
                return (
                  <div
                    key={k.name}
                    style={flex(14, {
                      height: ROW,
                      margin: "0 12px",
                      padding: "0 12px",
                      borderRadius: 12,
                      background: i % 2 === 0 ? c.ghost : "transparent",
                      opacity: rowIn,
                      transform: `translateY(${(1 - rowIn) * 12}px)`,
                    })}
                  >
                    <StatusGlyph
                      state={state}
                      pop={sp(frame - dones[i], CHIP)}
                      frame={frame}
                      c={c}
                    />
                    <span style={{ fontFamily: monoFamily, fontSize: 17 }}>
                      {k.name}
                    </span>
                    <span style={{ fontSize: 16, color: c.faint }}>
                      {k.workflow ?? "ci"}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: monoFamily,
                        fontSize: 16,
                        color: state === "done" ? c.muted : c.faint,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {state === "done"
                        ? `${k.seconds ?? 20 + i * 17}s`
                        : state === "running"
                          ? "running"
                          : "queued"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                position: "relative",
                height: FOOT,
                boxShadow: `inset 0 1px 0 ${c.rule}`,
              }}
            >
              {footA > 0.001 && (
                <div
                  style={flex(12, {
                    position: "absolute",
                    inset: 0,
                    padding: "0 24px",
                    opacity: footA,
                    transform: `translateY(${(1 - footA) * -10}px)`,
                    fontSize: 17,
                    color: c.muted,
                  })}
                >
                  <span>
                    Squash {commits} commits into {base}
                  </span>
                  <div
                    style={{
                      ...btn(true),
                      marginLeft: "auto",
                      opacity: 0.35 + 0.65 * clamp(enable),
                      transform: `scale(${(0.96 + 0.04 * enable) * (1 - 0.04 * pressAt(T.mergeClick))})`,
                    }}
                  >
                    <Icon name="merge" size={18} color={c.onSolid} />
                    Merge
                  </div>
                </div>
              )}
              {footB > 0.001 && (
                <div
                  style={flex(10, {
                    position: "absolute",
                    inset: 0,
                    padding: "0 24px",
                    opacity: clamp(footB),
                    transform: `translateY(${(1 - footB) * 16}px)`,
                    fontSize: 17,
                  })}
                >
                  <span style={{ color: c.text }}>Merge into {base}?</span>
                  <div style={{ ...btn(false), marginLeft: "auto" }}>
                    Cancel
                  </div>
                  <div
                    style={{
                      ...btn(true),
                      background: accent,
                      color: "#FFFFFF",
                      transform: `scale(${1 - 0.04 * pressAt(T.confirmClick)})`,
                    }}
                  >
                    {merging ? (
                      <Spinner
                        color="#FFFFFF"
                        track="rgba(255,255,255,0.3)"
                        frame={frame}
                        size={18}
                      />
                    ) : null}
                    {merging ? "Merging" : "Confirm merge"}
                  </div>
                </div>
              )}
              {isMerged && (
                <div
                  style={flex(14, {
                    position: "absolute",
                    inset: 0,
                    padding: "0 24px",
                    opacity: clamp(mergedIn * 1.4),
                    transform: `translateY(${(1 - mergedIn) * 18}px)`,
                    fontSize: 17,
                  })}
                >
                  <div
                    style={flex(0, {
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      justifyContent: "center",
                      background: accent,
                      flexShrink: 0,
                      transform: `scale(${0.6 + 0.4 * statusP})`,
                    })}
                  >
                    <Icon name="merge" size={18} color="#FFFFFF" />
                  </div>
                  <div>
                    <div>Merged into {base}</div>
                    <div
                      style={{
                        marginTop: 2,
                        fontFamily: monoFamily,
                        fontSize: 16,
                        color: c.muted,
                      }}
                    >
                      {mergeSha} · just now
                    </div>
                  </div>
                  <div style={{ ...btn(false), marginLeft: "auto" }}>
                    <Icon name="trash" size={18} color={c.muted} />
                    Delete branch
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ opacity: curOpacity }}>
            <Cursor x={cur.x} y={cur.y} press={press} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
