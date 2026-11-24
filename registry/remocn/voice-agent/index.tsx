"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_TURNS,
  planVoiceTurns,
  turnWords,
  type VoiceAgentElementId,
  voiceAgentTimeline,
} from "./timeline";

const hankenFont = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const monoFont = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const hanken = hankenFont.fontFamily;
const mono = monoFont.fontFamily;

export interface VoiceToolCall {
  /** Function name listed in the call panel, e.g. "book_table". */
  name?: string;
  /** Shown while the call runs, e.g. "Booking table at Fernway". */
  pending: string;
  /** Shown once it resolves, e.g. "Booked table at Fernway". */
  done: string;
  /** Secondary detail after a middot, e.g. "7:30 pm, party of 4". */
  detail?: string;
  /** Result tag on the right once resolved, e.g. "FW-2841". */
  result?: string;
}

export interface VoiceTurn {
  speaker: "agent" | "caller";
  text: string;
  /** Word count after which the other side cuts in. The turn ends with an em dash. */
  interruptedAfter?: number;
  /** Tool call fired at the end of this turn. */
  tool?: VoiceToolCall;
}

export interface VoiceSummaryRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface VoiceAgentProps {
  agentName?: string;
  agentRole?: string;
  callerName?: string;
  callerLine?: string;
  turns?: VoiceTurn[];
  summaryTitle?: string;
  summaryStatus?: string;
  summary?: VoiceSummaryRow[];
  /** Seconds already on the call clock when the clip starts. */
  startSeconds?: number;
  /** Label of the red button while the call is live. */
  endLabel?: string;
  /** Frames between spoken words; punctuation adds a short pause on top. */
  stagger?: number;
  theme?: "light" | "dark";
  accent?: string;
  /** Text color of the transcript and labels; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Size of the call window, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the call window, each turn, word and tool
   * call, the hang-up and the summary, by the ids in `./timeline`. Frames on
   * the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<VoiceAgentElementId>;
}

const DEFAULT_SUMMARY: VoiceSummaryRow[] = [
  { label: "Guest", value: "Maya Chen · party of 4" },
  { label: "When", value: "Sat, Oct 26 · 7:30 pm" },
  { label: "Seating", value: "Patio" },
  { label: "Note", value: "Birthday, bring a candle" },
  { label: "Confirmation", value: "FW-2841", mono: true },
];

const ICONS = {
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3",
  volume: "M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
  grid: "M5 5h.01M12 5h.01M19 5h.01M5 12h.01M12 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01",
  calendar:
    "M8 2.5v3.5M16 2.5v3.5M3.5 9.5h17M5.5 4.5h13a2 2 0 0 1 2 2v12.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z",
  check: "M20 6.5 9.5 17 4 11.5",
  download:
    "M12 3.5v11M7.5 10 12 14.5l4.5-4.5M4 16v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V16",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  chevron: "M9 6l6 6-6 6",
  phone:
    "M21 16.4v2.8a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.2 1.9 1.9 0 0 1 4 2h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.8 9.5a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.9z",
  sms: "M4 5.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4.5 3.5v-3.5H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z",
} as const;
type IconName = keyof typeof ICONS;

const BARS = 30;
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const tween = (f: number, a: number, b: number, easing = ENTER) =>
  interpolate(f, [a, b], [0, 1], { ...clampX, easing });

interface Pal {
  win: string;
  side: string;
  hair: string;
  text: string;
  muted: string;
  faint: string;
  idle: string;
  callerBar: string;
  green: string;
  red: string;
  shadow: string;
  card: string;
  cardShadow: string;
  scrim: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        win: "#0f1211",
        side: "#131716",
        hair: "rgba(255,255,255,0.07)",
        text: "#eceeed",
        muted: "#9ba3a0",
        faint: "#67706d",
        idle: "rgba(255,255,255,0.12)",
        callerBar: "#eceeed",
        green: "#45d39a",
        red: "#e5484d",
        shadow:
          "0 0 0 1px rgba(255,255,255,0.09), 0 40px 90px -20px rgba(0,0,0,0.7)",
        card: "#161a19",
        cardShadow: "0 0 0 1px rgba(255,255,255,0.08)",
        scrim: "rgba(1,6,5,0.28)",
        dark: true,
      }
    : {
        win: "#ffffff",
        side: "#f7f8f7",
        hair: "rgba(16,24,20,0.08)",
        text: "#141a17",
        muted: "#5d6662",
        faint: "#929a96",
        idle: "rgba(16,24,20,0.12)",
        callerBar: "#27302c",
        green: "#13894f",
        red: "#e5484d",
        shadow:
          "0 0 0 1px rgba(16,24,20,0.06), 0 2px 4px rgba(16,24,20,0.04), 0 30px 70px -20px rgba(10,60,45,0.28)",
        card: "#ffffff",
        cardShadow:
          "0 0 0 1px rgba(16,24,20,0.07), 0 1px 3px rgba(16,24,20,0.05), 0 8px 20px -10px rgba(16,24,20,0.12)",
        scrim: "rgba(240,246,243,0.22)",
        dark: false,
      };
}

function Icon({
  name,
  color,
  size = 18,
  stroke = 1.75,
  style,
}: {
  name: IconName;
  color: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: "block", ...style }}
      aria-hidden
    >
      <path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={name === "grid" || name === "more" ? 3 : stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({
  color,
  size,
  frame,
}: {
  color: string;
  size: number;
  frame: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block", transform: `rotate(${frame * 18}deg)` }}
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={2}
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Lane({
  label,
  state,
  lvl,
  seed,
  frame,
  color,
  pal,
  barsH,
}: {
  label: string;
  state: string;
  lvl: number;
  seed: number;
  frame: number;
  color: string;
  pal: Pal;
  barsH: number;
}) {
  const active = lvl > 0.04;
  return (
    <div style={{ padding: "18px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 18, color: pal.text }}>{label}</div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 16,
            color: active ? color : pal.faint,
          }}
        >
          {state}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          height: barsH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: BARS }, (_, i) => {
          const c = (i - (BARS - 1) / 2) / (BARS / 2);
          const shape = 0.35 + 0.65 * Math.exp(-c * c * 1.6);
          const n = noise(seed + i, frame / 1.7 + i * 0.37);
          const h = 4 + (barsH - 4) * lvl * shape * (0.12 + 0.88 * n ** 1.4);
          const on = interpolate(lvl, [0, 0.12], [0, 1], clampX);
          return (
            <div
              key={i}
              style={{
                width: 4,
                height: h,
                borderRadius: 2,
                background: on > 0.5 ? color : pal.idle,
                opacity: on > 0.5 ? 0.5 + 0.5 * shape : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/**
 * A row that opens from nothing to its own height. It is laid out fully open
 * all its life: `ride` is the px it sits off its place, `hide` the px of its
 * bottom still to open, `moving` whether the ride changes on this frame and
 * `shut` whether nothing of it shows yet.
 */
function Grow({
  ride,
  hide,
  moving,
  shut,
  children,
}: {
  ride: number;
  hide: number;
  moving: boolean;
  shut: boolean;
  children: React.ReactNode;
}) {
  const glide = useGlide();
  return (
    <div style={{ display: "grid", gridTemplateRows: "1fr" }}>
      <div
        style={{
          minHeight: 0,
          overflow: "hidden",
          transform: `translateY(${Math.abs(ride) > 1e-3 ? ride : 0}px)${glide(moving)}`,
          clipPath: hide > 1e-3 ? `inset(0 0 ${hide}px 0)` : undefined,
          visibility: shut ? "hidden" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Top padding of the transcript list. */
const LIST_PAD = 14;

/** Content height layout gave a box, in px: unrounded, and no transform reaches it. */
function contentHeight(el: Element) {
  const s = getComputedStyle(el);
  const px = (v: string) => Number.parseFloat(v) || 0;
  const frame =
    px(s.paddingTop) +
    px(s.paddingBottom) +
    px(s.borderTopWidth) +
    px(s.borderBottomWidth);
  return px(s.height) - (s.boxSizing === "border-box" ? frame : 0);
}

function ToolRow({
  tool,
  el,
  frame,
  pal,
  accent,
  held,
}: {
  tool: VoiceToolCall;
  el: El;
  frame: number;
  pal: Pal;
  accent: string;
  /** The window holds still, so this row carries its own tilt. */
  held: boolean;
}) {
  const glide = useGlide();
  const start = el.start;
  const done = el.end;
  const inP = tween(frame, start, start + el.beat("in"));
  const swap = tween(frame, done, done + el.beat("swap"), MOVE);
  const ok = spring({
    frame: frame - done,
    fps: 30,
    config: CHIP,
  });
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 28,
        fontSize: 16,
        color: pal.muted,
        whiteSpace: "nowrap",
        opacity: inP,
        transform: `translateY(${(1 - inP) * 8}px)${glide(held && midway(inP))}`,
      }}
    >
      <div style={{ position: "relative", width: 18, height: 18 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
          <Spinner color={accent} size={18} frame={frame} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: swap,
            transform: `scale(${Math.max(0, ok)})`,
          }}
        >
          <Icon name="check" color={pal.green} size={18} stroke={2} />
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ opacity: 1 - swap }}>{tool.pending}</span>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: swap,
            color: pal.text,
          }}
        >
          {tool.done}
        </span>
      </div>
      {tool.detail ? (
        <span style={{ color: pal.faint }}>· {tool.detail}</span>
      ) : null}
      {tool.result ? (
        <span
          style={{
            fontFamily: mono,
            fontSize: 15.5,
            color: pal.green,
            opacity: swap,
            transform: `translateX(${(1 - swap) * -6}px)`,
          }}
        >
          {tool.result}
        </span>
      ) : null}
    </div>
  );
}

function TurnRow({
  p,
  frame,
  pal,
  accent,
  agentName,
  callerName,
  startSeconds,
  held,
}: {
  p: TurnPlan;
  frame: number;
  pal: Pal;
  accent: string;
  agentName: string;
  callerName: string;
  startSeconds: number;
  held: boolean;
}) {
  const agent = p.turn.speaker === "agent";
  const cut = p.turn.interruptedAfter
    ? tween(frame, p.end - p.el.beat("cut"), p.end + p.el.beat("cutIn"))
    : 0;
  return (
    <div style={{ display: "flex", gap: 18, padding: "11px 0" }}>
      <div
        style={{
          width: 52,
          flexShrink: 0,
          fontFamily: mono,
          fontSize: 15.5,
          lineHeight: "26px",
          color: pal.faint,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {clock(startSeconds + p.start / 30)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            fontSize: 16,
            lineHeight: "26px",
          }}
        >
          <span style={{ color: agent ? accent : pal.muted }}>
            {agent ? agentName : callerName}
          </span>
          {p.turn.interruptedAfter && cut > 0 ? (
            <span style={{ color: pal.faint, opacity: cut }}>interrupted</span>
          ) : null}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 19,
            lineHeight: 1.45,
            color: pal.text,
            textWrap: "pretty",
          }}
        >
          {p.words.map((w, k) => {
            const o = tween(
              frame,
              p.wordAt[k],
              p.wordAt[k] + p.wordEls[k].beat("fade"),
            );
            return (
              <span
                key={k}
                style={{ opacity: 0.15 + 0.85 * o, color: pal.text }}
              >
                {w}
                {k < p.words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
        {p.turn.tool && p.toolEl ? (
          <ToolRow
            tool={p.turn.tool}
            el={p.toolEl}
            frame={frame}
            pal={pal}
            accent={accent}
            held={held}
          />
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  rows,
  title,
  status,
  el,
  frame,
  fps,
  pal,
  callerLine,
  held,
}: {
  rows: VoiceSummaryRow[];
  title: string;
  status: string;
  el: El;
  frame: number;
  fps: number;
  pal: Pal;
  callerLine: string;
  /** The window holds still, so the card carries its own tilt. */
  held: boolean;
}) {
  const glide = useGlide();
  const at = el.start;
  const inAt = (f: number) => spring({ frame: f - at, fps, config: CARD });
  const inP = inAt(frame);
  const settling =
    Math.abs(inAt(frame + 1) - inP) * 24 > 5e-4 ||
    Math.abs(inP - inAt(frame - 1)) * 24 > 5e-4;
  return (
    <div style={{ padding: "8px 2px 4px" }}>
      <div
        style={{
          borderRadius: 14,
          background: pal.card,
          boxShadow: pal.cardShadow,
          opacity: Math.min(1, inP * 1.6),
          transform: `translateY(${(1 - inP) * 24}px)${glide(held && settling)}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            padding: "14px 20px 12px",
            borderBottom: `1px solid ${pal.hair}`,
          }}
        >
          <span style={{ fontSize: 18, color: pal.text }}>{title}</span>
          <span style={{ fontSize: 16, color: pal.green }}>{status}</span>
        </div>
        <div style={{ padding: "8px 20px" }}>
          {rows.map((r, i) => {
            const a = tween(
              frame,
              at + el.beat("row") + i * el.beat("stagger"),
              at + el.beat("rowIn") + i * el.beat("stagger"),
            );
            return (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  fontSize: 16,
                  opacity: a,
                  transform: `translateY(${(1 - a) * 6}px)${glide(held && !settling && midway(a))}`,
                }}
              >
                <span style={{ width: 132, color: pal.faint }}>{r.label}</span>
                <span
                  style={{
                    color: pal.text,
                    fontFamily: r.mono ? mono : undefined,
                    fontSize: r.mono ? 15.5 : 16,
                  }}
                >
                  {r.value}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            padding: "11px 20px 13px",
            borderTop: `1px solid ${pal.hair}`,
            fontSize: 16,
            color: pal.muted,
            opacity: tween(
              frame,
              at + el.beat("foot") + rows.length * el.beat("stagger"),
              at + el.beat("footIn") + rows.length * el.beat("stagger"),
            ),
          }}
        >
          Confirmation texted to {callerLine}
        </div>
      </div>
    </div>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function VoiceAgent(props: VoiceAgentProps) {
  const {
    agentName = "Ava",
    agentRole = "Fernway concierge",
    callerName = "Maya Chen",
    callerLine = "+1 (415) ••• 0192",
    turns = DEFAULT_TURNS,
    summaryTitle = "Call summary",
    summaryStatus = "Booked",
    summary = DEFAULT_SUMMARY,
    startSeconds = 41,
    endLabel = "End call",
    theme = "light",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = hanken,
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    voiceAgentTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const tall = height > width;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(width / DW, height / DH);
  const themePal = palette(theme);
  const pal = ink === undefined ? themePal : { ...themePal, text: ink };
  const callEl = tl.get("call");
  const panelEl = tl.get("panel");
  const hangup = tl.get("hangup");
  const summaryEl = tl.get("summary");
  const plan = {
    turns: turns.map((turn, i): TurnPlan => {
      const el = tl.get(`turn:${i}`);
      const words = turnWords(turn);
      const wordEls = words.map((_, k) => tl.get(`word:${i}:${k}`));
      const toolEl = turn.tool ? tl.get(`tool:${i}`) : undefined;
      return {
        turn,
        words,
        wordAt: wordEls.map((w) => w.start),
        start: el.start,
        end: el.end,
        toolStart: toolEl?.start ?? -1,
        toolDone: toolEl?.end ?? -1,
        el,
        wordEls,
        toolEl,
      };
    }),
    callEnd: hangup.start,
    summaryAt: summaryEl.start,
  };
  const ended = tween(
    frame,
    plan.callEnd,
    plan.callEnd + hangup.beat("close"),
    MOVE,
  );
  const callSec = startSeconds + Math.min(frame, plan.callEnd) / 30;
  const winAt = (f: number) =>
    spring({ frame: f - callEl.start, fps, config: HEAVY });
  const winIn = winAt(frame);
  // Whether a value built from the frame moves into or out of this frame.
  const stirs = (at: (f: number) => number, eps: number) =>
    Math.abs(at(frame + 1) - at(frame)) > eps ||
    Math.abs(at(frame) - at(frame - 1)) > eps;
  const agentLvl = level(plan.turns, "agent", frame) * (1 - ended);
  const callerLvl = level(plan.turns, "caller", frame) * (1 - ended);
  const toolLive = plan.turns.find(
    (p) => p.turn.tool && frame >= p.toolStart && frame < p.toolDone,
  );
  const agentState =
    ended > 0.5
      ? "Ended"
      : agentLvl > 0.04
        ? "Speaking"
        : toolLive
          ? "Working"
          : "Listening";
  const callerState =
    ended > 0.5 ? "Ended" : callerLvl > 0.04 ? "Speaking" : "Listening";
  const latency = Math.round(380 + 90 * noise(3, frame / 18));
  const camAt = (f: number) =>
    interpolate(
      f,
      [
        plan.summaryAt + summaryEl.beat("lean"),
        plan.summaryAt + summaryEl.beat("leanEnd"),
      ],
      [1, 1.025],
      {
        ...clampX,
        easing: CAMERA,
      },
    );
  const cam = camAt(frame);
  // The window carries the whole call, so its tilt covers everything inside
  // while it rises or the camera leans in; the movers inside tilt themselves
  // only while it holds still.
  const winMoving =
    stirs((f) => (1 - winAt(f)) * 80, 5e-4) ||
    stirs((f) => (0.96 + 0.04 * winAt(f)) * camAt(f), 1e-6);
  const held = !winMoving;
  const live = 1 - ended;
  const endPressAt = (f: number) =>
    spring({
      frame: f - plan.callEnd - hangup.beat("press"),
      fps,
      config: CHIP,
    }) -
    spring({
      frame: f - plan.callEnd - hangup.beat("release"),
      fps,
      config: CHIP,
    });
  const endPress = endPressAt(frame);
  const endPressing = held && stirs((f) => Math.max(0, endPressAt(f)), 1e-5);

  // The transcript in flow order: every row and how far open it is.
  const flowAt = (f: number) => [
    ...plan.turns.map((p, i) => ({
      kind: "turn" as const,
      i,
      open: tween(
        f,
        p.start + p.el.beat("open"),
        p.start + p.el.beat("opened"),
        MOVE,
      ),
    })),
    {
      kind: "end" as const,
      i: -1,
      open:
        f >= plan.callEnd
          ? tween(f, plan.callEnd, plan.callEnd + hangup.beat("close"), MOVE)
          : 0,
    },
    {
      kind: "summary" as const,
      i: -1,
      open:
        f >= plan.summaryAt + summaryEl.beat("open")
          ? tween(
              f,
              plan.summaryAt + summaryEl.beat("open"),
              plan.summaryAt + summaryEl.beat("opened"),
              MOVE,
            )
          : 0,
    },
  ];
  const flow = flowAt(frame);
  // A row that opens by layout pushes its neighbours by layout, and layout
  // rounds every baseline and box edge on the way: once the transcript
  // outgrows its panel and hangs from the bottom, each line above an opening
  // row clicks up pixel by pixel, and a row handed between layout and a
  // transform jumps. So the list is laid out once, with every row fully open
  // as it finally rests, and everything still to come is a transform on each
  // row, on every frame.
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [laid, setLaid] = useState({ room: 0, rows: [] as number[] });
  // A font that arrives after the first render rewraps the transcript with no
  // render to follow (a still, a paused player), so the frame is held until
  // the fonts are in and the heights have been read once more.
  const [handle] = useState(() => delayRender("voice-agent: measuring"));
  const [fontsIn, setFontsIn] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([hankenFont.waitUntilDone(), monoFont.waitUntilDone()])
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsIn(true);
        else continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);
  useLayoutEffect(() => {
    if (fontsIn) continueRender(handle);
  }, [fontsIn, handle]);
  // No dependency list: the copy and the font can change on any render. It
  // runs before the frame is painted, so a frame never shows the heights of
  // the one before.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const list = listRef.current;
    if (!panel || !list) return;
    const room = contentHeight(panel);
    const rows = Array.from(list.children, contentHeight);
    if (
      Math.abs(room - laid.room) > 1e-3 ||
      rows.length !== laid.rows.length ||
      rows.some((h, k) => Math.abs(h - laid.rows[k]) > 1e-3)
    ) {
      setLaid({ room, rows });
    }
  });
  const fullHeight = LIST_PAD + laid.rows.reduce((a, b) => a + b, 0);
  const listTop = (h: number) => Math.min(0, laid.room - h);
  // What each row still hides, and how far each sits off its laid-out place:
  // the list rests at the top of the panel while it fits and hangs from the
  // bottom once it does not, and a row moves up by everything the rows above
  // it still hide.
  const placeAt = (f: number) => {
    const hidden = flowAt(f).map(
      (row, k) => (laid.rows[k] ?? 0) * (1 - row.open),
    );
    const listShift =
      listTop(fullHeight - hidden.reduce((a, b) => a + b, 0)) -
      listTop(fullHeight);
    const rides = hidden.map(
      (_, k) => listShift - hidden.slice(0, k).reduce((a, b) => a + b, 0),
    );
    return { hidden, rides };
  };
  const { hidden, rides } = placeAt(frame);
  const ridesBefore = placeAt(frame - 1).rides;
  const ridesAfter = placeAt(frame + 1).rides;

  const L = tall
    ? { win: { x: 56, y: 100, w: 608, h: 1080 }, sideW: 608, sideH: 352 }
    : { win: { x: 136, y: 50, w: 1008, h: 620 }, sideW: 340, sideH: 0 };
  const headH = 64;
  const rise = (at: number): React.CSSProperties => {
    const riseAt = (f: number) =>
      (1 - spring({ frame: f - at, fps, config: CARD })) * 12;
    const p = spring({ frame: frame - at, fps, config: CARD });
    return {
      opacity: Math.min(1, p * 1.6),
      transform: `translateY(${(1 - p) * 12}px)${glide(held && stirs(riseAt, 5e-4))}`,
    };
  };

  const sidePanel = (
    <div
      style={{
        width: tall ? "auto" : L.sideW,
        height: tall ? L.sideH : "auto",
        flexShrink: 0,
        borderRight: tall ? "none" : `1px solid ${pal.hair}`,
        borderBottom: tall ? `1px solid ${pal.hair}` : "none",
        background: pal.side,
        padding: tall ? "8px 28px 20px" : "12px 28px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={rise(panelEl.start + 0 * panelEl.beat("stagger"))}>
        <Lane
          label={agentName}
          state={agentState}
          lvl={agentLvl}
          seed={11}
          frame={frame}
          color={accent}
          pal={pal}
          barsH={tall ? 44 : 84}
        />
      </div>
      <div
        style={{
          height: 1,
          background: pal.hair,
          ...rise(panelEl.start + 1 * panelEl.beat("stagger")),
        }}
      />
      <div style={rise(panelEl.start + 2 * panelEl.beat("stagger"))}>
        <Lane
          label={callerName}
          state={callerState}
          lvl={callerLvl}
          seed={47}
          frame={frame}
          color={pal.callerBar}
          pal={pal}
          barsH={tall ? 44 : 84}
        />
      </div>
      {tall ? null : (
        <div
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTop: `1px solid ${pal.hair}`,
            ...rise(panelEl.start + 3 * panelEl.beat("stagger")),
          }}
        >
          {[
            ["Caller", callerLine],
            ["Latency", ended > 0.5 ? "—" : `${latency} ms`],
          ].map(([kk, v]) => (
            <div
              key={kk}
              style={{
                display: "flex",
                justifyContent: "space-between",
                height: 32,
                alignItems: "center",
                fontSize: 16,
              }}
            >
              <span style={{ color: pal.faint }}>{kk}</span>
              <span
                style={{
                  color: pal.muted,
                  fontFamily: mono,
                  fontSize: 15.5,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          gap: 10,
          ...rise(panelEl.start + 4 * panelEl.beat("stagger")),
        }}
      >
        {(["mic", "volume"] as IconName[]).map((n) => (
          <div
            key={n}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: pal.card,
              boxShadow: pal.cardShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 1 - 0.5 * ended,
            }}
          >
            <Icon name={n} color={pal.muted} size={20} />
          </div>
        ))}
        <div
          style={{
            flex: 1,
            height: 48,
            borderRadius: 24,
            background: live > 0.5 ? pal.red : pal.card,
            boxShadow: live > 0.5 ? "none" : pal.cardShadow,
            color: live > 0.5 ? "#fff" : pal.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 17,
            transform: `scale(${1 - 0.04 * Math.max(0, endPress)})${glide(endPressing)}`,
          }}
        >
          <Icon
            name="phone"
            color={live > 0.5 ? "#fff" : pal.muted}
            size={18}
            style={{ transform: "rotate(135deg)" }}
          />
          {live > 0.5 ? endLabel : "Call ended"}
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <>
          <GshGround
            preset={ground ?? "kiruna"}
            params={
              groundParams ??
              (pal.dark
                ? undefined
                : {
                    background: "#edf3f0",
                    colors: ["#ffffff", "#bfe9d9", "#7cc9ad", "#e2ece7"],
                    grain: 0.05,
                  })
            }
            timeOffset={6}
            timeScale={0.3}
          />
          <AbsoluteFill style={{ background: pal.scrim }} />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: (width - DW * u) / 2,
            top: (height - DH * u) / 2,
            width: DW,
            height: DH,
            transformOrigin: "0 0",
            transform: `scale(${u})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: L.win.x,
              top: L.win.y,
              width: L.win.w,
              height: L.win.h,
              borderRadius: 18,
              background: pal.win,
              boxShadow: pal.shadow,
              overflow: "hidden",
              opacity: Math.min(1, winIn * 2),
              transform: `translateY(${(1 - winIn) * 80}px) scale(${(0.96 + 0.04 * winIn) * cam})${glide(winMoving)}`,
              transformOrigin: "60% 70%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: headH,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                padding: "0 28px",
                borderBottom: `1px solid ${pal.hair}`,
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span style={{ fontSize: 18, color: pal.text }}>{agentName}</span>
              <span style={{ fontSize: 16, color: pal.faint }}>
                {agentRole}
              </span>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 16,
                  color: live > 0.5 ? pal.red : pal.muted,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: live > 0.5 ? pal.red : pal.faint,
                    opacity:
                      live > 0.5
                        ? 0.55 + 0.45 * Math.abs(Math.cos(frame / 12))
                        : 1,
                  }}
                />
                {live > 0.5 ? "Live" : "Ended"}
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 16,
                    color: pal.text,
                    fontVariantNumeric: "tabular-nums",
                    width: 52,
                    textAlign: "right",
                  }}
                >
                  {clock(callSec)}
                </span>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: tall ? "column" : "row",
              }}
            >
              {sidePanel}
              <div
                ref={panelRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "0 32px 24px 28px",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, #000 40px)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, #000 40px)",
                }}
              >
                <div
                  ref={listRef}
                  style={{ marginBottom: "auto", paddingTop: LIST_PAD }}
                >
                  {flow.map((row, k) => {
                    const riding =
                      Math.abs(ridesBefore[k] - rides[k]) > 1e-6 ||
                      Math.abs(ridesAfter[k] - rides[k]) > 1e-6;
                    const grow = {
                      ride: rides[k],
                      // The row used to open as a `p`fr track in an
                      // auto-height grid: p of its content tall, with the
                      // content showing through the top p * p of it. So the
                      // clip takes off more than the row holds back.
                      hide: hidden[k] * (1 + row.open),
                      moving: riding,
                      shut: row.open <= 0,
                    };
                    // The movers inside mark their own moves only while the
                    // window and the row hold still.
                    const rowHeld = held && !riding;
                    if (row.kind === "turn") {
                      const p = plan.turns[row.i];
                      return (
                        <Grow key={`turn${row.i}`} {...grow}>
                          <div
                            style={{
                              opacity: tween(
                                frame,
                                p.start + p.el.beat("show"),
                                p.start + p.el.beat("shown"),
                              ),
                            }}
                          >
                            <TurnRow
                              p={p}
                              frame={frame}
                              pal={pal}
                              accent={accent}
                              agentName={agentName}
                              callerName={callerName}
                              startSeconds={startSeconds}
                              held={rowHeld}
                            />
                          </div>
                        </Grow>
                      );
                    }
                    if (row.kind === "end") {
                      return (
                        <Grow key="end" {...grow}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              padding: "14px 0 10px",
                              fontSize: 16,
                              color: pal.faint,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 1,
                                background: pal.hair,
                              }}
                            />
                            Call ended · {clock(callSec)}
                            <div
                              style={{
                                flex: 1,
                                height: 1,
                                background: pal.hair,
                              }}
                            />
                          </div>
                        </Grow>
                      );
                    }
                    return (
                      <Grow key="summary" {...grow}>
                        <SummaryCard
                          rows={summary}
                          title={summaryTitle}
                          status={summaryStatus}
                          el={summaryEl}
                          frame={frame}
                          fps={fps}
                          pal={pal}
                          callerLine={callerLine}
                          held={rowHeld}
                        />
                      </Grow>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(seed: number, t: number) {
  const i = Math.floor(t);
  const f = t - i;
  const k = f * f * (3 - 2 * f);
  return hash(seed * 57 + i) * (1 - k) + hash(seed * 57 + i + 1) * k;
}

const clock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type El = ResolvedElement<VoiceAgentElementId>;

interface TurnPlan {
  turn: VoiceTurn;
  words: string[];
  wordAt: number[];
  start: number;
  end: number;
  toolStart: number;
  toolDone: number;
  el: El;
  wordEls: El[];
  toolEl?: El;
}

/** Total frames of motion for a set of turns, so a shelf can size the clip. */
export function voiceAgentDuration(turns: VoiceTurn[] = DEFAULT_TURNS) {
  return Math.ceil(planVoiceTurns(turns).summaryAt + 40);
}

function level(turns: TurnPlan[], speaker: VoiceTurn["speaker"], f: number) {
  let v = 0;
  for (const p of turns) {
    if (p.turn.speaker !== speaker) continue;
    const on =
      tween(f, p.start + p.el.beat("voice"), p.start + p.el.beat("voiced")) *
      (1 -
        tween(
          f,
          p.end - p.el.beat("hush"),
          p.end + p.el.beat("hushed"),
          Easing.bezier(0.22, 1, 0.36, 1),
        ));
    if (on <= 0) continue;
    let syl = 0;
    for (const at of p.wordAt) {
      const d = (f - at - 1) / 1.6;
      syl = Math.max(syl, Math.exp(-d * d));
    }
    v = Math.max(v, on * (0.42 + 0.58 * syl) * (0.75 + 0.25 * noise(9, f / 3)));
  }
  return v;
}
