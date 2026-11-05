"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

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
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_TURNS: VoiceTurn[] = [
  {
    speaker: "agent",
    text: "Hi, this is Ava at Fernway. How can I help you tonight?",
  },
  {
    speaker: "caller",
    text: "Can I get a table for four this Saturday?",
  },
  {
    speaker: "agent",
    text: "Saturday works. I have 7:30 on the patio, or 8:15 inside if you would rather stay warm.",
    interruptedAfter: 12,
  },
  {
    speaker: "caller",
    text: "7:30 on the patio. It’s a birthday, too.",
  },
  {
    speaker: "agent",
    text: "Lovely, booking that for you now.",
    tool: {
      name: "book_table",
      pending: "Booking table at Fernway",
      done: "Booked table at Fernway",
      detail: "Sat · 7:30 pm · 4 guests",
      result: "FW-2841",
    },
  },
  {
    speaker: "agent",
    text: "You’re all set. Patio for four at 7:30, and I’ve added a birthday note.",
  },
];

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
const WPF = 2.4;
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

function Grow({ p, children }: { p: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: `${p}fr` }}>
      <div style={{ minHeight: 0, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function ToolRow({
  tool,
  start,
  done,
  frame,
  pal,
  accent,
}: {
  tool: VoiceToolCall;
  start: number;
  done: number;
  frame: number;
  pal: Pal;
  accent: string;
}) {
  const inP = tween(frame, start, start + 10);
  const swap = tween(frame, done, done + 8, MOVE);
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
        transform: `translateY(${(1 - inP) * 8}px)`,
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
}: {
  p: TurnPlan;
  frame: number;
  pal: Pal;
  accent: string;
  agentName: string;
  callerName: string;
  startSeconds: number;
}) {
  const agent = p.turn.speaker === "agent";
  const cut = p.turn.interruptedAfter ? tween(frame, p.end - 2, p.end + 6) : 0;
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
            const o = tween(frame, p.wordAt[k], p.wordAt[k] + 5);
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
        {p.turn.tool ? (
          <ToolRow
            tool={p.turn.tool}
            start={p.toolStart}
            done={p.toolDone}
            frame={frame}
            pal={pal}
            accent={accent}
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
  at,
  frame,
  fps,
  pal,
  callerLine,
}: {
  rows: VoiceSummaryRow[];
  title: string;
  status: string;
  at: number;
  frame: number;
  fps: number;
  pal: Pal;
  callerLine: string;
}) {
  const inP = spring({ frame: frame - at, fps, config: CARD });
  return (
    <div style={{ padding: "8px 2px 4px" }}>
      <div
        style={{
          borderRadius: 14,
          background: pal.card,
          boxShadow: pal.cardShadow,
          opacity: Math.min(1, inP * 1.6),
          transform: `translateY(${(1 - inP) * 24}px)`,
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
            const a = tween(frame, at + 4 + i * 2, at + 14 + i * 2);
            return (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  fontSize: 16,
                  opacity: a,
                  transform: `translateY(${(1 - a) * 6}px)`,
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
              at + 6 + rows.length * 2,
              at + 16 + rows.length * 2,
            ),
          }}
        >
          Confirmation texted to {callerLine}
        </div>
      </div>
    </div>
  );
}

export function VoiceAgent({
  agentName = "Ava",
  agentRole = "Fernway concierge",
  callerName = "Maya Chen",
  callerLine = "+1 (415) ••• 0192",
  turns = DEFAULT_TURNS,
  summaryTitle = "Call summary",
  summaryStatus = "Booked",
  summary = DEFAULT_SUMMARY,
  startSeconds = 41,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: VoiceAgentProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const DW = tall ? 720 : 1280;
  const DH = tall ? 1280 : 720;
  const u = Math.min(width / DW, height / DH);
  const pal = palette(theme);
  const tl = plan(turns);
  const ended = tween(frame, tl.callEnd, tl.callEnd + 8, MOVE);
  const callSec = startSeconds + Math.min(frame, tl.callEnd) / 30;
  const winIn = spring({ frame, fps, config: HEAVY });
  const agentLvl = level(tl.turns, "agent", frame) * (1 - ended);
  const callerLvl = level(tl.turns, "caller", frame) * (1 - ended);
  const toolLive = tl.turns.find(
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
  const cam = interpolate(
    frame,
    [tl.summaryAt - 10, tl.summaryAt + 40],
    [1, 1.025],
    {
      ...clampX,
      easing: CAMERA,
    },
  );
  const live = 1 - ended;
  const endPress =
    spring({ frame: frame - tl.callEnd + 2, fps, config: CHIP }) -
    spring({ frame: frame - tl.callEnd - 3, fps, config: CHIP });

  const L = tall
    ? { win: { x: 56, y: 100, w: 608, h: 1080 }, sideW: 608, sideH: 352 }
    : { win: { x: 136, y: 50, w: 1008, h: 620 }, sideW: 340, sideH: 0 };
  const headH = 64;
  const rise = (at: number): React.CSSProperties => {
    const p = spring({ frame: frame - at, fps, config: CARD });
    return {
      opacity: Math.min(1, p * 1.6),
      transform: `translateY(${(1 - p) * 12}px)`,
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
      <div style={rise(6)}>
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
      <div style={{ height: 1, background: pal.hair, ...rise(8) }} />
      <div style={rise(10)}>
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
            ...rise(12),
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
          ...rise(14),
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
            transform: `scale(${1 - 0.04 * Math.max(0, endPress)})`,
          }}
        >
          <Icon
            name="phone"
            color={live > 0.5 ? "#fff" : pal.muted}
            size={18}
            style={{ transform: "rotate(135deg)" }}
          />
          {live > 0.5 ? "End call" : "Call ended"}
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
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
            transform: `translateY(${(1 - winIn) * 80}px) scale(${(0.96 + 0.04 * winIn) * cam})`,
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
            <span style={{ fontSize: 16, color: pal.faint }}>{agentRole}</span>
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
              <div style={{ marginBottom: "auto", paddingTop: 14 }}>
                {tl.turns.map((p, i) => {
                  const g = tween(frame, p.start - 3, p.start + 7, MOVE);
                  if (g <= 0) return null;
                  return (
                    <Grow key={i} p={g}>
                      <div
                        style={{
                          opacity: tween(frame, p.start - 1, p.start + 7),
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
                        />
                      </div>
                    </Grow>
                  );
                })}
                {frame >= tl.callEnd ? (
                  <Grow p={tween(frame, tl.callEnd, tl.callEnd + 8, MOVE)}>
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
                        style={{ flex: 1, height: 1, background: pal.hair }}
                      />
                      Call ended · {clock(callSec)}
                      <div
                        style={{ flex: 1, height: 1, background: pal.hair }}
                      />
                    </div>
                  </Grow>
                ) : null}
                {frame >= tl.summaryAt - 2 ? (
                  <Grow
                    p={tween(frame, tl.summaryAt - 2, tl.summaryAt + 10, MOVE)}
                  >
                    <SummaryCard
                      rows={summary}
                      title={summaryTitle}
                      status={summaryStatus}
                      at={tl.summaryAt}
                      frame={frame}
                      fps={fps}
                      pal={pal}
                      callerLine={callerLine}
                    />
                  </Grow>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
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

interface TurnPlan {
  turn: VoiceTurn;
  words: string[];
  wordAt: number[];
  start: number;
  end: number;
  toolStart: number;
  toolDone: number;
}

function plan(turns: VoiceTurn[]) {
  let t = 12;
  const out: TurnPlan[] = [];
  for (const turn of turns) {
    const all = turn.text.split(" ");
    const n = Math.min(all.length, turn.interruptedAfter ?? all.length);
    const words = all.slice(0, n);
    if (turn.interruptedAfter) {
      words[n - 1] = `${words[n - 1].replace(/[,.]$/, "")}—`;
    }
    const wordAt: number[] = [];
    let w = t;
    for (const word of words) {
      wordAt.push(w);
      w += WPF + (/[,.?!]$/.test(word) ? 3 : 0);
    }
    const end = w + 2;
    let toolStart = -1;
    let toolDone = -1;
    let next = end + 9;
    if (turn.tool) {
      toolStart = end + 3;
      toolDone = toolStart + 30;
      next = toolDone + 10;
    } else if (turn.interruptedAfter) {
      next = end - 5;
    }
    out.push({ turn, words, wordAt, start: t, end, toolStart, toolDone });
    t = next;
  }
  const callEnd = (out[out.length - 1]?.end ?? 0) + 12;
  return { turns: out, callEnd, summaryAt: callEnd + 10 };
}

/** Total frames of motion for a set of turns, so a shelf can size the clip. */
export function voiceAgentDuration(turns: VoiceTurn[] = DEFAULT_TURNS) {
  return Math.ceil(plan(turns).summaryAt + 40);
}

function level(turns: TurnPlan[], speaker: VoiceTurn["speaker"], f: number) {
  let v = 0;
  for (const p of turns) {
    if (p.turn.speaker !== speaker) continue;
    const on =
      tween(f, p.start - 2, p.start + 2) *
      (1 - tween(f, p.end - 3, p.end + 2, Easing.bezier(0.22, 1, 0.36, 1)));
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
